import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function isRetryableError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  const code = err?.status || err?.code || 0;
  return (
    code === 503 ||
    code === 429 ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('too many requests') ||
    msg.includes('try again')
  );
}

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  // Use valid, stable Gemini model identifiers in priority order
  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ];
  let lastError: any = null;

  for (const model of models) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({ ...params, model });
        if (response && response.text) return response;
        // Empty response — try next model immediately
        break;
      } catch (err: any) {
        console.warn(`Model ${model} attempt ${attempt + 1} failed:`, err?.message || err);
        lastError = err;
        if (isRetryableError(err) && attempt < maxRetries) {
          // Exponential backoff: 2s, 4s
          const delay = 2000 * Math.pow(2, attempt);
          console.log(`Retrying ${model} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // Non-retryable or exhausted retries — move to next model
          break;
        }
      }
    }
  }
  throw lastError;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing.' });
    }

    const { premise, genre = 'Komedi Dramatis', sceneCount = 4, referenceImages = [] } = req.body;
    if (!premise && (!referenceImages || referenceImages.length === 0)) {
      return res.status(400).json({ error: 'Premise/ide cerita atau referensi gambar wajib diisi.' });
    }

    const ai = getAIClient();

    const systemInstruction = `Kamu adalah seorang penulis skenario viral profesional yang ahli membuat cerita pendek untuk YouTube Shorts, TikTok, dan Reels.
Tugasmu adalah membuat ALUR CERITA (outline) yang sangat menarik, emosional, dan menghibur berdasarkan ${referenceImages.length > 0 ? 'gambar referensi dan ' : ''}ide yang diberikan pengguna.
Output harus berupa JSON dengan struktur berikut persis:
{
  "judul": "Judul cerita yang catchy dan viral",
  "genre": "${genre}",
  "ringkasan": "2-3 kalimat ringkasan keseluruhan cerita",
  "adegan": [
    {
      "no": 1,
      "judul": "Judul adegan singkat",
      "deskripsi": "Deskripsi lengkap apa yang terjadi di adegan ini (2-3 kalimat)",
      "emosi": "Emosi dominan (lucu/dramatis/mengejutkan/sedih/epik/dll)",
      "aksi_kunci": "Satu kalimat aksi atau dialog utama yang paling memorable di adegan ini"
    }
  ]
}

ATURAN PENTING:
- Buat TEPAT ${sceneCount} adegan, tidak lebih tidak kurang.
- Setiap adegan harus punya alur yang jelas dan saling berkaitan.
- Adegan 1 WAJIB punya hook yang kuat untuk menahan penonton (twist, kejutan, atau momen lucu/dramatis yang intens).
- Adegan terakhir harus punya ending yang memuaskan atau cliffhanger yang membuat penonton ingin terus menonton.
- Gunakan bahasa Indonesia yang santai dan ekspresif.
- Genre yang diminta: ${genre}.
- ANTI-COPYRIGHT: DILARANG KERAS menggunakan nama karakter berhak cipta (misal: "Spider-Man", "Mickey Mouse"). Jika ide/referensi mengandung karakter berhak cipta, ganti namanya menjadi karakter generik (misal: "manusia laba-laba", "pahlawan super merah biru") agar tidak diblokir oleh filter keamanan AI.
${referenceImages.length > 0 ? '- WAJIB perhatikan gambar yang diunggah pengguna. Gunakan karakter, objek, atau situasi dalam gambar tersebut sebagai inspirasi utama alur cerita.' : ''}`;

    const parts: any[] = [];

    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const img of referenceImages) {
        if (img.base64) {
          const cleanBase64 = img.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
          parts.push({ inlineData: { mimeType: img.mimeType || 'image/jpeg', data: cleanBase64 } });
        }
      }
    }

    const textPrompt = referenceImages.length > 0
      ? `Buatkan alur cerita berdasarkan gambar referensi yang saya unggah ini. ${premise ? `\nIde tambahan/arahan dari saya: "${premise}"` : ''}\nGenre: ${genre}. Jumlah adegan: ${sceneCount}.`
      : `Buatkan alur cerita untuk ide berikut: "${premise}". Genre: ${genre}. Jumlah adegan: ${sceneCount}.`;

    parts.push({ text: textPrompt });

    const response = await generateWithFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            judul: { type: Type.STRING },
            genre: { type: Type.STRING },
            ringkasan: { type: Type.STRING },
            adegan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.INTEGER },
                  judul: { type: Type.STRING },
                  deskripsi: { type: Type.STRING },
                  emosi: { type: Type.STRING },
                  aksi_kunci: { type: Type.STRING },
                },
                required: ['no', 'judul', 'deskripsi', 'emosi', 'aksi_kunci'],
              },
            },
          },
          required: ['judul', 'genre', 'ringkasan', 'adegan'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error('Tidak ada output dari Gemini API.');
    const parsedData = JSON.parse(textOutput);
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/generate-story:', error);
    const errMsg: string = error?.message || 'Gagal membuat alur cerita.';
    const is503 =
      errMsg.toLowerCase().includes('unavailable') ||
      errMsg.toLowerCase().includes('high demand') ||
      errMsg.toLowerCase().includes('overloaded') ||
      errMsg.includes('503');
    const friendlyMsg = is503
      ? 'Server AI sedang sibuk (high demand). Semua model sudah dicoba. Silakan coba lagi dalam 30-60 detik.'
      : errMsg;
    res.status(is503 ? 503 : 500).json({ error: friendlyMsg });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function getGeminiClient(apiKey: string): GoogleGenAI {
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
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('try again') ||
    msg.includes('timeout')
  );
}

async function generateWithGeminiFallback(ai: GoogleGenAI, params: any): Promise<string> {
  const models = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash',
    'gemini-flash-latest',
  ];
  let lastError: any = null;
  let hasOverloadError = false;

  for (const model of models) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({ ...params, model });
        if (response && response.text) return response.text;
        break; // break attempt loop if response is somehow empty but no error
      } catch (err: any) {
        console.warn(`[flow-prompts] Model ${model} attempt ${attempt + 1} failed:`, err?.message || err);
        lastError = err;
        
        if (isRetryableError(err)) {
          hasOverloadError = true;
          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            break; // exhausted retries for this model
          }
        } else {
          break; // non-retryable error (like 404), move to next model
        }
      }
    }
  }
  
  if (hasOverloadError) {
    throw new Error("Server AI sedang sangat sibuk (Overloaded). Silakan coba lagi dalam beberapa menit.");
  }
  throw lastError;
}

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      customPrompt,
      referenceImages,
      apiKey,
    } = req.body;

    if (!apiKey) {
      return res.status(401).json({ error: 'API Key Gemini tidak ditemukan. Harap masukkan API Key Anda di halaman utama.' });
    }

    const hasImages = Array.isArray(referenceImages) && referenceImages.length > 0;

    // ✅ System instruction: Output schema baru per adegan — sesuai format yang diminta user.
    const systemInstruction = `You are a world-class AI Video Director, Storyboard Artist, and Viral Content Strategist.

Your job is to read the uploaded storyboard images and the user's MASTER INSTRUCTION, then output a highly detailed JSON response.

====== CRITICAL RULE: OUTPUT STRUCTURE ======
You MUST output exactly ONE valid JSON root object with keys in this EXACT order:

{
  "storyTitle": "Catchy viral title in Bahasa Indonesia",
  "storySummary": "2-3 sentence story overview in Bahasa Indonesia",
  "visualStyleGuide": "Visual consistency guide: art style, lighting, colors",
  "characterDNA": [ { "name": "Character Name", "appearance": "Full description" } ],
  "hooks": [
    {
      "type": "visual",
      "hook_text": "Hook dialog in Bahasa Indonesia",
      "visual_cue": "Visual description",
      "audio_cue": "Audio/music description"
    }
  ],
  "viralMetadata": {
    "viral_titles": ["Title option 1", "Title option 2", "Title option 3"],
    "viral_hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
    "youtube_description": "Full YouTube description with CTA in Bahasa Indonesia",
    "supporting_hashtags": [ { "category": "Category Name", "tags": ["#tag"] } ],
    "pinned_comment_suggestion": "Pinned comment text in Bahasa Indonesia"
  },
  "flowAiPrompts": [ /* see schema below */ ]
}

IMPORTANT: Generate "hooks" and "viralMetadata" BEFORE "flowAiPrompts". Do not skip them.

====== MANDATORY SCHEMA: Each element in "flowAiPrompts" MUST follow this EXACT structure ======
Every single field below is REQUIRED. Do NOT omit, abbreviate, or rename any field.

{
  "part": "Part [N]",
  "prompt": "[prompt number as string: \"1\", \"2\", or \"3\"]",
  "duration": "10 detik",
  "scene": "Deskripsi singkat scene dalam Bahasa Indonesia (1 kalimat).",
  "reference_priority": "Reference image adalah sumber kebenaran visual utama. Pertahankan identitas seluruh karakter, hewan, pakaian, background, object, style, warna, proporsi, lighting dan kontinuitas.",
  "continuity_start": "Mulai tepat setelah [prompt/part sebelumnya]. Jelaskan kondisi awal scene secara spesifik.",
  "characters": {
    "[NamaKarakter1]": "Deskripsi visual LENGKAP karakter 1: rambut, wajah, kulit, mata, ekspresi, usia visual, tubuh, proporsi, pakaian warna, detail pakaian, aksesori, ciri khas — semua detail dari reference image.",
    "[NamaKarakter2]": "Deskripsi visual LENGKAP karakter 2."
  },
  "background": "Deskripsi environment: lokasi spesifik, waktu hari, cuaca, kondisi pencahayaan, vegetasi, elemen lingkungan, warna dominan, suasana visual.",
  "object": "Deskripsi semua object fisik penting dalam scene: nama, warna, ukuran, posisi, fungsi dalam cerita.",
  "voice_lock": {
    "[NamaKarakter1]": "Deskripsi suara karakter 1 (karakter, nada, usia, emosi).",
    "[NamaKarakter2]": "Deskripsi suara karakter 2.",
    "rule": "Jangan menukar suara atau speaker. Setiap karakter hanya mengucapkan dialognya sendiri."
  },
  "video_prompt": "PROMPT VIDEO UTAMA — tulis dengan sangat detail dan panjang (minimum 150 kata). Sertakan: (1) kondisi awal scene persis dari akhir prompt sebelumnya, (2) aksi setiap karakter secara kronologis, (3) setiap baris dialog dengan speaker yang jelas, (4) ekspresi dan reaksi karakter, (5) gerakan kamera, (6) suasana dan atmosphere, (7) kondisi akhir yang dapat disambungkan ke prompt berikutnya. Gunakan Bahasa Indonesia.",
  "dialogue": [
    { "speaker": "[NamaKarakter]", "text": "Ucapan lengkap karakter dalam Bahasa Indonesia." }
  ],
  "camera": {
    "shot": "Jenis shot (e.g. tracking medium wide shot, close-up, medium shot).",
    "angle": "Sudut kamera (e.g. eye-level anak, low angle, over-the-shoulder).",
    "movement": "Gerakan kamera (e.g. tracking shot lembut, slow push-in, slow pull-back).",
    "focus": "Teknik fokus (e.g. rack focus dari karakter A ke karakter B).",
    "composition": "Komposisi frame (e.g. karakter di foreground, lingkungan terlihat di background)."
  },
  "sound": {
    "ambience": "Suara latar alami (e.g. suara hutan siang, burung, angin, dedaunan).",
    "sfx": "Sound effects spesifik per kejadian dalam scene (e.g. langkah kaki, suara object disentuh).",
    "music": "Jenis musik latar (e.g. musik petualangan anak ceria, musik edukatif dengan ritme ringan).",
    "dialogue_rule": "Urutan dialog eksplisit (e.g. Karakter A berbicara dulu, kemudian Karakter B. Tidak overlap)."
  },
  "no_text": "Tidak boleh ada subtitle, caption, text overlay, judul, speech bubble, watermark, logo, UI atau notification di dalam video.",
  "ending": "Kondisi akhir scene ini — posisi setiap karakter, apa yang baru terjadi, apa yang terlihat di frame.",
  "next_prompt": "Prompt [N+1] dimulai dari kondisi ketika [kondisi akhir scene ini]."
}

ADDITIONAL RULES:
- The LAST prompt of the LAST part: replace "next_prompt" with "next_part_hook" describing what Part [N+1] will begin with.
- "video_prompt" MUST be the longest field. Write minimum 150 words for it.
- "characters" MUST include ALL characters appearing in that scene.
- "dialogue" MUST list ALL spoken lines in chronological order.
- Each scene prompt MUST start exactly where the previous one ended — no time jumps.
- NEVER swap speakers. NEVER have a character speak another character's lines.
- NEVER put any text on screen.

====== OUTPUT RULES ======
1. ALL narrative content (dialogue, action, description, sound, hooks, metadata) MUST be in Bahasa Indonesia.
2. NEVER add any explanation or markdown text OUTSIDE the JSON object.
3. Dialogues MUST be assigned to the CORRECT speaker. Never mix up speakers.`;

    const parts: any[] = [];
    
    if (hasImages) {
      parts.push({ text: "VISUAL REFERENCES - These storyboard images are your primary visual source. READ all text, dialogues, character designs, scene descriptions, and Part labels written inside the images. Extract character DNA (appearance, clothing, accessories, colors) for each character shown." });
      for (const img of referenceImages) {
        if (img.base64) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: img.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, ''),
            },
          });
        }
      }
    }

    const userPromptText = `--- MASTER INSTRUCTION (ABSOLUTE LAW) ---
${customPrompt}

--- EXECUTION STEPS ---
1. ANALYZE the storyboard images above — read ALL text, dialogues, character appearances, and story elements.
2. READ the MASTER INSTRUCTION above. You MUST follow every single rule, constraint, and formatting requirement listed in it.
3. GENERATE each requested scene as a FULLY DETAILED JSON object exactly matching the structure, keys, and values requested in the MASTER INSTRUCTION. Do not omit ANY field. Do not summarize.
4. Place all these scene JSON objects exactly as they are inside the "flowAiPrompts" array.
5. AUTO-GENERATE the "hooks" and "viralMetadata" fields.
6. Return the complete single JSON root object.`;

    parts.push({ text: userPromptText });

    const ai = getGeminiClient(apiKey);
    const textOutput = await generateWithGeminiFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3, // Lower temperature to force strict adherence to the master prompt
      },
    });

    if (!textOutput) {
      throw new Error('Tidak ada output teks yang diterima dari Gemini API.');
    }

    // Clean up markdown fences if any
    let cleanText = textOutput.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse JSON output from AI:', textOutput);
      return res.status(500).json({
        error: 'AI mengembalikan format yang tidak valid (bukan JSON murni). Silakan klik Generate ulang.',
      });
    }

    // ✅ Normalize for frontend: aggressively extract fields no matter the schema
    const normalize = (rawData: any): any => {
      // Flatten if wrapped in "master_prompt", "data", "result", etc.
      let data = rawData;
      if (data.master_prompt) data = { ...data, ...data.master_prompt };
      if (data.data) data = { ...data, ...data.data };

      // Helper to find the first array of objects that looks like scenes
      const findScenesArray = (obj: any): any[] => {
        if (Array.isArray(obj.flowAiPrompts)) return obj.flowAiPrompts;
        if (Array.isArray(obj.scenes)) return obj.scenes;
        if (Array.isArray(obj.adegan)) return obj.adegan;
        if (Array.isArray(obj.prompts)) return obj.prompts;
        if (Array.isArray(obj.storyboard)) return obj.storyboard;
        // Search values
        for (const key in obj) {
          if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
            const first = obj[key][0];
            if (first.prompt || first.scene || first.deskripsi || first.action || first.kamera) {
              return obj[key];
            }
          }
        }
        return [];
      };

      const findHooksArray = (obj: any): any[] => {
        if (Array.isArray(obj.hooks)) return obj.hooks;
        if (Array.isArray(obj.viral_hooks)) return obj.viral_hooks;
        if (Array.isArray(obj.hook_penahan)) return obj.hook_penahan;
        for (const key in obj) {
          if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
            if (obj[key][0].hook_text || obj[key][0].type || obj[key][0].visual_cue) return obj[key];
          }
        }
        return [];
      };

      // Deep search for viralMetadata — check multiple possible locations
      const findViralMetadata = (obj: any): any => {
        // Direct match
        if (obj.viralMetadata && typeof obj.viralMetadata === 'object') return obj.viralMetadata;
        if (obj.viral_metadata && typeof obj.viral_metadata === 'object') return obj.viral_metadata;
        // Sometimes AI nests it under a wrapper key
        for (const key in obj) {
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const nested = obj[key];
            if (
              Array.isArray(nested.viral_titles) ||
              Array.isArray(nested.viral_hashtags) ||
              typeof nested.youtube_description === 'string'
            ) {
              return nested;
            }
          }
        }
        return {};
      };

      const flowAiPrompts = findScenesArray(data);
      const hooks = findHooksArray(data);
      const vm = findViralMetadata(data);

      console.log('[normalize] viralMetadata found:', JSON.stringify(vm).substring(0, 200));
      console.log('[normalize] hooks found:', hooks.length, 'items');
      console.log('[normalize] flowAiPrompts found:', flowAiPrompts.length, 'items');

      return {
        ...rawData, // keep original raw data
        storyTitle: data.storyTitle || data.title || data.judul || 'Storyboard Baru',
        storySummary: data.storySummary || data.story_summary || data.ringkasan || '',
        visualStyleGuide: typeof data.visualStyleGuide === 'string' ? data.visualStyleGuide : 
                         (typeof data.visual_consistency === 'string' ? data.visual_consistency : JSON.stringify(data.visual_consistency || data.visualStyleGuide || '')),
        characterDNA: Array.isArray(data.characterDNA) ? data.characterDNA : (Array.isArray(data.characters) ? data.characters : (Array.isArray(data.karakter) ? data.karakter : [])),
        flowAiPrompts,
        hooks,
        viralMetadata: {
          viral_titles: Array.isArray(vm.viral_titles) ? vm.viral_titles : (Array.isArray(data.viral_titles) ? data.viral_titles : []),
          viral_hashtags: Array.isArray(vm.viral_hashtags) ? vm.viral_hashtags : (Array.isArray(data.viral_hashtags) ? data.viral_hashtags : []),
          youtube_description: vm.youtube_description || data.youtube_description || vm.deskripsi || '',
          supporting_hashtags: Array.isArray(vm.supporting_hashtags) ? vm.supporting_hashtags : [],
          pinned_comment_suggestion: vm.pinned_comment_suggestion || vm.pinned_comment || data.pinned_comment || '',
        },
      };
    };

    res.json(normalize(parsedData));

  } catch (error: any) {
    console.error('Error in /api/generate-flow-prompts:', error);
    const errMsg: string = error?.message || String(error) || 'Terjadi kesalahan saat membuat storyboard & prompt Flow AI.';
    const is503 =
      errMsg.toLowerCase().includes('unavailable') ||
      errMsg.toLowerCase().includes('high demand') ||
      errMsg.toLowerCase().includes('overloaded') ||
      errMsg.includes('503') ||
      errMsg.includes('429');
    const friendlyMsg = is503
      ? 'Server AI sedang sibuk. Semua model sudah dicoba. Silakan coba lagi dalam 30-60 detik.'
      : errMsg;
    res.status(is503 ? 503 : 500).json({ error: friendlyMsg });
  }
}

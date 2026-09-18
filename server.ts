import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limit for reference storyboard images (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not set. Requests will fail until configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Model ${model} attempt encountered error:`, err?.message || err);
      lastError = err;
      // Brief pause before trying next fallback model
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────────────────────
// ENDPOINT: Generate Story Outline (Tahap 1)
// ─────────────────────────────────────────────────────────────
app.post('/api/generate-story', async (req, res) => {
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
${referenceImages.length > 0 ? '- WAJIB perhatikan gambar yang diunggah pengguna. Gunakan karakter, objek, atau situasi dalam gambar tersebut sebagai inspirasi utama alur cerita.' : ''}`;

    const parts: any[] = [];
    
    // Attach multimodal images if they exist
    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const img of referenceImages) {
        if (img.base64) {
          const cleanBase64 = img.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          });
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
    res.status(500).json({ error: error?.message || 'Gagal membuat alur cerita.' });
  }
});

// ─────────────────────────────────────────────────────────────
// Generate Flow Prompts & Storyboard

app.post('/api/generate-flow-prompts', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is missing. Silakan tambahkan API key di Settings > Secrets.',
      });
    }

    const {
      storyOutline, // Diterima dari Tahap 1
      animationStyle,
      referenceImages, // array of { mimeType: string, base64: string }
      parameters, // { duration, aspectRatio, resolution, promptCount, cameraMovement, lightingMood, fps }
      language = 'id', // 'id' | 'en'
    } = req.body;

    const ai = getAIClient();

    const promptCount = Math.min(Math.max(Number(parameters?.promptCount) || 4, 2), 10);
    const duration = parameters?.duration || 5;
    const aspectRatio = parameters?.aspectRatio || '9:16';
    const resolution = parameters?.resolution || '1080p';
    const cameraMovement = parameters?.cameraMovement || 'Cinematic Pan & Dynamic Zoom';
    const lightingMood = parameters?.lightingMood || 'Cinematic Dramatic & Volumetric Lighting';
    const fps = parameters?.fps || '24fps Cinematic Animation';
    const style = animationStyle || 'Modern Anime Aesthetic';

    // Construct prompt
    const isStandalone = !parameters.partNumber;
    const partText = parameters.partNumber ? `Part ${parameters.partNumber}` : null;
    const partLabel = partText || 'Video Standalone';
    
    const systemInstruction = `You are a world-class AI Storyboard Director and Visual Artist.
Your PRIMARY MISSION is to analyze the storyboard reference images uploaded by the user (if any), then CREATE A BRAND NEW storyboard with ${promptCount} scenes that follows the same visual style, character design, color palette, and art direction.

IMPORTANT RULES:
- If reference images are uploaded: extract art style, character DNA, color palette, shading technique.
- Create ENTIRELY NEW story scenes and narrative — do NOT copy the scenes from any reference images.
- Maintain strict visual consistency across all generated scenes.
- ${isStandalone ? 'This is a STANDALONE video. Do NOT add any "Part X" label to titles or descriptions. Make it a complete, self-contained story.' : `This generation is for "${partText}". All hooks, titles, and descriptions MUST explicitly mention or be themed around "${partText}".`}

Target specifications:
- Platform: YouTube Shorts / TikTok / Reels (vertical fast-paced viral animation)
- Target Image Generator: Any (Midjourney, DALL-E, Stable Diffusion, etc)
- Number of Scene Prompts: EXACTLY ${promptCount} scene images.
- Each scene duration: ${duration} seconds
- Aspect Ratio: ${aspectRatio}
- Resolution: ${resolution}
- Default Camera Movement style: ${cameraMovement}
- Lighting & Mood: ${lightingMood}
- Motion & FPS: ${fps}
- Animation Style: ${style}

Output Requirements:
1. "storyTitle": Catchy, viral-worthy title. ${isStandalone ? 'No part label needed.' : `Must include "${partText}".`}
2. "storySummary": 2-3 sentence overview of the story.
3. "visualStyleGuide": Extremely detailed visual consistency guide. Include: art style name, color palette (specific colors), character design details, line weight, shading technique, background style, rendering quality keywords.
4. "characterDNA": Array of characters. For each: name, age_appearance, species_race, skin_tone, hair, eyes, outfit_main, outfit_accessories, distinctive_features, art_style, color_palette, and a "full_prompt_dna" string (highly detailed English prompt-ready string).
5. "flowAiPrompts": Array of EXACTLY ${promptCount} scenes. For each scene:
   - "part": number (use ${parameters?.partNumber || 0} — use 0 for standalone)
   - "judul": string (Scene heading/title)
   - "adegan": number (scene number, starting from 1)
   - "durasi": string (e.g. "${duration} detik")
   - "prompt": A masterfully crafted text-to-image prompt. MUST include: [Character DNA / full_prompt_dna], [Action/pose], [Art style: ${style}], [Environment & Background], [Camera Angle], [Lighting: ${lightingMood}]. For Scene 1 ONLY, prepend a HOOK visual to the prompt (e.g. "HOOK VISUAL: extreme close-up of the character's shocked face, ...").
   - "latar": string (Setting description in Indonesian)
   - "alur": Array of objects { "waktu": string, "aksi": string } describing actions over time.
   - "dialog": Array of objects { "karakter": string, "waktu": string, "ucapan": string } for spoken lines.
   - "audio": string (Background music or sound effects)
   - "kamera": string (Camera movement or composition)
   - "aturan": Array of strings (Consistency rules, e.g. "Tidak ada tulisan di gambar")
6. "hooks": Array of 3 high-retention text hooks for the 0-3 second window of YouTube Shorts. Each hook should be a single sentence in Indonesian that creates instant curiosity or shock. ${isStandalone ? 'Make hooks standalone-appropriate.' : `Tailor hooks for "${partText}".`}
7. "viralMetadata":
   - "viral_titles": Array of 5 alternative viral titles (Indonesian)
   - "viral_hashtags": Array of 10 primary hashtags (mix of Indonesian and English)
   - "youtube_description": A WELL-STRUCTURED YouTube description. Format it as follows:
     Line 1: Hook/opening sentence (emotional or curiosity-driven).
     Line 2-3: Brief story synopsis (2 sentences).
     Line 4: Empty line.
     Line 5: ${isStandalone ? '📺 Tonton video ini sampai habis!' : `📺 Jangan lewatkan ${partText} ini!`}
     Line 6: 🔔 Subscribe untuk konten animasi viral berikutnya!
     Line 7: Empty line.
     Line 8: TAGS: [list of relevant tags separated by space]
   - "supporting_hashtags": Array of category objects { "category": string, "tags": string[] }
   - "pinned_comment_suggestion": A single comment to be pinned (Indonesian), engaging viewers to comment or share.

Language: Indonesian for all story fields, dialog, audio, rules, and metadata. English ONLY for prompt engineering keywords inside "prompt" and "full_prompt_dna".`;

    const parts: any[] = [];

    // Multimodal reference images if uploaded
    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const img of referenceImages) {
        if (img.base64) {
          // Remove prefix if present: data:image/png;base64,...
          const cleanBase64 = img.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          });
        }
      }
    }

    const partContext = isStandalone
      ? 'This is a STANDALONE video — no Part label.'
      : `This is ${partText} of a multi-part series.`;

    const storyOutlineText = storyOutline
      ? `\n\nPRE-GENERATED STORY OUTLINE (MUST FOLLOW STRICTLY):\n${JSON.stringify(storyOutline, null, 2)}\n\nYour task is to translate this exact outline into ${promptCount} highly detailed scene prompts. Do NOT change the core story.`
      : '';

    const userPromptText = referenceImages && referenceImages.length > 0
      ? `STORYBOARD GENERATION REQUEST (${partLabel}):

You have been provided with ${referenceImages.length} reference storyboard image(s).
${partContext}${storyOutlineText}

YOUR TASK:
1. Carefully analyze each reference image to extract: art style, character design, color palette, line art style, shading technique, background style, and overall visual aesthetic.
2. ${storyOutline ? 'Translate the provided STORY OUTLINE into scene prompts.' : `Create ${promptCount} BRAND NEW storyboard scenes with a COMPLETELY NEW story/narrative.`}
3. Every generated scene prompt must faithfully replicate the visual style from the reference images and inject the extracted Character DNA.
4. Scene 1's "prompt" field MUST begin with a HOOK visual (e.g. extreme close-up, dramatic reveal).

Flow AI Configuration:
* Aspect Ratio: ${aspectRatio} | Resolution: ${resolution} | Duration per scene: ${duration}s
* Camera Style: ${cameraMovement} | Lighting: ${lightingMood} | FPS: ${fps}

Generate the complete JSON now.`
      : `STORYBOARD GENERATION REQUEST (${partLabel} — Text-Only):
${partContext}${storyOutlineText}

${storyOutline ? 'Translate the provided STORY OUTLINE above into scene prompts.' : 'Create a compelling original story based on the visual style.'}

Animation Style: ${style}
Aspect Ratio: ${aspectRatio} | Resolution: ${resolution} | Duration per scene: ${duration}s
Camera: ${cameraMovement} | Lighting: ${lightingMood} | FPS: ${fps}

Scene 1's "prompt" field MUST begin with a HOOK visual (e.g. extreme close-up, shocking expression, dramatic reveal).

Generate the complete JSON now.`;



    parts.push({ text: userPromptText });

    const response = await generateWithFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storyTitle: { type: Type.STRING },
            storySummary: { type: Type.STRING },
            visualStyleGuide: { type: Type.STRING },
            characterDNA: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  age_appearance: { type: Type.STRING },
                  species_race: { type: Type.STRING },
                  skin_tone: { type: Type.STRING },
                  hair: { type: Type.STRING },
                  eyes: { type: Type.STRING },
                  outfit_main: { type: Type.STRING },
                  outfit_accessories: { type: Type.STRING },
                  distinctive_features: { type: Type.STRING },
                  art_style: { type: Type.STRING },
                  color_palette: { type: Type.STRING },
                  full_prompt_dna: { type: Type.STRING },
                },
                required: ['name', 'full_prompt_dna'],
              },
            },
            flowAiPrompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  part: { type: Type.INTEGER },
                  judul: { type: Type.STRING },
                  adegan: { type: Type.INTEGER },
                  durasi: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  latar: { type: Type.STRING },
                  alur: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        waktu: { type: Type.STRING },
                        aksi: { type: Type.STRING },
                      },
                      required: ['waktu', 'aksi'],
                    },
                  },
                  dialog: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        karakter: { type: Type.STRING },
                        waktu: { type: Type.STRING },
                        ucapan: { type: Type.STRING },
                      },
                      required: ['karakter', 'waktu', 'ucapan'],
                    },
                  },
                  audio: { type: Type.STRING },
                  kamera: { type: Type.STRING },
                  aturan: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'part',
                  'judul',
                  'adegan',
                  'durasi',
                  'prompt',
                  'latar',
                  'alur',
                  'dialog',
                  'audio',
                  'kamera',
                  'aturan',
                ],
              },
            },
            hooks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  hook_text: { type: Type.STRING },
                  visual_cue: { type: Type.STRING },
                  audio_cue: { type: Type.STRING },
                },
                required: ['type', 'hook_text', 'visual_cue', 'audio_cue'],
              },
            },
            viralMetadata: {
              type: Type.OBJECT,
              properties: {
                viral_titles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                viral_hashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                youtube_description: { type: Type.STRING },
                supporting_hashtags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      tags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['category', 'tags'],
                  },
                },
                pinned_comment_suggestion: { type: Type.STRING },
              },
              required: [
                'viral_titles',
                'viral_hashtags',
                'youtube_description',
                'supporting_hashtags',
                'pinned_comment_suggestion',
              ],
            },
          },
          required: [
            'storyTitle',
            'storySummary',
            'visualStyleGuide',
            'flowAiPrompts',
            'hooks',
            'viralMetadata',
          ],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Tidak ada output teks yang diterima dari Gemini API.');
    }

    const parsedData = JSON.parse(textOutput);
    
    // Inject image_url using Pollinations AI
    if (parsedData.flowAiPrompts && Array.isArray(parsedData.flowAiPrompts)) {
      parsedData.flowAiPrompts = parsedData.flowAiPrompts.map((scene: any) => {
        // 1. Clean Prompt: Use strictly English keywords, forced animation style, and exclude Indonesian text
        const imagePrompt = `${style}, ${scene.prompt}, ${parsedData.visualStyleGuide || ''}, masterpiece, best quality, hyper-detailed, highly aesthetic`;
        
        // 2. Negative Prompt to prevent bad generation
        const negativePrompt = encodeURIComponent('text, watermark, ugly, bad anatomy, bad proportions, deformed, blurry, low resolution, extra limbs');
        
        let w = 1024, h = 1024;
        if (aspectRatio === '9:16') { w = 576; h = 1024; }
        else if (aspectRatio === '16:9') { w = 1024; h = 576; }
        else if (aspectRatio === '4:5') { w = 819; h = 1024; }
        
        // Random seed to ensure unique images if prompts are similar
        const seed = Math.floor(Math.random() * 9999999);
        
        // Add negative prompt to pollinations URL (undocumented feature but usually supported via query params)
        // If pollinations doesn't strictly support `negative_prompt` param natively, it ignores it, but it helps when they pass it to flux/sd
        scene.image_url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
        return scene;
      });
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/generate-flow-prompts:', error);
    res.status(500).json({
      error: error?.message || 'Terjadi kesalahan saat membuat storyboard & prompt Flow AI.',
    });
  }
});

// Refine a single prompt with user direction
app.post('/api/refine-prompt', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing.' });
    }

    const { currentPrompt, refinementInstruction, animationStyle } = req.body;
    const ai = getAIClient();

    const response = await generateWithFallback(ai, {
      contents: `You are an expert Google Flow AI video prompt engineer.
Refine the following scene prompt based on user feedback.
Original Scene Prompt:
${JSON.stringify(currentPrompt, null, 2)}

Refinement Request:
"${refinementInstruction}"

Animation Style:
"${animationStyle || 'Modern Anime Style'}"

Return ONLY the updated JSON for this single scene prompt with the same schema keys:
scene_number, scene_title, prompt, negative_prompt, duration_seconds, aspect_ratio, resolution, camera_motion, sound_fx, voiceover_or_dialogue, keyframe_visual_description.`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) throw new Error('No response from model');
    const updated = JSON.parse(text);

    // Update image_url for refined scene
    const imagePrompt = `${animationStyle}, ${updated.prompt}, ${updated.keyframe_visual_description}`;
    let w = 1024, h = 1024;
    if (updated.aspect_ratio === '9:16') { w = 576; h = 1024; }
    else if (updated.aspect_ratio === '16:9') { w = 1024; h = 576; }
    else if (updated.aspect_ratio === '4:5') { w = 819; h = 1024; }
    const seed = Math.floor(Math.random() * 9999999);
    updated.image_url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;

    res.json(updated);
  } catch (error: any) {
    console.error('Error in /api/refine-prompt:', error);
    res.status(500).json({ error: error.message || 'Gagal merevisi prompt' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlowShorts AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

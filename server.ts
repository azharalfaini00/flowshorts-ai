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

    const { premise, genre = 'Komedi Dramatis', sceneCount = 4, referenceImages = [], language = 'id' } = req.body;
    if (!premise && (!referenceImages || referenceImages.length === 0)) {
      return res.status(400).json({ error: 'Premise/ide cerita atau referensi gambar wajib diisi.' });
    }

    const ai = getAIClient();

    const isEnglish = language === 'en';
    const langNote = isEnglish
      ? 'IMPORTANT: Generate ALL text fields (judul, ringkasan, deskripsi, emosi, aksi_kunci) in ENGLISH.'
      : 'Gunakan bahasa Indonesia yang santai dan ekspresif.';

    const systemInstruction = isEnglish
      ? `You are a professional viral scriptwriter specializing in short-form content for YouTube Shorts, TikTok, and Reels.
Your task is to create a highly engaging, emotional, and entertaining STORY OUTLINE based on ${referenceImages.length > 0 ? 'the reference images and ' : ''}the user's idea.
Output must be JSON with this exact structure:
{
  "judul": "Catchy and viral story title in English",
  "genre": "${genre}",
  "ringkasan": "2-3 sentence summary of the overall story in English",
  "adegan": [
    {
      "no": 1,
      "judul": "Short scene title in English",
      "deskripsi": "Full description of what happens in this scene (2-3 sentences) in English",
      "emosi": "Dominant emotion (funny/dramatic/surprising/sad/epic/etc)",
      "aksi_kunci": "One memorable action or key dialogue line from this scene in English"
    }
  ]
}

IMPORTANT RULES:
- Create EXACTLY ${sceneCount} scenes, no more, no less.
- Each scene must have a clear flow and be interconnected.
- Scene 1 MUST have a strong hook to retain viewers (twist, surprise, or intense funny/dramatic moment).
- The last scene must have a satisfying ending or cliffhanger.
- ${langNote}
- Requested genre: ${genre}.
${referenceImages.length > 0 ? '- MANDATORY: Pay attention to uploaded images. Use characters, objects, or situations in the images as main inspiration for the story.' : ''}`
      : `Kamu adalah seorang penulis skenario viral profesional yang ahli membuat cerita pendek untuk YouTube Shorts, TikTok, dan Reels.
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
- ${langNote}
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

    const textPrompt = isEnglish
      ? referenceImages.length > 0
        ? `Create a story outline based on the reference images I uploaded. ${premise ? `\nAdditional direction from me: "${premise}"` : ''}\nGenre: ${genre}. Number of scenes: ${sceneCount}. Write everything in English.`
        : `Create a story outline for the following idea: "${premise}". Genre: ${genre}. Number of scenes: ${sceneCount}. Write everything in English.`
      : referenceImages.length > 0
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
      storyOutline, // Received from Stage 1
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
    const isEnglish = language === 'en';

    // ── Language configuration ──────────────────────────────────────────────
    const requestedLanguageText = isEnglish ? 'ENGLISH' : 'INDONESIAN (Bahasa Indonesia)';
    const durText = isEnglish ? `${duration} seconds` : `${duration} detik`;
    const watchCta = isStandalone
      ? (isEnglish ? '📺 Watch this video until the end!' : '📺 Tonton video ini sampai habis!')
      : (isEnglish ? `📺 Don't miss ${partText}!` : `📺 Jangan lewatkan ${partText} ini!`);
    const subscribeCta = isEnglish
      ? '🔔 Subscribe for more viral animation content!'
      : '🔔 Subscribe untuk konten animasi viral berikutnya!';

    // ── Build per-scene outline mapping (only when storyOutline is provided) ─
    let outlineMappingRules = '';
    if (storyOutline && storyOutline.adegan && Array.isArray(storyOutline.adegan)) {
      const mappingLines = storyOutline.adegan.map((scene: any, i: number) =>
        `  Scene ${i + 1} (adegan ${scene.no}): Title="${scene.judul}" | Description="${scene.deskripsi}" | Emotion="${scene.emosi}" | Key Action="${scene.aksi_kunci}"`
      ).join('\n');
      outlineMappingRules = `

═══════════════════════════════════════════════════════════
⚠️  MANDATORY STORY OUTLINE — YOU MUST FOLLOW THIS EXACTLY
═══════════════════════════════════════════════════════════
The user has already created this story outline in Stage 2. Your ONLY job in flowAiPrompts is to EXPAND each scene below into full storyboard prompts. DO NOT invent a different story. DO NOT skip or merge scenes.

Per-Scene Mapping (STRICTLY follow this order):
${mappingLines}

For EACH scene above, apply these rules:
- "judul" field: use the scene Title above
- "alur" field: expand the Description into 3-5 time-stamped action steps
- "dialog" field: derive spoken lines directly from the Key Action
- "audio" field: choose music/sound that fits the Emotion tag
- "prompt" field: craft a descriptive prompt that visually depicts the Description + Emotion

The story title, summary, and overall narrative MUST match:
- Story Title: "${storyOutline.judul}"
- Genre: "${storyOutline.genre}"
- Story Summary: "${storyOutline.ringkasan}"
═══════════════════════════════════════════════════════════`;
    }

    // ── System instruction (mode-aware) ─────────────────────────────────────
    const hasOutline = Boolean(storyOutline && storyOutline.adegan);
    const missionStatement = hasOutline
      ? `Your PRIMARY MISSION is to FAITHFULLY EXPAND the provided story outline into ${promptCount} fully-detailed storyboard scene prompts. You are a translator of story beats into visual prompts — NOT a creative writer inventing a new story.`
      : `Your PRIMARY MISSION is to analyze the reference images (if any) and CREATE A BRAND NEW compelling storyboard with ${promptCount} scenes.`;

    const systemInstruction = `You are a world-class AI Storyboard Director and Visual Prompt Engineer.
${missionStatement}
${outlineMappingRules}

STORYLINE CONTINUITY RULES (CRITICAL):
- The scenes MUST form a single, continuous, and logical storyline.
- Scene 1 must lead directly into Scene 2, Scene 2 into Scene 3, and so on. 
- Do not create disjointed, repetitive, or independent scenes. The storyline must progress forward seamlessly.

VISUAL RULES:
- If reference images are uploaded: extract art style, character DNA, color palette, shading technique.
- Maintain strict visual consistency across all generated scenes.
- ${isStandalone ? 'This is a STANDALONE video. Do NOT add any "Part X" label to titles or descriptions.' : `This generation is for "${partText}". All hooks, titles, and descriptions MUST explicitly mention or be themed around "${partText}".`}

Target specifications:
- Platform: YouTube Shorts / TikTok / Reels (vertical fast-paced viral animation)
- Number of Scene Prompts: EXACTLY ${promptCount} scene images — no more, no less.
- Each scene duration: ${duration} seconds
- Aspect Ratio: ${aspectRatio} | Resolution: ${resolution}
- Camera Movement style: ${cameraMovement}
- Lighting & Mood: ${lightingMood}
- Motion & FPS: ${fps}
- Animation Style: ${style}

Output Requirements:
1. "storyTitle": Catchy, viral-worthy title. ${isStandalone ? 'No part label needed.' : `Must include "${partText}".`}
2. "storySummary": 2-3 sentence overview of the story.
3. "visualStyleGuide": Extremely detailed visual consistency guide (art style, color palette, shading, background, rendering keywords).
4. "characterDNA": Array of characters with full_prompt_dna.
5. "flowAiPrompts": Array of EXACTLY ${promptCount} scenes. For each:
   - "part": ${parameters?.partNumber || 0}
   - "judul": Scene heading/title
   - "adegan": scene number (1-based)
   - "durasi": "${durText}"
   - "prompt": Masterfully crafted text-to-image prompt. MUST include: [Character DNA], [Action/pose], [Art style: ${style}], [Environment], [Camera Angle], [Lighting]. Scene 1 ONLY: prepend "HOOK VISUAL: ..."
   - "latar": Setting description
   - "alur": Array of { "waktu": string, "aksi": string } — 3-5 time-stamped action steps
   - "dialog": Array of { "karakter": string, "waktu": string, "ucapan": string }
   - "audio": Background music or sound effects
   - "kamera": Camera movement or composition
   - "aturan": Array of visual consistency rules
6. "hooks": Array of 3 high-retention text hooks for 0-3 second window.
7. "viralMetadata": viral_titles (5), viral_hashtags (10), youtube_description (formatted), supporting_hashtags, pinned_comment_suggestion.

LANGUAGE RULES (STRICT):
- You MUST generate ALL text fields in the JSON in the requested language: ${requestedLanguageText}.
- This includes "prompt", "full_prompt_dna", "judul", "latar", "alur.aksi", "dialog.ucapan", "aturan", "hooks", and ALL other fields. DO NOT output English unless English is the requested language.
- youtube_description format:
  Line 1: Hook sentence.
  Line 2-3: Story synopsis.
  Line 4: (empty)
  Line 5: ${watchCta}
  Line 6: ${subscribeCta}
  Line 7: (empty)
  Line 8: TAGS: [relevant tags]`;

    const parts: any[] = [];

    // Multimodal reference images if uploaded
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

    const partContext = isStandalone
      ? 'This is a STANDALONE video — no Part label.'
      : `This is ${partText} of a multi-part series.`;

    const userPromptText = referenceImages && referenceImages.length > 0
      ? `STORYBOARD GENERATION REQUEST (${partLabel}):

You have been provided with ${referenceImages.length} reference storyboard image(s).
${partContext}
${hasOutline ? `
The story outline is already defined in the system instruction above — FOLLOW IT EXACTLY.
Your job: translate each outlined scene into a full visual storyboard prompt.` : `
YOUR TASK:
1. Carefully analyze each reference image to extract: art style, character design, color palette, line art style, shading technique, background style, and overall visual aesthetic.
2. Create ${promptCount} BRAND NEW storyboard scenes with a COMPLETELY NEW story/narrative.
3. Every generated scene prompt must faithfully replicate the visual style from the reference images and inject the extracted Character DNA.
4. Scene 1's "prompt" field MUST begin with a HOOK visual (e.g. extreme close-up, dramatic reveal).`}

Flow AI Configuration:
* Aspect Ratio: ${aspectRatio} | Resolution: ${resolution} | Duration per scene: ${duration}s
* Camera Style: ${cameraMovement} | Lighting: ${lightingMood} | FPS: ${fps}
* Output language for narrative: ${isEnglish ? 'English' : 'Indonesian'}

Generate the complete JSON now.`
      : `STORYBOARD GENERATION REQUEST (${partLabel} — Text-Only):
${partContext}
${hasOutline ? `
The story outline is already defined in the system instruction above — FOLLOW IT EXACTLY.
Translate each scene from the outline into a full storyboard prompt.` : `
Create a compelling original story. Animation Style: ${style}`}

Aspect Ratio: ${aspectRatio} | Resolution: ${resolution} | Duration per scene: ${duration}s
Camera: ${cameraMovement} | Lighting: ${lightingMood} | FPS: ${fps}
Output language for narrative: ${isEnglish ? 'English' : 'Indonesian'}

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

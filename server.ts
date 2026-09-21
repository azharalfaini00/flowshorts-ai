import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
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

// Lazy OpenAI initialization
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: OPENAI_API_KEY is not set. DALL-E image generation will use Pollinations fallback.');
    }
    openaiClient = new OpenAI({ apiKey: apiKey || 'missing' });
  }
  return openaiClient;
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// DALL-E 3 Image Generation — satu-satunya sumber gambar
// ─────────────────────────────────────────────────────────────
async function generateImageWithDallE(
  prompt: string,
  aspectRatio: string = '1:1',
  quality: 'standard' | 'hd' = 'standard'
): Promise<{ url: string; source: 'dalle3' }> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OPENAI_API_KEY tidak ditemukan.');

  // gpt-image-1 supported sizes
  let imgSize: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1024';
  if (aspectRatio === '16:9') imgSize = '1536x1024';
  else if (aspectRatio === '9:16') imgSize = '1024x1536';

  // map quality: standard -> medium, hd -> high
  const imgQuality = quality === 'hd' ? 'high' : 'medium';

  const openai = getOpenAIClient();
  const cleanPrompt = prompt.slice(0, 3900);
  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: cleanPrompt,
    n: 1,
    size: imgSize,
    quality: imgQuality as any,
  });

  // gpt-image-1 returns b64_json; convert to data URL
  const b64 = response.data?.[0]?.b64_json;
  const urlResult = response.data?.[0]?.url;
  if (!b64 && !urlResult) throw new Error('OpenAI tidak mengembalikan gambar.');
  const imageUrl = urlResult || `data:image/png;base64,${b64}`;
  return { url: imageUrl, source: 'dalle3' };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────
// ENDPOINT: Generate Image On-Demand (DALL-E 3 / Pollinations)
// ─────────────────────────────────────────────────────────────
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', quality = 'standard', style } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt gambar tidak boleh kosong.' });
    }

    // Build a rich prompt with style if provided
    const fullPrompt = style
      ? `${style}, ${prompt.trim()}, masterpiece, best quality, highly detailed, vibrant colors`
      : `${prompt.trim()}, masterpiece, best quality, highly detailed`;

    const result = await generateImageWithDallE(fullPrompt, aspectRatio, quality as 'standard' | 'hd');
    res.json({ image_url: result.url, source: result.source });
  } catch (error: any) {
    console.error('Error in /api/generate-image:', error);
    res.status(500).json({ error: error?.message || 'Gagal membuat gambar.' });
  }
});

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
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
The user has already created this story outline in Stage 2. Your ONLY job in flowAiPrompts is to EXPAND each scene below into full, highly detailed storyboard prompts. DO NOT invent a different story. DO NOT skip or merge scenes.

Per-Scene Mapping (STRICTLY follow this order):
${mappingLines}

The story title, summary, and overall narrative MUST match:
- Story Title: "${storyOutline.judul}"
- Genre: "${storyOutline.genre}"
- Story Summary: "${storyOutline.ringkasan}"
═══════════════════════════════════════════════════════════`;
    }

    // ── System instruction (mode-aware) ─────────────────────────────────────
    const hasOutline = Boolean(storyOutline && storyOutline.adegan);
    const missionStatement = hasOutline
      ? `Your PRIMARY MISSION is to FAITHFULLY EXPAND the provided story outline into ${promptCount} fully-detailed, continuous storyboard scene prompts. You are a world-class AI Storyboard Director.`
      : `Your PRIMARY MISSION is to analyze the reference images (if any) and CREATE A BRAND NEW compelling storyboard with ${promptCount} highly detailed, continuous scenes.`;

    const systemInstruction = `You are a world-class AI Storyboard Director and Visual Prompt Engineer.
${missionStatement}
${outlineMappingRules}

STORYLINE CONTINUITY RULES (CRITICAL):
- The scenes MUST form a single, continuous, and logical storyline.
- Scene 1 must lead directly into Scene 2, Scene 2 into Scene 3, and so on. The "ending_action" of one scene MUST be the starting point or directly lead to the "opening_shot" of the next.
- Do not create disjointed, repetitive, or independent scenes. The storyline must progress forward seamlessly.
- Strict continuity instruction: You MUST provide an explicit instruction linking the current scene to the next.

CHARACTER DNA & CONSISTENCY (CRITICAL):
- Character DNA must be explicitly locked PER SCENE. For every character in a scene, define their identity, appearance, clothing, body, and voice rules.
- If reference images are provided, YOU MUST STRICTLY preserve the Character DNA (clothing, hair, facial features, accessories, colors).
- Maintain absolute character consistency across EVERY scene. 

VISUAL RULES:
- If reference images are uploaded: extract art style, character DNA, color palette, shading technique.
- Maintain strict visual consistency across all generated scenes.
- ${isStandalone ? 'This is a STANDALONE video. Do NOT add any "Part X" label.' : `This generation is for "${partText}".`}

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
1. "storyTitle": Catchy, viral-worthy title.
2. "storySummary": 2-3 sentence overview of the story.
3. "visualStyleGuide": Extremely detailed visual consistency guide.
4. "characterDNA": Global array of characters.
5. "flowAiPrompts": Array of EXACTLY ${promptCount} highly detailed scenes. Each scene MUST follow the new advanced schema:
   - "project", "scene", "duration", "continuity_priority", "reference_storyboard"
   - "adegan" (integer scene number), "judul" (scene title), "prompt" (master text-to-image prompt)
   - "character_dna_lock": A dictionary where keys are character names and values are their specific DNA lock for this scene (identity, appearance, clothing, body, voice).
   - "environment": location, time, weather, visual_style, continuity.
   - "camera": opening_shot, movement, framing, ending_position.
   - "story": action, dialogue (array of {speaker, line}), ending_action.
   - "audio": music, sound_effects, dialogue_rule.
   - "strict_continuity_instruction": explicit instructions connecting this to the next scene.
   - "negative_prompt": standard negative prompt to prevent text/watermarks.
6. "hooks": Array of 3 high-retention text hooks.
7. "viralMetadata": viral metadata for social media.

LANGUAGE RULES (STRICT):
- You MUST generate ALL narrative text fields (including dialogues, actions, backgrounds) in the requested language: ${requestedLanguageText}. DO NOT output English unless English is requested.
- "prompt" and "negative_prompt" SHOULD be in English for the AI image generator to understand best.
- The dialogue lines must make sense, be engaging, and strictly follow the character's voice.
- Ensure animal characters (if any) can speak if required by the story.`;

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
                  project: { type: Type.STRING },
                  scene: { type: Type.STRING },
                  adegan: { type: Type.INTEGER },
                  judul: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  continuity_priority: { type: Type.STRING },
                  reference_storyboard: { type: Type.STRING },
                  character_dna_lock: {
                    type: Type.OBJECT,
                    description: "Key is character name, value is DNA object",
                    // We define it generically as an object, but give it a schema if needed. Since dictionary keys are arbitrary, we leave it as OBJECT.
                  },
                  environment: {
                    type: Type.OBJECT,
                    properties: {
                      location: { type: Type.STRING },
                      time: { type: Type.STRING },
                      weather: { type: Type.STRING },
                      visual_style: { type: Type.STRING },
                      continuity: { type: Type.STRING },
                    }
                  },
                  camera: {
                    type: Type.OBJECT,
                    properties: {
                      opening_shot: { type: Type.STRING },
                      movement: { type: Type.STRING },
                      framing: { type: Type.STRING },
                      ending_position: { type: Type.STRING },
                    }
                  },
                  story: {
                    type: Type.OBJECT,
                    properties: {
                      action: { type: Type.STRING },
                      dialogue: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            speaker: { type: Type.STRING },
                            line: { type: Type.STRING },
                          }
                        }
                      },
                      ending_action: { type: Type.STRING },
                    }
                  },
                  audio: {
                    type: Type.OBJECT,
                    properties: {
                      music: { type: Type.STRING },
                      sound_effects: { type: Type.STRING },
                      dialogue_rule: { type: Type.STRING },
                    }
                  },
                  strict_continuity_instruction: { type: Type.STRING },
                  negative_prompt: { type: Type.STRING },
                },
                required: [
                  'project', 'scene', 'adegan', 'judul', 'prompt', 'duration', 'continuity_priority',
                  'reference_storyboard', 'character_dna_lock', 'environment', 'camera',
                  'story', 'audio', 'strict_continuity_instruction', 'negative_prompt'
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
    
    // Inject image_url menggunakan DALL-E 3 (tanpa fallback Pollinations)
    if (parsedData.flowAiPrompts && Array.isArray(parsedData.flowAiPrompts)) {
      const imagePromises = parsedData.flowAiPrompts.map(async (scene: any) => {
        // Build English-only prompt agar DALL-E 3 lebih akurat
        const imagePrompt = `${style}, ${scene.prompt}, ${parsedData.visualStyleGuide || ''}, masterpiece, best quality, hyper-detailed, highly aesthetic`;
        try {
          const result = await generateImageWithDallE(imagePrompt, aspectRatio);
          scene.image_url = result.url;
          scene.image_source = 'dalle3';
        } catch (imgErr: any) {
          console.error(`DALL-E 3 gagal untuk scene ${scene.adegan}:`, imgErr?.message);
          // Tidak ada fallback — lebih baik null daripada gambar yang tidak relevan
          scene.image_url = null;
          scene.image_source = null;
          scene.image_error = imgErr?.message || 'DALL-E 3 gagal generate gambar';
        }
        return scene;
      });
      parsedData.flowAiPrompts = await Promise.all(imagePromises);
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

    // Update image_url for refined scene using DALL-E 3
    const imagePrompt = `${animationStyle}, ${updated.prompt}, ${updated.keyframe_visual_description || ''}, masterpiece, best quality`;
    const refinedAspect = updated.aspect_ratio || '1:1';
    const imgResult = await generateImageWithDallE(imagePrompt, refinedAspect);
    updated.image_url = imgResult.url;
    updated.image_source = imgResult.source;

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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';

function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is missing.');
  return new OpenAI({ apiKey });
}

async function generateImageWithDallE(
  prompt: string,
  aspectRatio: string = '1:1',
  quality: 'standard' | 'hd' = 'standard'
): Promise<{ url: string; source: 'dalle3' }> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OPENAI_API_KEY tidak ditemukan.');

  let imgSize: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1024';
  if (aspectRatio === '16:9') imgSize = '1536x1024';
  else if (aspectRatio === '9:16') imgSize = '1024x1536';

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
  const b64 = response.data?.[0]?.b64_json;
  const urlResult = response.data?.[0]?.url;
  if (!b64 && !urlResult) throw new Error('OpenAI tidak mengembalikan gambar.');
  const imageUrl = urlResult || `data:image/png;base64,${b64}`;
  return { url: imageUrl, source: 'dalle3' };
}

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ ...params, model });
      if (response && response.text) return response;
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 1200));
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
}

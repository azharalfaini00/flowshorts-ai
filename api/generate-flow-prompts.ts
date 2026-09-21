import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
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
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing.' });
    }

    const {
      storyOutline,
      animationStyle,
      referenceImages,
      parameters,
      language = 'id',
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

STORYLINE CONTINUITY RULES (CRITICAL):
- The scenes MUST form a single, continuous, and logical storyline.
- Scene 1 must lead directly into Scene 2, Scene 2 into Scene 3, and so on. 
- Do not create disjointed, repetitive, or independent scenes. The storyline must progress forward seamlessly.

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
3. "visualStyleGuide": Extremely detailed visual consistency guide.
4. "characterDNA": Array of characters with full details.
5. "flowAiPrompts": Array of EXACTLY ${promptCount} scenes.
6. "hooks": Array of 3 high-retention text hooks.
7. "viralMetadata": viral_titles, viral_hashtags, youtube_description, supporting_hashtags, pinned_comment_suggestion.

LANGUAGE RULES (STRICT):
- You MUST generate ALL text fields in the JSON in the requested language: ${language === 'en' ? 'ENGLISH' : 'INDONESIAN (Bahasa Indonesia)'}.
- This includes "prompt", "full_prompt_dna", and ALL other fields. DO NOT output English unless English is the requested language.`;

    const parts: any[] = [];

    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const img of referenceImages) {
        if (img.base64) {
          const cleanBase64 = img.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
          parts.push({ inlineData: { mimeType: img.mimeType || 'image/jpeg', data: cleanBase64 } });
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
      ? `STORYBOARD GENERATION REQUEST (${partLabel}):\n\nYou have been provided with ${referenceImages.length} reference storyboard image(s).\n${partContext}${storyOutlineText}\n\nGenerate the complete JSON now.`
      : `STORYBOARD GENERATION REQUEST (${partLabel} — Text-Only):\n${partContext}${storyOutlineText}\n\nAnimation Style: ${style}\nAspect Ratio: ${aspectRatio} | Resolution: ${resolution} | Duration per scene: ${duration}s\nCamera: ${cameraMovement} | Lighting: ${lightingMood} | FPS: ${fps}\n\nGenerate the complete JSON now.`;

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
                      properties: { waktu: { type: Type.STRING }, aksi: { type: Type.STRING } },
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
                  aturan: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['part', 'judul', 'adegan', 'durasi', 'prompt', 'latar', 'alur', 'dialog', 'audio', 'kamera', 'aturan'],
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
                viral_titles: { type: Type.ARRAY, items: { type: Type.STRING } },
                viral_hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                youtube_description: { type: Type.STRING },
                supporting_hashtags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['category', 'tags'],
                  },
                },
                pinned_comment_suggestion: { type: Type.STRING },
              },
              required: ['viral_titles', 'viral_hashtags', 'youtube_description', 'supporting_hashtags', 'pinned_comment_suggestion'],
            },
          },
          required: ['storyTitle', 'storySummary', 'visualStyleGuide', 'flowAiPrompts', 'hooks', 'viralMetadata'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error('Tidak ada output teks dari Gemini API.');
    const parsedData = JSON.parse(textOutput);

    // Inject image_url using Pollinations AI
    if (parsedData.flowAiPrompts && Array.isArray(parsedData.flowAiPrompts)) {
      parsedData.flowAiPrompts = parsedData.flowAiPrompts.map((scene: any) => {
        const imagePrompt = `${style}, ${scene.prompt}, ${parsedData.visualStyleGuide || ''}, masterpiece, best quality, hyper-detailed, highly aesthetic`;
        let w = 1024, h = 1024;
        if (aspectRatio === '9:16') { w = 576; h = 1024; }
        else if (aspectRatio === '16:9') { w = 1024; h = 576; }
        else if (aspectRatio === '4:5') { w = 819; h = 1024; }
        const seed = Math.floor(Math.random() * 9999999);
        scene.image_url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
        return scene;
      });
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/generate-flow-prompts:', error);
    res.status(500).json({ error: error?.message || 'Terjadi kesalahan saat membuat storyboard.' });
  }
}

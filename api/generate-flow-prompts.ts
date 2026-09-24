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
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
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
      return res.status(500).json({
        error: 'GEMINI_API_KEY is missing. Silakan tambahkan API key di Settings > Secrets.',
      });
    }

    const {
      customPrompt,
      referenceImages, // array of { mimeType: string, base64: string }
    } = req.body;

    const ai = getAIClient();

    const systemInstruction = `You are a world-class AI Storyboard Director and Visual Prompt Engineer.
Your task is to analyze the provided storyboard reference images and the user's explicit instructions, then output the master JSON.

USER'S MASTER INSTRUCTION:
${customPrompt}

Output Requirements:
You must strictly return a JSON object containing:
1. "storyTitle": Catchy, viral-worthy title.
2. "storySummary": 2-3 sentence overview of the story.
3. "visualStyleGuide": Extremely detailed visual consistency guide.
4. "characterDNA": Global array of characters.
5. "flowAiPrompts": Array of highly detailed JSON prompts as requested by the user (e.g. 3 separate prompts of 10s each). Each prompt MUST follow this schema strictly.
6. "hooks": Array of 3 high-retention text hooks.
7. "viralMetadata": viral metadata for social media.

All narrative text (dialogues, actions, background) MUST be in Indonesian as requested. "prompt" fields should be in English.
Do NOT use copyrighted names.`;

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

    const userPromptText = `STORYBOARD GENERATION REQUEST:

You have been provided with ${referenceImages?.length || 0} reference storyboard image(s).

YOUR INSTRUCTIONS:
${customPrompt}

Ensure all parts of the JSON schema are filled out, including flowAiPrompts, hooks, and viralMetadata.`;

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
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/generate-flow-prompts:', error);
    const errMsg: string = error?.message || 'Terjadi kesalahan saat membuat storyboard & prompt Flow AI.';
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

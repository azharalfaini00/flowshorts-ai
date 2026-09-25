import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

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
  // Ordered by stability: start with most reliable, end with newest/busiest
  const models = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.8-flash',
  ];
  let lastError: any = null;

  for (const model of models) {
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({ ...params, model });
        if (response && response.text) return response.text;
        break; // Empty response — try next model
      } catch (err: any) {
        console.warn(`[flow-prompts] Model ${model} attempt ${attempt + 1} failed:`, err?.message || err);
        lastError = err;
        if (isRetryableError(err) && attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
          console.log(`[flow-prompts] Retrying ${model} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break; // Non-retryable or exhausted — next model
        }
      }
    }
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
      referenceImages, // array of { mimeType: string, base64: string }
      apiKey,
    } = req.body;

    if (!apiKey) {
      return res.status(401).json({ error: 'API Key Gemini tidak ditemukan. Harap masukkan API Key Anda di halaman utama.' });
    }

    const hasImages = Array.isArray(referenceImages) && referenceImages.length > 0;

    const systemInstruction = `You are a world-class AI Storyboard Director and Visual Prompt Engineer.
Your task is to analyze the provided storyboard reference images and the user's explicit instructions, then output the master JSON.

CRITICAL INSTRUCTION:
No matter what JSON format or structure the user asks for in their prompt, YOU MUST output EXACTLY the following JSON schema at the root level. DO NOT wrap it in a parent key like "master_prompt".

{
  "storyTitle": "Catchy, viral-worthy title.",
  "storySummary": "2-3 sentence overview of the story.",
  "visualStyleGuide": "Extremely detailed visual consistency guide.",
  "characterDNA": [],
  "flowAiPrompts": [
    {
      "scene_number": 1,
      "prompt": "Highly detailed english prompt",
      "camera_movement": "...",
      "dialogue": "..."
    }
  ],
  "hooks": [
    { "type": "visual", "description": "hook1" }
  ],
  "viralMetadata": {
    "viral_titles": [],
    "viral_hashtags": [],
    "youtube_description": "",
    "supporting_hashtags": [],
    "pinned_comment_suggestion": ""
  }
}

Narrative text (dialogues, actions, background) MUST be in Indonesian. "prompt" fields MUST be in English.`;

    const userPromptText = `STORYBOARD GENERATION REQUEST:

You have been provided with ${referenceImages?.length || 0} reference storyboard image(s).

USER'S INSTRUCTIONS:
${customPrompt}

IMPORTANT RE-INSTRUCTION:
IGNORE any conflicting JSON format (like {"master_prompt": {...}}) requested in the instructions above. 
You MUST extract the content they asked for and map it STRICTLY into the root-level JSON schema provided in the System Instructions ("storyTitle", "flowAiPrompts", "hooks", "viralMetadata", etc). Do NOT return "master_prompt" key.`;

    const userMessageContent: any[] = [{ type: 'text', text: userPromptText }];

    // Multimodal reference images if uploaded
    if (hasImages) {
      for (const img of referenceImages) {
        if (img.base64) {
          const mimeType = img.mimeType || 'image/jpeg';
          const cleanBase64 = img.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
          userMessageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${cleanBase64}`,
            },
          });
        }
      }
    }

    let textOutput: string | undefined = '';

    const ai = getGeminiClient(apiKey);
    const parts: any[] = [{ text: userPromptText }];
    if (hasImages) {
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
    
    textOutput = await generateWithGeminiFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    if (!textOutput) {
      throw new Error(`Tidak ada output teks yang diterima dari Gemini API.`);
    }

    // Clean up potential markdown formatting just in case
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

    let parsedData;
    try {
      parsedData = JSON.parse(cleanText);
      
      // Fallback mapping in case LLM stubbornly ignores schema and wraps in "master_prompt"
      if (parsedData.master_prompt) {
        const mp = parsedData.master_prompt;
        parsedData = {
          ...parsedData,
          storyTitle: mp.title || mp.storyTitle || parsedData.storyTitle || 'Storyboard Google Flow AI Baru',
          storySummary: mp.concept || mp.story || mp.storySummary || parsedData.storySummary || '',
          visualStyleGuide: (typeof mp.visual_consistency === 'string' ? mp.visual_consistency : JSON.stringify(mp.visual_consistency)) || parsedData.visualStyleGuide || '',
          characterDNA: mp.characters || mp.characterDNA || parsedData.characterDNA || [],
          flowAiPrompts: mp.scenes || mp.flowAiPrompts || parsedData.flowAiPrompts || [],
          hooks: mp.hooks || parsedData.hooks || [],
          viralMetadata: mp.viralMetadata || parsedData.viralMetadata || {
            viral_titles: [], viral_hashtags: [], youtube_description: '', supporting_hashtags: [], pinned_comment_suggestion: ''
          },
        };
        delete parsedData.master_prompt;
      }
    } catch (parseError) {
      console.error('Failed to parse JSON output from AI:', textOutput);
      return res.status(500).json({
        error: 'AI mengembalikan format yang tidak valid (bukan JSON murni). Silakan klik Generate ulang.',
      });
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/generate-flow-prompts:', error);
    const errMsg: string = error?.message || String(error) || 'Terjadi kesalahan saat membuat storyboard & prompt Flow AI.';
    const is503 =
      errMsg.toLowerCase().includes('unavailable') ||
      errMsg.toLowerCase().includes('high demand') ||
      errMsg.toLowerCase().includes('overloaded') ||
      errMsg.includes('503');
    const friendlyMsg = is503
      ? 'Server AI sedang sibuk (high demand). Semua model sudah dicoba. Silakan coba lagi dalam 30-60 detik.'
      : errMsg;
    res.status(is503 ? 503 : 500).json({ error: friendlyMsg + ' | Detail Error Asli: ' + errMsg });
  }
}

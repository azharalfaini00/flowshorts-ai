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
}

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

  // Map aspect ratio ke ukuran DALL-E 3 yang didukung
  let dalleSize: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
  if (aspectRatio === '16:9') dalleSize = '1792x1024';
  else if (aspectRatio === '9:16') dalleSize = '1024x1792';

  const openai = getOpenAIClient();
  // DALL-E 3 bekerja lebih baik dengan prompt Inggris, maks 4000 karakter
  const cleanPrompt = prompt.slice(0, 3900);
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: cleanPrompt,
    n: 1,
    size: dalleSize,
    quality,
  });
  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) throw new Error('DALL-E 3 tidak mengembalikan URL gambar.');
  return { url: imageUrl, source: 'dalle3' };
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

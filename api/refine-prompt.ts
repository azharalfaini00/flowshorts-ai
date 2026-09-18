import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

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
    res.status(500).json({ error: error?.message || 'Gagal merevisi prompt' });
  }
}

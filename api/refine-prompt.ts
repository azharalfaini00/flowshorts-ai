import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  const models = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
  ];
  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ ...params, model });
      if (response && response.text) return response;
    } catch (err: any) {
      console.warn(`[refine-prompt] Model ${model} failed:`, err?.message || err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentPrompt, refinementInstruction, animationStyle, apiKey } = req.body;

    if (!apiKey) {
      return res.status(401).json({ error: 'API Key Gemini tidak ditemukan. Harap masukkan API Key Anda.' });
    }

    if (!currentPrompt || !refinementInstruction) {
      return res.status(400).json({ error: 'currentPrompt dan refinementInstruction wajib diisi.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await generateWithFallback(ai, {
      contents: `You are an expert Google Flow AI video prompt engineer.
Refine the following scene prompt based on user feedback.

Original Scene Prompt:
${JSON.stringify(currentPrompt, null, 2)}

Refinement Request:
"${refinementInstruction}"

Animation Style:
"${animationStyle || 'Custom'}"

Return ONLY the updated JSON for this single scene prompt, preserving all existing keys and schema structure.`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) throw new Error('Tidak ada respon dari model AI.');

    let updated: any;
    try {
      updated = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'AI mengembalikan format tidak valid. Silakan coba lagi.' });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error in /api/refine-prompt:', error);
    res.status(500).json({ error: error.message || 'Gagal merevisi prompt' });
  }
}

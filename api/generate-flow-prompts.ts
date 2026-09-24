import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';

export const maxDuration = 60; // Set Vercel timeout limit to 60 seconds (Hobby plan maximum)

function getGroqClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing.');
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

function isRetryableError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  const code = err?.status || err?.code || 0;
  return (
    code === 503 ||
    code === 429 ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('timeout')
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GROQ_API_KEY is missing. Silakan tambahkan API key Groq di Settings > Secrets untuk menggunakan Groq Llama.',
      });
    }

    const {
      customPrompt,
      referenceImages, // array of { mimeType: string, base64: string }
    } = req.body;

    const groq = getGroqClient();

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

    const userPromptText = `STORYBOARD GENERATION REQUEST:

You have been provided with ${referenceImages?.length || 0} reference storyboard image(s).

YOUR INSTRUCTIONS:
${customPrompt}

Ensure all parts of the JSON schema are filled out, including flowAiPrompts, hooks, and viralMetadata.`;

    const userMessageContent: any[] = [{ type: 'text', text: userPromptText }];

    // Multimodal reference images if uploaded
    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
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

    const hasImages = Array.isArray(referenceImages) && referenceImages.length > 0;
    
    // Gunakan Llama 3.2 11B Vision jika ada gambar, jika tidak pakai Llama 3.3 70B atau 3.1 70B
    const model = hasImages ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';

    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessageContent }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 8000,
      temperature: 0.7,
    });

    const textOutput = response.choices[0].message?.content;
    if (!textOutput) {
      throw new Error('Tidak ada output teks yang diterima dari Groq API.');
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

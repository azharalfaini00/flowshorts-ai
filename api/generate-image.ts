import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

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

  let dalleSize: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
  if (aspectRatio === '16:9') dalleSize = '1792x1024';
  else if (aspectRatio === '9:16') dalleSize = '1024x1792';

  const openai = getOpenAIClient();
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
    const { prompt, aspectRatio = '1:1', quality = 'standard', style } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt gambar tidak boleh kosong.' });
    }

    const fullPrompt = style
      ? `${style}, ${prompt.trim()}, masterpiece, best quality, highly detailed, vibrant colors`
      : `${prompt.trim()}, masterpiece, best quality, highly detailed`;

    const result = await generateImageWithDallE(fullPrompt, aspectRatio, quality as 'standard' | 'hd');
    res.json({ image_url: result.url, source: result.source });
  } catch (error: any) {
    console.error('Error in /api/generate-image:', error);
    res.status(500).json({ error: error?.message || 'Gagal membuat gambar.' });
  }
}

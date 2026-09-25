import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

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
  const models = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash',
    'gemini-flash-latest',
  ];
  let lastError: any = null;
  let hasOverloadError = false;

  for (const model of models) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({ ...params, model });
        if (response && response.text) return response.text;
        break; // break attempt loop if response is somehow empty but no error
      } catch (err: any) {
        console.warn(`[flow-prompts] Model ${model} attempt ${attempt + 1} failed:`, err?.message || err);
        lastError = err;
        
        if (isRetryableError(err)) {
          hasOverloadError = true;
          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            break; // exhausted retries for this model
          }
        } else {
          break; // non-retryable error (like 404), move to next model
        }
      }
    }
  }
  
  if (hasOverloadError) {
    throw new Error("Server AI sedang sangat sibuk (Overloaded). Silakan coba lagi dalam beberapa menit.");
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
      referenceImages,
      apiKey,
    } = req.body;

    if (!apiKey) {
      return res.status(401).json({ error: 'API Key Gemini tidak ditemukan. Harap masukkan API Key Anda di halaman utama.' });
    }

    const hasImages = Array.isArray(referenceImages) && referenceImages.length > 0;

    // ✅ System instruction: hanya bertugas memastikan output JSON valid
    // TIDAK memaksa skema — biarkan user master prompt yang menentukan struktur
    const systemInstruction = `You are an expert AI Video Director, Storyboard Artist, and Viral Content Strategist.

Your job is to follow the USER'S INSTRUCTIONS precisely and completely.

OUTPUT RULES:
1. You MUST follow every instruction in the user's prompt word-for-word.
2. Output MUST be a valid JSON object.
3. The JSON structure and fields are determined entirely by the user's instructions — do NOT override or change the user's requested format.
4. If the user's prompt specifies a particular JSON schema (e.g. with specific field names, nesting, or structure), follow it EXACTLY.
5. All narrative content (dialog, action, story) must be in Bahasa Indonesia unless the user says otherwise.
6. All image/video generation prompts (for Google Flow AI) must be in English.
7. Never add explanations, preamble, or markdown outside the JSON.`;

    // Build parts: Images first, then the Master Prompt text so it has the highest priority (recency effect)
    const parts: any[] = [];
    
    if (hasImages) {
      parts.push({ text: "VISUAL REFERENCES (Use these ONLY for character appearance, art style, and color consistency):" });
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

    const userPromptText = `
--- MASTER INSTRUCTION ---
${customPrompt}

CRITICAL: 
1. The images provided above are ONLY for visual reference (to understand character looks, art style, clothing, and colors). 
2. Do NOT just describe the images. 
3. You MUST generate the output STRICTLY based on the story, instructions, scene breakdown, and JSON format requested in the MASTER INSTRUCTION above.`;

    parts.push({ text: userPromptText });

    const ai = getGeminiClient(apiKey);
    const textOutput = await generateWithGeminiFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.75,
      },
    });

    if (!textOutput) {
      throw new Error('Tidak ada output teks yang diterima dari Gemini API.');
    }

    // Clean up markdown fences if any
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

    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse JSON output from AI:', textOutput);
      return res.status(500).json({
        error: 'AI mengembalikan format yang tidak valid (bukan JSON murni). Silakan klik Generate ulang.',
      });
    }

    // ✅ Normalize for frontend: extract fields the UI needs from whatever schema AI returned
    // Supports both old schema (storyTitle) and user-custom schemas (master_prompt, etc.)
    const normalize = (data: any): any => {
      // If user's master prompt uses master_prompt wrapper (common in default prompt)
      if (data.master_prompt) {
        const mp = data.master_prompt;
        return {
          storyTitle: mp.title || mp.storyTitle || data.storyTitle || 'Storyboard Baru',
          storySummary: mp.concept || mp.story_summary || mp.storySummary || data.storySummary || '',
          visualStyleGuide: typeof mp.visual_consistency === 'string' ? mp.visual_consistency : (JSON.stringify(mp.visual_consistency) || data.visualStyleGuide || ''),
          characterDNA: Array.isArray(mp.characters) ? mp.characters : (Array.isArray(mp.characterDNA) ? mp.characterDNA : (Array.isArray(data.characterDNA) ? data.characterDNA : [])),
          flowAiPrompts: Array.isArray(mp.scenes) ? mp.scenes : (Array.isArray(mp.flowAiPrompts) ? mp.flowAiPrompts : (Array.isArray(data.flowAiPrompts) ? data.flowAiPrompts : [])),
          hooks: Array.isArray(mp.hooks) ? mp.hooks : (Array.isArray(data.hooks) ? data.hooks : []),
          viralMetadata: {
            viral_titles: Array.isArray(mp.viralMetadata?.viral_titles) ? mp.viralMetadata.viral_titles : (Array.isArray(data.viralMetadata?.viral_titles) ? data.viralMetadata.viral_titles : []),
            viral_hashtags: Array.isArray(mp.viralMetadata?.viral_hashtags) ? mp.viralMetadata.viral_hashtags : (Array.isArray(data.viralMetadata?.viral_hashtags) ? data.viralMetadata.viral_hashtags : []),
            youtube_description: mp.viralMetadata?.youtube_description || data.viralMetadata?.youtube_description || '',
            supporting_hashtags: Array.isArray(mp.viralMetadata?.supporting_hashtags) ? mp.viralMetadata.supporting_hashtags : (Array.isArray(data.viralMetadata?.supporting_hashtags) ? data.viralMetadata.supporting_hashtags : []),
            pinned_comment_suggestion: mp.viralMetadata?.pinned_comment_suggestion || data.viralMetadata?.pinned_comment_suggestion || '',
          },
          // Keep ALL original fields so PromptJsonViewer can show the full raw JSON
          ...data,
          master_prompt: undefined,
        };
      }

      // Already in expected format — just ensure safe arrays
      return {
        ...data,
        storyTitle: data.storyTitle || data.title || 'Storyboard Baru',
        storySummary: data.storySummary || data.story_summary || '',
        visualStyleGuide: data.visualStyleGuide || '',
        characterDNA: Array.isArray(data.characterDNA) ? data.characterDNA : [],
        flowAiPrompts: Array.isArray(data.flowAiPrompts) ? data.flowAiPrompts : [],
        hooks: Array.isArray(data.hooks) ? data.hooks : [],
        viralMetadata: {
          viral_titles: Array.isArray(data.viralMetadata?.viral_titles) ? data.viralMetadata.viral_titles : [],
          viral_hashtags: Array.isArray(data.viralMetadata?.viral_hashtags) ? data.viralMetadata.viral_hashtags : [],
          youtube_description: data.viralMetadata?.youtube_description || '',
          supporting_hashtags: Array.isArray(data.viralMetadata?.supporting_hashtags) ? data.viralMetadata.supporting_hashtags : [],
          pinned_comment_suggestion: data.viralMetadata?.pinned_comment_suggestion || '',
        },
      };
    };

    res.json(normalize(parsedData));

  } catch (error: any) {
    console.error('Error in /api/generate-flow-prompts:', error);
    const errMsg: string = error?.message || String(error) || 'Terjadi kesalahan saat membuat storyboard & prompt Flow AI.';
    const is503 =
      errMsg.toLowerCase().includes('unavailable') ||
      errMsg.toLowerCase().includes('high demand') ||
      errMsg.toLowerCase().includes('overloaded') ||
      errMsg.includes('503') ||
      errMsg.includes('429');
    const friendlyMsg = is503
      ? 'Server AI sedang sibuk. Semua model sudah dicoba. Silakan coba lagi dalam 30-60 detik.'
      : errMsg;
    res.status(is503 ? 503 : 500).json({ error: friendlyMsg });
  }
}

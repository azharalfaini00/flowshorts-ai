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

    // ✅ System instruction: Kembalikan kepintaran struktur JSON seperti awal aplikasi,
    // tapi tetap menghormati isi cerita dari master prompt.
    const systemInstruction = `You are a world-class AI Video Director, Storyboard Artist, and Viral Content Strategist.

Your job is to read the images and the user's MASTER INSTRUCTION, and output a highly detailed JSON response.

CRITICAL JSON SCHEMA REQUIREMENT:
Because you are an API, you MUST output exactly ONE valid JSON root object. 
If the user's MASTER INSTRUCTION asks you to "divide the output into 3 separate JSON prompts" or similar, you MUST place those 3 JSON objects inside the "flowAiPrompts" array. Do NOT output multiple disconnected JSON objects.

Your final output MUST strictly use this structure:
{
  "storyTitle": "Catchy, viral-worthy title in Indonesian",
  "storySummary": "2-3 sentence overview of the generated story",
  "visualStyleGuide": "Detailed visual consistency guide (art style, lighting, colors)",
  "characterDNA": [ { "name": "...", "appearance": "..." } ],
  "flowAiPrompts": [ 
    // 👉 THIS IS WHERE YOU PUT THE SCENES/PARTS REQUESTED BY THE USER'S MASTER INSTRUCTION 👈
    // If the user asked for 3 separate JSON prompts, put them here as 3 elements in this array.
    // Apply all user constraints (duration, dialogues, no watermark, etc) to these objects.
  ],
  "hooks": [
    // 👉 YOU MUST AUTOMATICALLY GENERATE 0-3 SECOND VIRAL HOOKS HERE 👈
    { "type": "visual", "hook_text": "...", "visual_cue": "...", "audio_cue": "..." }
  ],
  "viralMetadata": {
    // 👉 YOU MUST AUTOMATICALLY GENERATE SEO METADATA HERE 👈
    "viral_titles": ["title 1", "title 2"],
    "viral_hashtags": ["#tag1", "#tag2"],
    "youtube_description": "...",
    "supporting_hashtags": [ { "category": "Trend", "tags": ["#x"] } ],
    "pinned_comment_suggestion": "..."
  }
}

OUTPUT RULES:
1. "flowAiPrompts" MUST contain the exact scenes, story, and logic requested by the user's MASTER INSTRUCTION.
2. You MUST automatically generate smart, viral "hooks" and "viralMetadata" based on the story you just created. Do not leave them empty.
3. All narrative content (dialog, action, titles, hooks) must be in Bahasa Indonesia.
4. All image generation prompts inside flowAiPrompts must be in English.
5. Never add explanations outside the JSON.`;

    // Build parts: Images first, then the Master Prompt text so it has the highest priority (recency effect)
    const parts: any[] = [];
    
    if (hasImages) {
      parts.push({ text: "VISUAL REFERENCES (The images below contain visual styles, characters, and potentially dialogues/text that you MUST read and use):" });
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

CRITICAL EXECUTION STEPS: 
1. READ the images above. Extract any text, dialogues, character looks, and art style.
2. READ this MASTER INSTRUCTION. 
3. GENERATE the story and scenes exactly as requested in the MASTER INSTRUCTION, combining it with the data from the images.
4. If the MASTER INSTRUCTION asks for separate JSON prompts, place them as elements inside the "flowAiPrompts" array.
5. WRAP your entire response in the mandatory JSON schema provided in your system instructions, and automatically generate the "hooks" and "viralMetadata" to make the content go viral.`;

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

    // ✅ Normalize for frontend: aggressively extract fields no matter the schema
    const normalize = (rawData: any): any => {
      // Flatten if wrapped in "master_prompt", "data", "result", etc.
      let data = rawData;
      if (data.master_prompt) data = { ...data, ...data.master_prompt };
      if (data.data) data = { ...data, ...data.data };

      // Helper to find the first array of objects that looks like scenes
      const findScenesArray = (obj: any): any[] => {
        if (Array.isArray(obj.flowAiPrompts)) return obj.flowAiPrompts;
        if (Array.isArray(obj.scenes)) return obj.scenes;
        if (Array.isArray(obj.adegan)) return obj.adegan;
        if (Array.isArray(obj.prompts)) return obj.prompts;
        if (Array.isArray(obj.storyboard)) return obj.storyboard;
        // Search values
        for (const key in obj) {
          if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
            // check if it has scene-like keys
            const first = obj[key][0];
            if (first.prompt || first.scene || first.deskripsi || first.action || first.kamera) {
              return obj[key];
            }
          }
        }
        return [];
      };

      const findHooksArray = (obj: any): any[] => {
        if (Array.isArray(obj.hooks)) return obj.hooks;
        if (Array.isArray(obj.viral_hooks)) return obj.viral_hooks;
        if (Array.isArray(obj.hook_penahan)) return obj.hook_penahan;
        for (const key in obj) {
          if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
            if (obj[key][0].hook_text || obj[key][0].type || obj[key][0].visual_cue) return obj[key];
          }
        }
        return [];
      };

      const flowAiPrompts = findScenesArray(data);
      const hooks = findHooksArray(data);

      const vm = data.viralMetadata || data.viral_metadata || data.metadata || {};

      return {
        ...rawData, // keep original raw data
        storyTitle: data.storyTitle || data.title || data.judul || 'Storyboard Baru',
        storySummary: data.storySummary || data.story_summary || data.ringkasan || '',
        visualStyleGuide: typeof data.visualStyleGuide === 'string' ? data.visualStyleGuide : 
                         (typeof data.visual_consistency === 'string' ? data.visual_consistency : JSON.stringify(data.visual_consistency || data.visualStyleGuide || '')),
        characterDNA: Array.isArray(data.characterDNA) ? data.characterDNA : (Array.isArray(data.characters) ? data.characters : (Array.isArray(data.karakter) ? data.karakter : [])),
        flowAiPrompts,
        hooks,
        viralMetadata: {
          viral_titles: Array.isArray(vm.viral_titles) ? vm.viral_titles : (Array.isArray(data.viral_titles) ? data.viral_titles : []),
          viral_hashtags: Array.isArray(vm.viral_hashtags) ? vm.viral_hashtags : (Array.isArray(data.viral_hashtags) ? data.viral_hashtags : []),
          youtube_description: vm.youtube_description || data.youtube_description || vm.deskripsi || '',
          supporting_hashtags: Array.isArray(vm.supporting_hashtags) ? vm.supporting_hashtags : [],
          pinned_comment_suggestion: vm.pinned_comment_suggestion || vm.pinned_comment || data.pinned_comment || '',
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

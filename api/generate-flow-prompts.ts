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

Your job is to read the uploaded storyboard images and the user's MASTER INSTRUCTION, then output a highly detailed JSON response.

====== CRITICAL RULE: OUTPUT STRUCTURE ======
You MUST output exactly ONE valid JSON root object with this structure:

{
  "storyTitle": "...",
  "storySummary": "...",
  "visualStyleGuide": "...",
  "characterDNA": [ ... ],
  "flowAiPrompts": [ ... ],
  "hooks": [ ... ],
  "viralMetadata": { ... }
}

====== CRITICAL RULE: flowAiPrompts CONTENT ======
The elements inside the "flowAiPrompts" array MUST be the exact, fully-detailed JSON objects that the user requested in their MASTER INSTRUCTION.

DO NOT simplify, shorten, or reduce the richness of the scene JSON objects.
IF the user's MASTER INSTRUCTION requests scenes with fields like:
  - "character_lock", "voice_lock", "continuity_instruction", "camera_continuity"
  - "position_continuity", "lighting_continuity", "dialogue", "audio"
  - "global_negative_constraints", "ending", "hook", etc.
THEN EVERY ONE OF THOSE FIELDS MUST BE PRESENT AND FULLY FILLED OUT in each element of "flowAiPrompts".

Example of a CORRECT scene element inside flowAiPrompts:
{
  "part": 1, "scene": 1, "duration": "10 detik",
  "character_lock": { "Budi": "...", "Kiko": "..." },
  "voice_lock": { "Budi": "...", "Kiko": "...", "voice_consistency": "..." },
  "continuity_instruction": { "must_continue_directly": true, "instruction": "...", "camera_continuity": "...", "position_continuity": "...", "lighting_continuity": "..." },
  "scene": { "setting": "...", "visual": "...", "camera": "...", "lighting": "...", "mood": "..." },
  "dialogue": [ { "speaker": "Budi", "dialogue": "..." }, { "speaker": "Kiko", "dialogue": "..." } ],
  "audio": { "music": "...", "sound_effects": "...", "lip_sync": "..." },
  "global_negative_constraints": [ "...", "..." ]
}

IF the user requests 3 separate JSON prompts, each with the above rich structure, put all 3 as elements in "flowAiPrompts".

====== CRITICAL RULE: hooks & viralMetadata ======
You MUST automatically generate the following based on the story you just created:
- "hooks": 2-3 viral hook ideas for 0-5 second retention (include hook_text, visual_cue, audio_cue)
- "viralMetadata": viral titles, hashtags, YouTube description, pinned comment suggestion
Do NOT leave these empty.

====== OUTPUT RULES ======
1. All narrative content (dialog, action, story, hooks) MUST be in Bahasa Indonesia.
2. Image generation prompts for Google Flow AI MUST be in English.
3. Dialogues MUST be assigned to the CORRECT speaker. Never put Budi's words in Kiko's mouth or vice versa.
4. Never add any text, explanation, or markdown OUTSIDE the JSON.`;

    const parts: any[] = [];
    
    if (hasImages) {
      parts.push({ text: "VISUAL REFERENCES - These storyboard images are your primary visual source. READ all text, dialogues, character designs, scene descriptions, and Part labels written inside the images. Extract character DNA (appearance, clothing, accessories, colors) for each character shown." });
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

    const userPromptText = `--- MASTER INSTRUCTION ---
${customPrompt}

EXECUTION STEPS:
1. ANALYZE the storyboard images above — read all text, dialogues, character appearances, and story elements.
2. READ this MASTER INSTRUCTION fully.
3. GENERATE each requested scene as a FULLY DETAILED JSON object exactly matching the structure and all fields requested in the MASTER INSTRUCTION. Do not omit any field.
4. Place all scene JSON objects inside the "flowAiPrompts" array.
5. AUTO-GENERATE the "hooks" and "viralMetadata" fields based on the story.
6. Return the complete single JSON root object.`;

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

      // Deep search for viralMetadata — check multiple possible locations
      const findViralMetadata = (obj: any): any => {
        // Direct match
        if (obj.viralMetadata && typeof obj.viralMetadata === 'object') return obj.viralMetadata;
        if (obj.viral_metadata && typeof obj.viral_metadata === 'object') return obj.viral_metadata;
        // Sometimes AI nests it under a wrapper key
        for (const key in obj) {
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const nested = obj[key];
            if (
              Array.isArray(nested.viral_titles) ||
              Array.isArray(nested.viral_hashtags) ||
              typeof nested.youtube_description === 'string'
            ) {
              return nested;
            }
          }
        }
        return {};
      };

      const flowAiPrompts = findScenesArray(data);
      const hooks = findHooksArray(data);
      const vm = findViralMetadata(data);

      console.log('[normalize] viralMetadata found:', JSON.stringify(vm).substring(0, 200));
      console.log('[normalize] hooks found:', hooks.length, 'items');
      console.log('[normalize] flowAiPrompts found:', flowAiPrompts.length, 'items');

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

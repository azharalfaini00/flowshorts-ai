import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';
config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

try {
  const result = await ai.models.list();
  const models = result?.models || result?.page || result || [];
  const arr = Array.isArray(models) ? models : Object.values(models);
  arr.forEach(m => {
    const name = m.name || m.displayName || JSON.stringify(m);
    const methods = m.supportedGenerationMethods?.join(', ') || '';
    console.log(`${name}  [${methods}]`);
  });
} catch (e) {
  console.error('Error:', e.message);
}

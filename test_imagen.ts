import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function run() {
  try {
    const modelsResponse = await ai.models.list();
    const modelNames = [];
    for await (const m of modelsResponse) {
      if (m.name.includes('imagen')) {
        modelNames.push(m.name);
      }
    }
    console.log("Available Imagen Models:", modelNames);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();

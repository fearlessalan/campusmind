import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function resolveGeminiApiKey(): string {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  throw new Error(
    "GEMINI_API_KEY manquante. Ajoutez votre clé dans le fichier .env à la racine du projet."
  );
}

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: resolveGeminiApiKey(),
    });
  }
  return aiClient;
}

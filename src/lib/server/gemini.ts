import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function resolveGeminiApiKey(): string {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8")) as {
        apiKey?: string;
      };
      const fromFirebase = firebaseConfig.apiKey?.trim();
      if (fromFirebase) return fromFirebase;
    }
  } catch {
    /* fallback below */
  }

  throw new Error(
    "GEMINI_API_KEY manquante. Ajoutez votre clé dans le fichier .env à la racine du projet."
  );
}

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: resolveGeminiApiKey(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

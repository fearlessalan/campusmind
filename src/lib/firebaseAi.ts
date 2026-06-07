import { getGenerativeModel } from "firebase/ai";
import { aiLogic } from "../firebase";
import { tryParseJson } from "./jsonUtils";

// Vertex AI us-central1 — modèle stable, facturé via Blaze (pas le free tier 20 req/jour)
const DEFAULT_MODEL = "gemini-2.5-flash";

export function getFirebaseModel(model = DEFAULT_MODEL) {
  return getGenerativeModel(aiLogic, { model });
}

function parseRetryDelayMs(message: string): number {
  const secMatch = message.match(/retry in ([\d.]+)s/i);
  if (secMatch) return Math.ceil(parseFloat(secMatch[1]) * 1000) + 500;
  return 60_000;
}

async function withAiRetry<T>(fn: () => Promise<T>, label = "requête IA"): Promise<T> {
  const maxAttempts = 3;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes("429") || msg.includes("quota") || msg.includes("Quota exceeded");
      if (!isRateLimit || attempt === maxAttempts - 1) break;
      await new Promise((r) => setTimeout(r, parseRetryDelayMs(msg)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label} échouée`);
}

function formatAiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("api-not-enabled")) {
    return "Firebase AI Logic (Vertex) non activé. Ouvrez https://console.firebase.google.com/project/gen-lang-client-0335153496/ailogic → Get started → choisissez Vertex AI.";
  }
  if (msg.includes("IAM_PERMISSION_DENIED") || msg.includes("aiplatform.endpoints.predict")) {
    return "Permissions Vertex AI manquantes sur le projet Blaze. Console Firebase → AI Logic → activer Vertex AI, puis réessayez.";
  }
  if (msg.includes("429") || msg.includes("Quota exceeded") || msg.includes("free_tier")) {
    return "Quota API gratuite dépassée. Le backend Vertex AI (Blaze) est maintenant configuré — rechargez la page et réessayez dans 1 minute.";
  }
  if (msg.includes("API_KEY_INVALID") || msg.includes("API key expired")) {
    return "Clé API invalide. Vérifiez Firebase AI Logic (Vertex) dans la console.";
  }
  return msg;
}

export async function generateText(prompt: string, model = DEFAULT_MODEL): Promise<string> {
  return withAiRetry(async () => {
    const generativeModel = getFirebaseModel(model);
    const result = await generativeModel.generateContent(prompt);
    return result.response.text();
  });
}

export async function generateJson<T = unknown>(
  prompt: string,
  model = DEFAULT_MODEL
): Promise<T> {
  try {
    return await withAiRetry(async () => {
      const generativeModel = getFirebaseModel(model);
      const result = await generativeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      return tryParseJson<T>(result.response.text() || "{}");
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("JSON")) throw err;
    throw new Error(formatAiError(err));
  }
}

export interface IngestChunk {
  source: string;
  page: string;
  chapter: string;
  content: string;
}

export async function extractChunksFromFile(
  fileName: string,
  mimeType: string,
  base64Data: string
): Promise<IngestChunk[]> {
  const prompt = `Tu es l'assistant d'ingestion CampusMind, expert en OCR, transcription académique et découpage sémantique.
Traite le fichier académique joint :
1. Extrais le texte en haute définition (OCR sur manuscrits, images ou figures).
2. Nettoie la structure, corrige les fautes et découpe sémantiquement le document.
3. Organise le texte en segments de 1 à 3 paragraphes pédagogiques.
4. Pour CHAQUE segment, définis :
   - "source" : nom exact du fichier "${fileName}"
   - "page" : numéro logique (ex. "Page 1", "Page 2")
   - "chapter" : titre de chapitre ou section en français
   - "content" : contenu académique transcrit

Réponds UNIQUEMENT en JSON valide : { "chunks": [{ "source", "page", "chapter", "content" }] }. Pas de markdown.`;

  try {
    return await withAiRetry(async () => {
      const generativeModel = getFirebaseModel(DEFAULT_MODEL);
      const result = await generativeModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      });
      const parsed = tryParseJson<{ chunks: IngestChunk[] }>(result.response.text() || '{"chunks":[]}');
      return parsed.chunks ?? [];
    });
  } catch (err) {
    throw new Error(formatAiError(err));
  }
}

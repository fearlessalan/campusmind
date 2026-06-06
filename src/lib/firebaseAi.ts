import { getGenerativeModel } from "firebase/ai";
import { aiLogic } from "../firebase";
import { tryParseJson } from "./jsonUtils";

const DEFAULT_MODEL = "gemini-3.5-flash";

export function getFirebaseModel(model = DEFAULT_MODEL) {
  return getGenerativeModel(aiLogic, { model });
}

export async function generateText(prompt: string, model = DEFAULT_MODEL): Promise<string> {
  const generativeModel = getFirebaseModel(model);
  const result = await generativeModel.generateContent(prompt);
  return result.response.text();
}

export async function generateJson<T = unknown>(
  prompt: string,
  model = DEFAULT_MODEL
): Promise<T> {
  try {
    const generativeModel = getFirebaseModel(model);
    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    const text = result.response.text();
    return tryParseJson<T>(text || "{}");
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

function formatAiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("api-not-enabled")) {
    return "Firebase AI Logic n'est pas activé. Ouvrez https://console.firebase.google.com/project/gen-lang-client-0335153496/ailogic et cliquez sur « Get started ».";
  }
  if (msg.includes("IAM_PERMISSION_DENIED") || msg.includes("aiplatform.endpoints.predict")) {
    return "Permissions Vertex AI manquantes. Rechargez la page — le backend Google AI Logic est maintenant utilisé.";
  }
  if (msg.includes("API_KEY_INVALID") || msg.includes("API key expired")) {
    return "Clé API invalide. Activez Firebase AI Logic : https://console.firebase.google.com/project/gen-lang-client-0335153496/ailogic";
  }
  return msg;
}

export async function extractChunksFromFile(
  fileName: string,
  mimeType: string,
  base64Data: string
): Promise<IngestChunk[]> {
  const generativeModel = getFirebaseModel(DEFAULT_MODEL);
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
  } catch (err) {
    throw new Error(formatAiError(err));
  }
}

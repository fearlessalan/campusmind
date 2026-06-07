import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

/**
 * Server-side Gemini client — mode selection:
 *
 *  1. Vertex AI (preferred)
 *     Uses Application Default Credentials (ADC). No API key needed.
 *     – Local dev  : run `gcloud auth application-default login` once
 *     – Cloud Run  : automatic via attached service account
 *     Requires NEXT_PUBLIC_FIREBASE_PROJECT_ID to be set in .env.
 *
 *  2. API key (fallback)
 *     Uses GEMINI_API_KEY, or NEXT_PUBLIC_FIREBASE_API_KEY as last resort.
 *     Active when NEXT_PUBLIC_FIREBASE_PROJECT_ID is absent OR when
 *     GEMINI_FORCE_API_KEY=true is set in .env.
 */
export function getGemini(): GoogleGenAI {
  if (aiClient) return aiClient;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const forceApiKey = process.env.GEMINI_FORCE_API_KEY === "true";

  // ── Mode 1 : Vertex AI ──────────────────────────────────────────────────
  if (projectId && !forceApiKey) {
    const location = process.env.VERTEX_LOCATION?.trim() || "us-central1";
    console.log(`[gemini] Mode Vertex AI — projet: ${projectId}, région: ${location}`);
    aiClient = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location,
    });
    return aiClient;
  }

  // ── Mode 2 : Clé API ────────────────────────────────────────────────────
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Aucune configuration IA trouvée. " +
      "Soit NEXT_PUBLIC_FIREBASE_PROJECT_ID (Vertex AI) " +
      "soit GEMINI_API_KEY (clé AI Studio) doit être défini dans .env."
    );
  }

  console.log("[gemini] Mode clé API (Vertex AI non configuré ou GEMINI_FORCE_API_KEY=true)");
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

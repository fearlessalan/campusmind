import type { NextRequest } from "next/server";
import { Type } from "@google/genai";
import { getUserData } from "../db";
import { getGemini } from "../gemini";
import { LANG_FR } from "../lang";
import { errorResponse, jsonResponse } from "../response";

export async function handlePodcastScript(req: NextRequest) {
  const db = await getUserData(req);
  const allChunks = (db.documents as { chunks: unknown[] }[]).flatMap((d) => d.chunks);

  if (allChunks.length === 0) {
    return errorResponse("Importez des documents pour générer un podcast.");
  }

  try {
    const ai = getGemini();

    const podcastPrompt = `Tu es l'agent audio CampusMind.
Rédige un script de discussion pédagogique entre 'Professor' (professeur expert) et 'Student' (étudiant curieux).
Le dialogue doit être naturel, engageant et pédagogique.

Sources académiques :
${JSON.stringify(allChunks.slice(0, 10))}

Réponds en JSON avec title et segments (speaker, text). Textes en français.${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: podcastPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, enum: ["Professor", "Student"] },
                  text: { type: Type.STRING },
                },
                required: ["speaker", "text"],
              },
            },
          },
          required: ["title", "segments"],
        },
      },
    });

    return jsonResponse(JSON.parse(response.text || "{}"));
  } catch (error: unknown) {
    console.error("Podcast Generation failed:", error);
    const message = error instanceof Error ? error.message : "Échec de la génération du podcast.";
    return errorResponse(message, 500);
  }
}

export async function handleAudiobookStructure(req: NextRequest) {
  const db = await getUserData(req);
  const allChunks = (db.documents as { chunks: unknown[] }[]).flatMap((d) => d.chunks);

  if (allChunks.length === 0) {
    return errorResponse("Importez des documents pour générer un audiobook.");
  }

  try {
    const ai = getGemini();

    const prompt = `Tu es l'agent audiobook CampusMind.
Groupe les segments en chapitres d'audiobook avec texte verbatim (pas de résumé).
Pour chaque chapitre : title, text, transcript.

Matériaux :
${JSON.stringify(allChunks.slice(0, 15))}${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  text: { type: Type.STRING },
                  transcript: { type: Type.STRING },
                },
                required: ["title", "text", "transcript"],
              },
            },
          },
          required: ["chapters"],
        },
      },
    });

    return jsonResponse(JSON.parse(response.text || '{"chapters": []}'));
  } catch (error: unknown) {
    console.error("Audiobook compilation failed:", error);
    const message = error instanceof Error ? error.message : "Échec de la génération de l'audiobook.";
    return errorResponse(message, 500);
  }
}

export async function handleTts(req: NextRequest) {
  const { text, speaker } = await req.json();
  try {
    const ai = getGemini();
    const voice = speaker === "Professor" ? "Charon" : "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say with extreme academic passion: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return jsonResponse({ base64Audio });
    }
    return errorResponse("No voice generated from Gemini TTS", 400);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "TTS unavailable";
    console.warn(
      "Gemini Paid TTS is unavailable, client-side Web Speech API will handle the narration audio nicely:",
      message
    );
    return errorResponse(
      "Gemini TTS unavailable (Requires Paid API Key config). Using client-side Web Speech synthesis fallback instead.",
      503
    );
  }
}

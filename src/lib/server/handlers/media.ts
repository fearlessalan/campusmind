import type { NextRequest } from "next/server";
import { Type } from "@google/genai";
import { getUserData } from "../db";
import { getGemini } from "../gemini";
import { normalizeGeminiAudio } from "../audio";
import { LANG_FR } from "../lang";
import { errorResponse, jsonResponse } from "../response";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const FRENCH_DIRECTOR_NOTE = `# Profil audio
Speaker 1 : Professeur expert, voix posée et pédagogique.
Speaker 2 : Étudiant curieux, voix dynamique et enthousiaste.

# Note du réalisateur
Langue : Français (France). Style : conversation naturelle et chaleureuse. Rythme : modéré.
Accent : français standard. Ton : pédagogique, engageant.`;

const FRENCH_AUDIOBOOK_NOTE = `# Profil audio
Narrateur : voix claire, professionnelle et posée pour la lecture académique.

# Note du réalisateur
Langue : Français (France). Style : lecture fidèle et fluide. Rythme : modéré, posé.
Accent : français standard. Ton : neutre et pédagogique.`;

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

function buildPodcastTranscript(segments: { speaker: string; text: string }[]): string {
  return segments
    .map((seg) => {
      const label = seg.speaker === "Professor" ? "Speaker 1" : "Speaker 2";
      return `${label}: ${seg.text}`;
    })
    .join("\n");
}

export async function handleTts(req: NextRequest) {
  const { text, speaker } = await req.json();
  if (!text) return errorResponse("Texte manquant.");

  try {
    const ai = getGemini();
    const voice = speaker === "Professor" ? "Puck" : "Kore";

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Lis le texte suivant en français.

${FRENCH_AUDIOBOOK_NOTE}

## Transcript :
${text}`,
            },
          ],
        },
      ],
      config: {
        temperature: 1,
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData?.data) {
      const audio = normalizeGeminiAudio(inlineData);
      return jsonResponse(audio);
    }
    return errorResponse("Aucun audio généré.", 400);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "TTS indisponible";
    console.error("TTS error:", message);
    return errorResponse(message, 503);
  }
}

export async function handlePodcastTts(req: NextRequest) {
  const { segments } = await req.json() as { segments: { speaker: string; text: string }[] };
  if (!segments?.length) return errorResponse("Segments manquants.");

  try {
    const ai = getGemini();
    const transcript = buildPodcastTranscript(segments);

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Lis la transcription suivante selon le profil audio et la note du réalisateur.

${FRENCH_DIRECTOR_NOTE}

## Transcript :
${transcript}`,
            },
          ],
        },
      ],
      config: {
        temperature: 1,
        responseModalities: ["AUDIO"],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: "Speaker 1",
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
              },
              {
                speaker: "Speaker 2",
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
              },
            ],
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData?.data) {
      const audio = normalizeGeminiAudio(inlineData);
      return jsonResponse(audio);
    }
    return errorResponse("Aucun audio podcast généré.", 400);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "TTS podcast indisponible";
    console.error("Podcast TTS error:", message);
    return errorResponse(message, 503);
  }
}

export async function handleAudiobookTts(req: NextRequest) {
  const { text, title } = await req.json();
  if (!text) return errorResponse("Texte manquant.");

  try {
    const ai = getGemini();

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Lis le chapitre suivant en français, de manière fidèle et naturelle.

${FRENCH_AUDIOBOOK_NOTE}

## Chapitre : ${title || "Sans titre"}

## Transcript :
${text}`,
            },
          ],
        },
      ],
      config: {
        temperature: 1,
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData?.data) {
      const audio = normalizeGeminiAudio(inlineData);
      return jsonResponse(audio);
    }
    return errorResponse("Aucun audio audiobook généré.", 400);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "TTS audiobook indisponible";
    console.error("Audiobook TTS error:", message);
    return errorResponse(message, 503);
  }
}

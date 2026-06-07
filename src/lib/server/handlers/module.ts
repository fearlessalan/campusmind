import type { NextRequest } from "next/server";
import { Type } from "@google/genai";
import { getUserData, writeUserData } from "../db";
import { getGemini } from "../gemini";
import { LANG_FR } from "../lang";
import { errorResponse, jsonResponse } from "../response";

export async function handleGetLesson(req: NextRequest, moduleId: string) {
  const db = await getUserData(req);
  const targetModule = (db.learningPath as { id: string }[]).find((m) => m.id === moduleId);

  if (!targetModule) {
    return errorResponse("Module introuvable dans le parcours.", 404);
  }

  const allChunks = (db.documents as { chunks: unknown[] }[]).flatMap((d) => d.chunks);

  try {
    const ai = getGemini();
    const mod = targetModule as unknown as {
      title: string;
      description: string;
      weakTopicRelation?: string;
    };

    const lessonPrompt = `Tu es l'agent de leçon CampusMind.
Génère une leçon interactive complète pour le module : "${mod.title}".
Description : ${mod.description}
Point faible ciblé : ${mod.weakTopicRelation || "N/A"}

À partir de la base de connaissances :
- Rédige une explication détaillée (explanation)
- Crée 3 keyConcepts (terme + définition)
- Fournis 2 examples concrets
- Écris 3 memoryTips mémorables

Base de connaissances :
${JSON.stringify(allChunks.slice(0, 15))}${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: lessonPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            explanation: { type: Type.STRING },
            keyConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ["term", "definition"],
              },
            },
            examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            memoryTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["title", "explanation", "keyConcepts", "examples", "memoryTips"],
        },
      },
    });

    return jsonResponse(JSON.parse(response.text || "{}"));
  } catch (error: unknown) {
    console.error("Lesson generation failed:", error);
    const message = error instanceof Error ? error.message : "Échec de la génération de la leçon.";
    return errorResponse(message, 500);
  }
}

export async function handleCompleteModule(req: NextRequest, moduleId: string) {
  const db = await getUserData(req);

  let found = false;
  db.learningPath = (db.learningPath as { id: string; isCompleted?: boolean }[]).map((m) => {
    if (m.id === moduleId) {
      found = true;
      return { ...m, isCompleted: true };
    }
    return m;
  });

  if (!found) {
    return errorResponse("Module introuvable.", 404);
  }

  if (!db.completedLessons.includes(moduleId)) {
    db.completedLessons.push(moduleId);
  }

  const totalModcount = (db.learningPath as unknown[]).length || 4;
  db.performance.progress = Math.round((db.completedLessons.length / totalModcount) * 100);
  db.performance.retention = Math.min(100, db.performance.retention + 8);
  db.performance.exam_readiness = Math.min(100, db.performance.exam_readiness + 6);

  await writeUserData(req, db);
  return jsonResponse({ success: true, db });
}

export async function handleGetQuiz(req: NextRequest, moduleId: string) {
  const db = await getUserData(req);
  const targetModule = (db.learningPath as { id: string }[]).find((m) => m.id === moduleId);

  if (!targetModule) {
    return errorResponse("Module introuvable.", 404);
  }

  const allChunks = (db.documents as { chunks: unknown[] }[]).flatMap((d) => d.chunks);
  const mod = targetModule as unknown as { title: string; description: string };

  try {
    const ai = getGemini();

    const quizPrompt = `Tu es l'agent quiz CampusMind.
Génère un quiz pratique de 4 questions pour le module : "${mod.title}".
Description : ${mod.description}

Crée 4 questions variées (QCM, Vrai/Faux, ouverte, scénario) avec explications détaillées.

Base de connaissances :
${JSON.stringify(allChunks.slice(0, 15))}${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: quizPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["mcq", "tf", "open", "scenario"] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["id", "question", "type", "correctAnswer", "explanation"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    return jsonResponse(JSON.parse(response.text || '{"questions": []}'));
  } catch (error: unknown) {
    console.error("Complete Quiz generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Échec de la génération du quiz pratique.";
    return errorResponse(message, 500);
  }
}

export async function handleRecordScore(req: NextRequest) {
  const { moduleTitle, score } = await req.json();
  const db = await getUserData(req);

  db.quizHistory.push({
    date: new Date().toISOString().slice(0, 10),
    type: `Pratique : ${moduleTitle}`,
    score,
  });

  db.performance.scoreHistory.push(score);
  db.performance.retention = Math.min(100, Math.round(db.performance.retention + score / 15));
  db.performance.exam_readiness = Math.min(
    100,
    Math.round(db.performance.exam_readiness + score / 20)
  );

  await writeUserData(req, db);
  return jsonResponse({ success: true, db });
}

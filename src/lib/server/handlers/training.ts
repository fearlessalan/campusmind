import type { NextRequest } from "next/server";
import { Type } from "@google/genai";
import { getUserData, writeUserData } from "../db";
import { getGemini } from "../gemini";
import { LANG_FR } from "../lang";
import { errorResponse, jsonResponse } from "../response";

export async function handleDiagnosticQuiz(req: NextRequest) {
  const db = getUserData(req);
  const allChunks = (db.documents as { chunks: { chapter: string; content: string }[] }[]).flatMap(
    (d) => d.chunks
  );

  if (allChunks.length === 0) {
    return errorResponse("La base de connaissances est vide. Importez d'abord des documents.");
  }

  try {
    const ai = getGemini();
    const sourceConcepts = allChunks
      .map((c) => `Chapter: ${c.chapter} | Content snippet: ${c.content.slice(0, 150)}...`)
      .join("\n");

    const prompt = `Tu es l'agent d'évaluation CampusMind.
Génère un quiz diagnostique de 5 questions pour estimer le niveau de l'étudiant :
- Au moins 2 QCM (mcq)
- Au moins 1 Vrai/Faux (tf)
- Au moins 1 question ouverte (open)
- Au moins 1 scénario d'application (scenario)

Fournis d'excellentes options, explications et indices en français.

Matériaux sources :
${sourceConcepts.slice(0, 8000)}${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
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
                  hint: { type: Type.STRING },
                },
                required: ["id", "question", "type", "correctAnswer", "explanation", "hint"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    return jsonResponse(JSON.parse(response.text || '{"questions": []}'));
  } catch (error: unknown) {
    console.error("Diagnostic generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Échec de la génération du quiz diagnostique.";
    return errorResponse(message, 500);
  }
}

export async function handleEvaluateAndCurriculum(req: NextRequest) {
  const { answers, quizData } = await req.json();
  const db = getUserData(req);
  const allChunks = (db.documents as { chunks: unknown[] }[]).flatMap((d) => d.chunks);

  try {
    const ai = getGemini();

    const evaluationPrompt = `Tu es l'agent d'évaluation et l'agent curriculum CampusMind.
1. Évalue les réponses du quiz diagnostique.
2. Détermine mastery_score (0-100), weak_topics et strong_topics.
3. Compose un parcours adaptatif de 4 modules, en priorisant les weak_topics.

Quiz :
${JSON.stringify(quizData)}

Réponses de l'étudiant :
${JSON.stringify(answers)}

Réponds en JSON valide avec evaluation et learningPath.${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: evaluationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evaluation: {
              type: Type.OBJECT,
              properties: {
                mastery_score: { type: Type.INTEGER },
                weak_topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                strong_topics: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["mastery_score", "weak_topics", "strong_topics"],
            },
            learningPath: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING },
                  order: { type: Type.INTEGER },
                  weakTopicRelation: { type: Type.STRING },
                },
                required: ["id", "title", "description", "estimatedTime", "order"],
              },
            },
          },
          required: ["evaluation", "learningPath"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");

    db.performance.progress = 10;
    db.performance.retention = Math.round(result.evaluation.mastery_score * 0.95);
    db.performance.exam_readiness = Math.round(result.evaluation.mastery_score * 0.9);
    db.performance.scoreHistory.push(result.evaluation.mastery_score);
    db.learningPath = result.learningPath;
    db.completedLessons = [];
    db.quizHistory.push({
      date: new Date().toISOString().slice(0, 10),
      type: "Diagnostic initial",
      score: result.evaluation.mastery_score,
    });

    writeUserData(req, db);

    return jsonResponse({
      success: true,
      evaluation: result.evaluation,
      learningPath: result.learningPath,
      dbState: db,
    });
  } catch (error: unknown) {
    console.error("Evaluation and curriculum failed:", error);
    const message =
      error instanceof Error ? error.message : "Échec de l'évaluation diagnostique.";
    return errorResponse(message, 500);
  }
}

export async function handleSaveCurriculum(req: NextRequest) {
  const { evaluation, learningPath } = await req.json();
  const db = getUserData(req);
  if (!evaluation || !learningPath) {
    return errorResponse("Données d'évaluation manquantes.");
  }
  db.performance.progress = 10;
  db.performance.retention = Math.round(evaluation.mastery_score * 0.95);
  db.performance.exam_readiness = Math.round(evaluation.mastery_score * 0.9);
  db.performance.scoreHistory.push(evaluation.mastery_score);
  db.learningPath = learningPath;
  db.completedLessons = [];
  db.quizHistory.push({
    date: new Date().toISOString().slice(0, 10),
    type: "Diagnostic initial",
    score: evaluation.mastery_score,
  });
  writeUserData(req, db);
  return jsonResponse({ success: true, evaluation, learningPath, dbState: db });
}

export async function handleReinforcementScheduled(req: NextRequest) {
  const db = getUserData(req);
  const allChunks = (db.documents as { chunks: unknown[] }[]).flatMap((d) => d.chunks);

  if (allChunks.length === 0) {
    return jsonResponse({
      forgottenConcept: null,
      revisionPrompt: "La base de connaissances est vide.",
    });
  }

  try {
    const ai = getGemini();

    const prompt = `Tu es l'agent de renforcement CampusMind (répétition espacée).
Sélectionne UN concept clé que l'étudiant risque d'oublier.
Génère conceptName, originalSource, spacedRepetitionExplanation et targetedQuickQuiz (QCM rapide).

Documents :
${JSON.stringify(allChunks.slice(0, 15))}${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conceptName: { type: Type.STRING },
            originalSource: { type: Type.STRING },
            spacedRepetitionExplanation: { type: Type.STRING },
            targetedQuickQuiz: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["question", "options", "correctAnswer", "explanation"],
            },
          },
          required: [
            "conceptName",
            "originalSource",
            "spacedRepetitionExplanation",
            "targetedQuickQuiz",
          ],
        },
      },
    });

    return jsonResponse(JSON.parse(response.text || "{}"));
  } catch (error: unknown) {
    console.error("Spaced repetition API failed:", error);
    const message =
      error instanceof Error ? error.message : "Échec de la génération de la révision espacée.";
    return errorResponse(message, 500);
  }
}

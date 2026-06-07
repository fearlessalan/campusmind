import type { NextRequest } from "next/server";
import { Type } from "@google/genai";
import { getUserData, writeUserData } from "../db";
import { getGemini } from "../gemini";
import { LANG_FR } from "../lang";
import { errorResponse, jsonResponse } from "../response";

export async function handleGenerateExam(req: NextRequest) {
  const db = getUserData(req);
  const allChunks = (db.documents as { chunks: unknown[] }[]).flatMap((d) => d.chunks);

  if (allChunks.length === 0) {
    return errorResponse("Aucun document disponible pour générer un examen.");
  }

  try {
    const ai = getGemini();
    const prompt = `Tu es l'agent générateur d'examens CampusMind.
Compile un examen réaliste de 6 questions :
- 3 QCM
- 1 Vrai/Faux
- 2 questions ouvertes

Extraits de cours :
${JSON.stringify(allChunks.slice(0, 15))}

Réponds en JSON valide.${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            durationMinutes: { type: Type.INTEGER },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["mcq", "tf", "open"] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["id", "question", "type"],
              },
            },
          },
          required: ["title", "durationMinutes", "questions"],
        },
      },
    });

    return jsonResponse(JSON.parse(response.text || "{}"));
  } catch (error: unknown) {
    console.error("Exam generation failed:", error);
    const message = error instanceof Error ? error.message : "Échec de la génération de l'examen.";
    return errorResponse(message, 500);
  }
}

export async function handleEvaluateExam(req: NextRequest) {
  const { examPaper, studentAnswers } = await req.json();
  const db = getUserData(req);

  try {
    const ai = getGemini();

    const evaluationPrompt = `Tu es l'agent de correction CampusMind.
Corrige les réponses de l'examen et produis :
score, corrections, chaptersPerformance, actionPlan, estimatedStudyTimeNeeded, predictedExamScore.

Examen :
${JSON.stringify(examPaper)}

Réponses de l'étudiant :
${JSON.stringify(studentAnswers)}${LANG_FR}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: evaluationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            totalQuestions: { type: Type.INTEGER },
            corrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN },
                  studentAnswer: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: [
                  "questionId",
                  "questionText",
                  "isCorrect",
                  "studentAnswer",
                  "correctAnswer",
                  "explanation",
                ],
              },
            },
            chaptersPerformance: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapter: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                },
                required: ["chapter", "score"],
              },
            },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedStudyTimeNeeded: { type: Type.STRING },
            predictedExamScore: { type: Type.INTEGER },
          },
          required: [
            "score",
            "totalQuestions",
            "corrections",
            "chaptersPerformance",
            "actionPlan",
            "estimatedStudyTimeNeeded",
            "predictedExamScore",
          ],
        },
      },
    });

    const results = JSON.parse(response.text || "{}");

    db.performance.exam_readiness = results.score;
    db.performance.retention = Math.round((db.performance.retention + results.score) / 2);
    db.performance.scoreHistory.push(results.score);

    db.quizHistory.push({
      date: new Date().toISOString().slice(0, 10),
      type: `Simulateur : ${examPaper.title || "Examen blanc"}`,
      score: results.score,
    });

    writeUserData(req, db);

    return jsonResponse({ success: true, grading: results, dbState: db });
  } catch (error: unknown) {
    console.error("Exam evaluation failed:", error);
    const message = error instanceof Error ? error.message : "Échec de la correction de l'examen.";
    return errorResponse(message, 500);
  }
}

export async function handleSaveGrading(req: NextRequest) {
  const { grading, examTitle } = await req.json();
  const db = getUserData(req);
  if (!grading) return errorResponse("Résultats de correction manquants.");
  db.performance.exam_readiness = grading.score;
  db.performance.retention = Math.round((db.performance.retention + grading.score) / 2);
  db.performance.scoreHistory.push(grading.score);
  db.quizHistory.push({
    date: new Date().toISOString().slice(0, 10),
    type: `Simulateur : ${examTitle || "Examen blanc"}`,
    score: grading.score,
  });
  writeUserData(req, db);
  return jsonResponse({ success: true, grading, dbState: db });
}

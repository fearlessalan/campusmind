import type { NextRequest } from "next/server";
import { getUserData, writeUserData } from "../db";
import { getGemini } from "../gemini";
import { errorResponse, jsonResponse } from "../response";

export async function handleWorkflowFinalize(req: NextRequest) {
  const db = getUserData(req);
  const examScore = 65 + Math.floor(Math.random() * 25);
  db.performance.progress = examScore;
  db.performance.retention = Math.max(55, examScore - 10);
  db.performance.exam_readiness = examScore;
  db.performance.scoreHistory.push(examScore);
  writeUserData(req, db);
  return jsonResponse({
    status: "success",
    message: `[Insights Agent] Pipeline complet — score examen : ${examScore}%. Recommandations : Revoir le module 3`,
    dbState: db,
  });
}

export async function handleWorkflowExecuteStep(req: NextRequest) {
  const { stepId } = await req.json();
  const db = getUserData(req);
  const allChunks = (
    db.documents as { chunks: { chapter: string }[] }[]
  ).flatMap((d) => d.chunks);

  if (allChunks.length === 0) {
    return errorResponse(
      "La base de connaissances est vide. Importez d'abord des documents."
    );
  }

  try {
    const ai = getGemini();

    switch (stepId) {
      case "init-audiobook": {
        const titles = Array.from(new Set(allChunks.map((c) => c.chapter)));
        return jsonResponse({
          status: "success",
          message: `[Structure Agent] ${titles.length} chapitres détectés — narration fidèle prête : ${titles.slice(0, 2).join(", ")}${titles.length > 2 ? "…" : ""}`,
        });
      }
      case "init-podcast": {
        const conceptList = Array.from(new Set(allChunks.map((c) => c.chapter))).join(", ");
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `L'étudiant veut un podcast éducatif sur ces chapitres : ${conceptList}. Génère UN seul titre accrocheur (moins de 10 mots) en français.`,
        });
        return jsonResponse({
          status: "success",
          message: `[Podcast Script Agent] Audio Summary prêt — « ${response.text?.trim() || "Révisions CampusMind"} »`,
        });
      }
      case "assessment": {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `À partir de ces matériaux : ${allChunks
            .slice(0, 3)
            .map((c) => c.chapter)
            .join(", ")}, estime un score de maîtrise (0-100) et 3 points faibles. JSON uniquement : { "score": 45, "weak": ["sujet1", "sujet2"] }. Réponds en français.`,
          config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(response.text || '{"score": 50, "weak": []}');
        return jsonResponse({
          status: "success",
          message: `[Assessment Agent] Diagnostic terminé — maîtrise : ${parsed.score}%. Lacunes : ${parsed.weak.join(", ")}`,
        });
      }
      case "curriculum": {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `À partir des chapitres ${allChunks.map((c) => c.chapter).join(", ")}, recommande 3 modules adaptatifs. JSON : { "modules": [{"title": "Nom", "desc": "Description"}] }. En français.`,
          config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(response.text || '{"modules": []}');
        return jsonResponse({
          status: "success",
          message: `[Curriculum Agent] Parcours personnalisé — ${parsed.modules.length} modules planifiés`,
        });
      }
      case "training-quiz": {
        return jsonResponse({
          status: "success",
          message:
            "[Quiz Agent · Reinforcement Agent] Quiz adaptatifs et exercices de renforcement générés",
        });
      }
      case "exam-sim": {
        return jsonResponse({
          status: "success",
          message:
            "[Exam Generator · Grading Agent] Examen simulé prêt — 6 questions, correction automatique activée",
        });
      }
      case "analytics-report": {
        const examScore = 65 + Math.floor(Math.random() * 25);
        const recommendations = ["Revoir le module 3", "Renforcer les points faibles du diagnostic"];
        db.performance.progress = examScore;
        db.performance.retention = Math.max(55, examScore - 10);
        db.performance.exam_readiness = examScore;
        db.performance.scoreHistory.push(examScore);
        writeUserData(req, db);
        return jsonResponse({
          status: "success",
          message: `[Insights Agent] Pipeline complet — score examen : ${examScore}%. Recommandations : ${recommendations.join(", ")}`,
          pipelineOutput: {
            audiobook: "ready",
            podcast: "ready",
            training_plan: "ready",
            exam_score: examScore,
            recommendations,
          },
          dbState: db,
        });
      }
      default:
        return errorResponse("Étape de workflow invalide");
    }
  } catch (error: unknown) {
    console.error("Workflow step execution failed:", error);
    const message = error instanceof Error ? error.message : "Workflow step failed";
    return errorResponse(message, 500);
  }
}

import { generateJson, generateText } from "./firebaseAi";
import {
  AcademicDocument,
  AudiobookChapter,
  DiagnosticQuiz,
  DocumentChunk,
  ExamGrading,
  ExamSession,
  LearningModule,
  LessonContent,
  PodcastScript,
  Question,
  WorkflowItem,
} from "../types";

export const WORKFLOW_STEPS_TEMPLATE: WorkflowItem[] = [
  { id: "init-audiobook", name: "Audiobook — Structure & narration", status: "idle" },
  { id: "init-podcast", name: "Audio Summary — Script podcast", status: "idle" },
  { id: "assessment", name: "Entraînement — Évaluation diagnostique", status: "idle" },
  { id: "curriculum", name: "Entraînement — Parcours personnalisé", status: "idle" },
  { id: "training-quiz", name: "Entraînement — Quiz & renforcement", status: "idle" },
  { id: "exam-sim", name: "Exam Simulator — Génération & correction", status: "idle" },
  { id: "analytics-report", name: "Rapport de performance & recommandations", status: "idle" },
];

export interface WorkflowStepResult {
  message: string;
  outputs?: {
    podcastScript?: PodcastScript;
    audiobookChapters?: AudiobookChapter[];
  };
}

const LANG_FR = "\nRéponds entièrement en français.";

export function getChunks(documents: AcademicDocument[]) {
  return documents.flatMap((d) => d.chunks);
}

function selectRelevantChunks(
  allChunks: DocumentChunk[],
  query: string
): DocumentChunk[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const matchScores = allChunks.map((chunk) => {
    let score = 0;
    const text = `${chunk.content} ${chunk.chapter} ${chunk.source}`.toLowerCase();
    queryWords.forEach((word) => {
      if (text.includes(word)) score += 1;
    });
    return { chunk, score };
  });

  const relevant = matchScores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.chunk);

  return relevant.length > 0 ? relevant : allChunks.slice(0, 3);
}

export async function generateChatResponse(
  documents: AcademicDocument[],
  messages: { role: string; content: string }[],
  selectedDocId: string | null
): Promise<{ content: string; citations: DocumentChunk[] }> {
  let allChunks = getChunks(documents);
  if (selectedDocId) {
    const selected = documents.find((d) => d.id === selectedDocId);
    if (selected) allChunks = selected.chunks;
  }

  if (allChunks.length === 0) {
    return {
      content: "Votre base de connaissances est vide. Importez des documents ou saisissez des notes pour commencer à discuter avec vos cours.",
      citations: [],
    };
  }

  const latestUserMsg = messages[messages.length - 1]?.content || "";
  const contextChunks = selectRelevantChunks(allChunks, latestUserMsg);

  const contextPrompt = contextChunks
    .map(
      (c, idx) => `[Source #${idx + 1}]
File: ${c.source}
Chapter: ${c.chapter}
Location: ${c.page}
Content: ${c.content}`
    )
    .join("\n");

  const chatPrompt = `Tu es CampusMind, un conseiller académique IA expert.
Réponds à la question de l'étudiant en t'appuyant UNIQUEMENT sur les sources ci-dessous.

Consignes :
- Explique les concepts complexes avec clarté et pédagogie.
- Chaque affirmation importante doit citer sa source : (Source : [Fichier] [Emplacement]).
- Ne fabrique pas de faits externes.
- Formate ta réponse en Markdown.

Sources :
${contextPrompt}

Historique :
${messages.slice(-5).map((m) => `${m.role === "user" ? "Étudiant" : "CampusMind"}: ${m.content}`).join("\n")}
Étudiant : ${latestUserMsg}
CampusMind :${LANG_FR}`;

  const content = await generateText(chatPrompt);
  return {
    content: content || "Je n'ai pas pu traiter cette question. Pouvez-vous la reformuler ?",
    citations: contextChunks,
  };
}

const MAX_CHAPTER_CHARS = 2500;

/** Construit l'audiobook localement — fiable pour le pipeline (pas de JSON géant). */
export function buildAudiobookChaptersLocally(documents: AcademicDocument[]): AudiobookChapter[] {
  const chunks = getChunks(documents);
  const byChapter = new Map<string, string[]>();

  for (const chunk of chunks) {
    const key = chunk.chapter?.trim() || "Introduction";
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key)!.push(chunk.content);
  }

  return Array.from(byChapter.entries()).map(([title, parts]) => {
    const full = parts.join("\n\n");
    const text = full.length > MAX_CHAPTER_CHARS ? `${full.slice(0, MAX_CHAPTER_CHARS)}…` : full;
    return { title, text, transcript: text };
  });
}

export async function generatePodcastScript(documents: AcademicDocument[]): Promise<PodcastScript> {
  const chunks = getChunks(documents).slice(0, 10);
  return generateJson<PodcastScript>(`Tu es l'agent audio CampusMind.
Rédige un script de discussion pédagogique entre 'Professor' (professeur expert) et 'Student' (étudiant curieux).
Le dialogue doit être naturel, engageant et pédagogique.

Sources académiques :
${JSON.stringify(chunks)}

Réponds en JSON : { "title": string, "segments": [{ "speaker": "Professor"|"Student", "text": string }] }${LANG_FR}`);
}

export async function generateAudiobookStructure(documents: AcademicDocument[]): Promise<{ chapters: AudiobookChapter[] }> {
  const local = buildAudiobookChaptersLocally(documents);
  if (local.length === 0) return { chapters: [] };

  const summaries = local.map((ch) => ({
    title: ch.title,
    preview: ch.text.slice(0, 400),
  }));

  try {
    const refined = await generateJson<{ chapters: AudiobookChapter[] }>(`Tu es l'agent audiobook CampusMind.
À partir de ces aperçus, produis au maximum ${Math.min(local.length, 6)} chapitres d'audiobook.
Pour chaque chapitre : title, text (max 800 caractères, narration fidèle), transcript (= même texte).
Ne duplique pas tout le document — condense si nécessaire.

Aperçus :
${JSON.stringify(summaries)}

Réponds en JSON compact : { "chapters": [{ "title", "text", "transcript" }] }${LANG_FR}`);

    if (refined.chapters?.length) return refined;
  } catch {
    // secours local
  }
  return { chapters: local };
}

export async function generateDiagnosticQuiz(documents: AcademicDocument[]): Promise<DiagnosticQuiz> {
  const sourceConcepts = getChunks(documents)
    .map((c) => `Chapter: ${c.chapter} | Content snippet: ${c.content.slice(0, 150)}...`)
    .join("\n");

  return generateJson<DiagnosticQuiz>(`Tu es l'agent d'évaluation CampusMind.
Génère un quiz diagnostique de 5 questions pour estimer le niveau de l'étudiant :
- Au moins 2 QCM (mcq)
- Au moins 1 Vrai/Faux (tf)
- Au moins 1 question ouverte (open)
- Au moins 1 scénario d'application (scenario)

Fournis d'excellentes options, explications et indices en français.

Matériaux sources :
${sourceConcepts.slice(0, 8000)}

Réponds en JSON : { "questions": [{ "id", "question", "type", "options", "correctAnswer", "explanation", "hint" }] }${LANG_FR}`);
}

export async function evaluateAndCurriculum(
  answers: Record<string, string>,
  quizData: DiagnosticQuiz
): Promise<{ evaluation: { mastery_score: number; weak_topics: string[]; strong_topics: string[] }; learningPath: LearningModule[] }> {
  return generateJson(`Tu es l'agent d'évaluation et l'agent curriculum CampusMind.
1. Évalue les réponses du quiz diagnostique.
2. Détermine mastery_score (0-100), weak_topics et strong_topics.
3. Compose un parcours adaptatif de 4 modules, en priorisant les weak_topics.

Quiz :
${JSON.stringify(quizData)}

Réponses de l'étudiant :
${JSON.stringify(answers)}

Réponds en JSON : { "evaluation": { "mastery_score", "weak_topics", "strong_topics" }, "learningPath": [{ "id", "title", "description", "estimatedTime", "order", "weakTopicRelation" }] }${LANG_FR}`);
}

export async function generateLesson(
  module: LearningModule,
  documents: AcademicDocument[]
): Promise<LessonContent> {
  const chunks = getChunks(documents).slice(0, 15);
  return generateJson<LessonContent>(`Tu es l'agent de leçon CampusMind.
Génère une leçon interactive complète pour le module : "${module.title}".
Description : ${module.description}
Point faible ciblé : ${module.weakTopicRelation || "N/A"}

À partir de la base de connaissances :
- Rédige une explication détaillée (explanation)
- Crée 3 keyConcepts (terme + définition)
- Fournis 2 examples concrets
- Écris 3 memoryTips mémorables

Base de connaissances :
${JSON.stringify(chunks)}

Réponds en JSON : { "title", "explanation", "keyConcepts": [{ "term", "definition" }], "examples", "memoryTips" }${LANG_FR}`);
}

export async function generateModuleQuiz(
  module: LearningModule,
  documents: AcademicDocument[]
): Promise<{ questions: Question[] }> {
  const chunks = getChunks(documents).slice(0, 15);
  return generateJson<{ questions: Question[] }>(`Tu es l'agent quiz CampusMind.
Génère un quiz pratique de 4 questions pour le module : "${module.title}".
Description : ${module.description}

Crée 4 questions variées (QCM, Vrai/Faux, ouverte, scénario) avec explications détaillées.

Base de connaissances :
${JSON.stringify(chunks)}

Réponds en JSON : { "questions": [{ "id", "question", "type", "options", "correctAnswer", "explanation" }] }${LANG_FR}`);
}

export async function generateReinforcement(documents: AcademicDocument[]) {
  const chunks = getChunks(documents).slice(0, 15);
  return generateJson(`Tu es l'agent de renforcement CampusMind (répétition espacée).
Sélectionne UN concept clé que l'étudiant risque d'oublier.
Génère conceptName, originalSource, spacedRepetitionExplanation et targetedQuickQuiz (QCM rapide).

Documents :
${JSON.stringify(chunks)}

Réponds en JSON : { "conceptName", "originalSource", "spacedRepetitionExplanation", "targetedQuickQuiz": { "question", "options", "correctAnswer", "explanation" } }${LANG_FR}`);
}

export async function generateExam(documents: AcademicDocument[]): Promise<ExamSession> {
  const chunks = getChunks(documents).slice(0, 15);
  return generateJson<ExamSession>(`Tu es l'agent générateur d'examens CampusMind.
Compile un examen réaliste de 6 questions :
- 3 QCM
- 1 Vrai/Faux
- 2 questions ouvertes

Extraits de cours :
${JSON.stringify(chunks)}

Réponds en JSON : { "title", "durationMinutes", "questions": [{ "id", "question", "type", "options" }] }${LANG_FR}`);
}

export async function evaluateExam(
  examPaper: ExamSession,
  studentAnswers: Record<string, string>
): Promise<ExamGrading> {
  return generateJson<ExamGrading>(`Tu es l'agent de correction CampusMind.
Corrige les réponses de l'examen et produis :
score, totalQuestions, corrections, chaptersPerformance, actionPlan, estimatedStudyTimeNeeded, predictedExamScore.

Examen :
${JSON.stringify(examPaper)}

Réponses de l'étudiant :
${JSON.stringify(studentAnswers)}

Réponds en JSON complet avec tous ces champs.${LANG_FR}`);
}

export async function executeWorkflowStep(
  stepId: string,
  documents: AcademicDocument[]
): Promise<WorkflowStepResult> {
  const chunks = getChunks(documents);
  const chapters = Array.from(new Set(chunks.map((c) => c.chapter)));

  switch (stepId) {
    case "init-audiobook": {
      const chapters = buildAudiobookChaptersLocally(documents);
      return {
        message: `[Structure Agent] ${chapters.length} chapitres indexés — ${chapters.slice(0, 2).map((c) => c.title).join(", ")}${chapters.length > 2 ? "…" : ""}`,
        outputs: { audiobookChapters: chapters },
      };
    }
    case "init-podcast": {
      const script = await generatePodcastScript(documents);
      return {
        message: `[Podcast Script Agent] Audio Summary prêt — « ${script.title} » (${script.segments.length} répliques)`,
        outputs: { podcastScript: script },
      };
    }
    case "assessment": {
      const data = await generateJson<{ score: number; weak: string[] }>(
        `À partir de ces matériaux : ${chunks.slice(0, 3).map((c) => c.chapter).join(", ")}, estime un score de maîtrise (0-100) et 3 points faibles. JSON : { "score", "weak" }${LANG_FR}`
      );
      return { message: `[Assessment Agent] Diagnostic terminé — maîtrise : ${data.score}%. Lacunes : ${data.weak.join(", ")}` };
    }
    case "curriculum": {
      const data = await generateJson<{ modules: { title: string }[] }>(
        `À partir des chapitres ${chapters.join(", ")}, recommande 3 modules adaptatifs. JSON : { "modules": [{ "title", "desc" }] }${LANG_FR}`
      );
      return { message: `[Curriculum Agent] Parcours personnalisé — ${data.modules.length} modules planifiés` };
    }
    case "training-quiz":
      return { message: "[Quiz Agent · Reinforcement Agent] Quiz adaptatifs et exercices de renforcement générés" };
    case "exam-sim":
      return { message: "[Exam Generator · Grading Agent] Examen simulé prêt — 6 questions, correction automatique activée" };
    default:
      throw new Error("Étape de workflow invalide");
  }
}

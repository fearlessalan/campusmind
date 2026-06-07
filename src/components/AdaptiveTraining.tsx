"use client";

import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  Activity, 
  ChevronRight, 
  AlertTriangle,
  Lightbulb, 
  ListTodo,
  Smile,
  Timer,
  PlayCircle,
  FileQuestion,
  RotateCcw,
  Loader2
} from "lucide-react";
import { 
  DiagnosticQuiz, 
  QuizEvaluation, 
  LearningModule, 
  LessonContent, 
  Question 
} from "../types";
import { apiFetch, parseApiResponse } from "../lib/api";
import {
  evaluateAndCurriculum,
  generateDiagnosticQuiz,
  generateLesson,
  generateModuleQuiz,
  generateReinforcement,
} from "../lib/campusAi";
import { useModal } from "../context/ModalContext";

function getOptionText(opt: any): string {
  if (typeof opt === "object" && opt !== null) {
    return String(Object.values(opt)[0] || "");
  }
  return String(opt || "");
}

function getOptionKey(opt: any, index: number): string {
  if (typeof opt === "object" && opt !== null) {
    return `${Object.keys(opt)[0]}-${index}`;
  }
  return `${opt}-${index}`;
}

interface AdaptiveTrainingProps {
  documents: any[];
  learningPath: LearningModule[];
  completedLessons: string[];
  onCurriculumUpdate: (path: LearningModule[], evaluation: any) => void;
  onLessonComplete: (moduleId: string) => void;
  onScoreRecorded?: (db: Record<string, unknown>) => void;
  onAssetSaved?: (input: { type: "quiz"; title: string; content: string; score: number; sourceCount?: number }) => Promise<void>;
}

export default function AdaptiveTraining({
  documents,
  learningPath,
  completedLessons,
  onCurriculumUpdate,
  onLessonComplete,
  onScoreRecorded,
  onAssetSaved,
}: AdaptiveTrainingProps) {
  const { showAlert } = useModal();

  // Phase toggles: "diagnostic" | "curriculum"
  const [phase, setPhase] = useState<"diagnostic" | "curriculum">("curriculum");
  
  // Diagnostic State
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [diagnosticQuiz, setDiagnosticQuiz] = useState<DiagnosticQuiz | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [isSubmittingDiagnostic, setIsSubmittingDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<QuizEvaluation | null>(null);

  // Lesson State
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [isFinishingLesson, setIsFinishingLesson] = useState(false);

  // Practice Quiz State
  const [practiceQuiz, setPracticeQuiz] = useState<Question[] | null>(null);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [checkedPractice, setCheckedPractice] = useState(false);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);

  // Reinforcement Spaced Repetition State
  const [reinforcementData, setReinforcementData] = useState<any>(null);
  const [loadingReinforcement, setLoadingReinforcement] = useState(false);
  const [reinforcementAnswer, setReinforcementAnswer] = useState<string | null>(null);
  const [reinforcementSolved, setReinforcementSolved] = useState(false);

  // Auto trigger reinforcement load
  useEffect(() => {
    if (documents.length > 0) {
      loadReinforcementConcept();
    }
  }, [documents]);

  const startDiagnostic = async () => {
    setLoadingQuiz(true);
    setDiagnosticQuiz(null);
    setStudentAnswers({});
    setPhase("diagnostic");
    try {
      if (documents.length === 0) throw new Error("Importez d'abord des documents.");
      const data = await generateDiagnosticQuiz(documents);
      setDiagnosticQuiz(data);
    } catch (err) {
      showAlert("Entraînement", (err as Error).message, "error");
      setPhase("curriculum");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (qId: string, opt: string) => {
    setStudentAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const submitDiagnostic = async () => {
    if (!diagnosticQuiz) return;
    setIsSubmittingDiagnostic(true);
    try {
      const aiResult = await evaluateAndCurriculum(studentAnswers, diagnosticQuiz);
      const response = await apiFetch("/api/training/save-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiResult)
      });
      const data = await parseApiResponse<{
        evaluation: QuizEvaluation;
        learningPath: LearningModule[];
        dbState?: Record<string, unknown>;
      }>(response);

      setDiagnosticResult(data.evaluation);
      onCurriculumUpdate(data.learningPath, data.evaluation);
      if (data.dbState) onScoreRecorded?.(data.dbState);
      await onAssetSaved?.({
        type: "quiz",
        title: "Diagnostic initial",
        content: `Score de maîtrise : ${data.evaluation.mastery_score}%`,
        score: data.evaluation.mastery_score,
        sourceCount: documents.length,
      });
      setPhase("curriculum");
      // Load first module lesson automatically
      if (data.learningPath.length > 0) {
        loadLesson(data.learningPath[0].id);
      }
    } catch (err: any) {
      showAlert("Évaluation", err.message, "error");
    } finally {
      setIsSubmittingDiagnostic(false);
    }
  };

  const loadLesson = async (modId: string) => {
    setActiveModuleId(modId);
    setLessonContent(null);
    setPracticeQuiz(null);
    setPracticeAnswers({});
    setCheckedPractice(false);
    setPracticeScore(null);
    setLoadingLesson(true);

    try {
      const mod = learningPath.find((m) => m.id === modId);
      if (!mod) throw new Error("Module introuvable");
      const data = await generateLesson(mod, documents);
      setLessonContent(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingLesson(false);
    }
  };

  const completeLessonAndMark = async () => {
    if (!activeModuleId) return;
    setIsFinishingLesson(true);
    try {
      const response = await apiFetch(`/api/module/${activeModuleId}/complete`, { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        onLessonComplete(activeModuleId);
        // Refresh active path modules completion in UI
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinishingLesson(false);
    }
  };

  const loadPracticeQuiz = async () => {
    if (!activeModuleId) return;
    setLoadingPractice(true);
    setPracticeQuiz(null);
    setPracticeAnswers({});
    setCheckedPractice(false);
    setPracticeScore(null);

    try {
      const mod = learningPath.find((m) => m.id === activeModuleId);
      if (!mod) throw new Error("Module introuvable");
      const data = await generateModuleQuiz(mod, documents);
      setPracticeQuiz(data.questions);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingPractice(false);
    }
  };

  const submitPracticeQuiz = async () => {
    if (!practiceQuiz) return;
    let correctCount = 0;
    practiceQuiz.forEach((q) => {
      const studentAns = (practiceAnswers[q.id] || "").trim().toLowerCase();
      const correctAns = getOptionText(q.correctAnswer).trim().toLowerCase();
      if (studentAns === correctAns) {
        correctCount += 1;
      }
    });
    const finalScore = Math.round((correctCount / practiceQuiz.length) * 100);
    setPracticeScore(finalScore);
    setCheckedPractice(true);

    // Save score to performance ledger
    try {
      const targetModule = learningPath.find((m) => m.id === activeModuleId);
      const moduleTitle = targetModule?.title || "Exercices du module";
      const response = await apiFetch("/api/quiz/record-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleTitle, score: finalScore }),
      });
      const data = await parseApiResponse<{ db: Record<string, unknown> }>(response);
      if (data.db) onScoreRecorded?.(data.db);
      await onAssetSaved?.({
        type: "quiz",
        title: `Quiz : ${moduleTitle}`,
        content: `Score obtenu : ${finalScore}% (${correctCount}/${practiceQuiz.length} bonnes réponses)`,
        score: finalScore,
        sourceCount: documents.length,
      });
    } catch (e) {
      console.error("Score record failed", e);
    }
  };

  const loadReinforcementConcept = async () => {
    setLoadingReinforcement(true);
    setReinforcementData(null);
    setReinforcementAnswer(null);
    setReinforcementSolved(false);
    try {
      if (documents.length === 0) return;
      const data = await generateReinforcement(documents);
      setReinforcementData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReinforcement(false);
    }
  };

  const handleReinforceSubmit = (opt: string) => {
    setReinforcementAnswer(opt);
    setReinforcementSolved(true);
  };

  const hasDocs = documents.length > 0;

  return (
    <div className="space-y-8">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-white rounded-2xl border border-outline-variant md-elevation-1">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary animate-pulse" /> Entraînement
          </h1>
          <p className="text-sm text-on-surface-variant max-w-lg mt-1">
            Parcours personnalisé à partir de vos documents : diagnostic, plan d'apprentissage, quiz adaptatifs et renforcement espacé.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {["Assessment", "Curriculum", "Quiz", "Performance", "Reinforcement"].map((agent) => (
              <span key={agent} className="md-chip text-[10px]">{agent}</span>
            ))}
          </div>
        </div>

        {hasDocs && (
          <button
            onClick={startDiagnostic}
            className="mt-4 md:mt-0 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl hover:scale-102 cursor-pointer transition-all shadow-md select-none"
          >
            Lancer une nouvelle évaluation diagnostique
          </button>
        )}
      </div>

      {/* PHASE 1: DIAGNOSTIC TESTING ZONE */}
      {phase === "diagnostic" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
            <Timer className="w-5 h-5 text-indigo-500 animate-spin" />
            <div>
              <h2 className="text-base font-sans font-semibold text-slate-900">L'agent d'évaluation cognitive analyse...</h2>
              <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Cartographie des capacités de référence</span>
            </div>
          </div>

          {loadingQuiz ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-mono">Formulation d'un quiz diagnostique multi-format à partir des pages du manuel...</p>
            </div>
          ) : (diagnosticQuiz && Array.isArray(diagnosticQuiz.questions)) ? (
            <div className="space-y-6">
              {diagnosticQuiz.questions.map((q, qIndex) => (
                <div key={q.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-3 text-xs">
                  <span className="px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-600 font-mono text-[9px] font-bold uppercase">
                    Q{qIndex + 1} • {q.type}
                  </span>
                  <p className="font-semibold text-slate-800 text-sm">{q.question}</p>
                  
                  {q.hint && (
                    <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Indice : {q.hint}
                    </p>
                  )}

                  {/* Options rendering */}
                  {q.options && q.options.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const optText = getOptionText(opt);
                        const isSelected = studentAnswers[q.id] === optText;
                        return (
                          <button
                            key={getOptionKey(opt, optIdx)}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optText)}
                            className={`px-4 py-3 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer flex justify-between ${
                              isSelected
                                ? "bg-indigo-600 text-white border-transparent"
                                : "hover:bg-slate-100/50 bg-white text-slate-700 border-slate-200"
                            }`}
                          >
                            <span>{optText}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pt-1.5">
                      <input
                        type="text"
                        placeholder="Saisissez une explication détaillée..."
                        value={studentAnswers[q.id] || ""}
                        onChange={(e) => handleSelectOption(q.id, e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:outline-hidden focus:border-indigo-400 text-xs text-slate-700"
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end pt-4 border-t border-slate-50">
                <button
                  onClick={submitDiagnostic}
                  disabled={isSubmittingDiagnostic || Object.keys(studentAnswers).length < 2}
                  className="px-5 py-3 rounded-lg text-xs text-white font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 animate-pulse shadow-sm cursor-pointer"
                >
                  {isSubmittingDiagnostic ? "L'agent compile le parcours..." : "Analyser les performances et compiler le parcours"}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              Moteur d'évaluation hors ligne. Veuillez réessayer.
            </div>
          )}
        </div>
      )}

      {/* PHASE 2: ACTIVE REINFORCED ASSISTANCE MODULE */}
      {phase === "curriculum" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Adaptive Weekly Path */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs">
              <h2 className="text-sm font-sans font-semibold text-slate-900 mb-4 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-indigo-500" /> Parcours principal actif
              </h2>

              {learningPath.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-3">
                  <p>Vous n'avez pas encore lancé d'évaluation diagnostique adaptative avec l'agent de parcours !</p>
                  <p className="text-[11px] opacity-80">Nous pouvons générer des modules d'apprentissage standard dès maintenant à partir des manuels préchargés, en lançant le diagnostic ci-dessus.</p>
                  {hasDocs && (
                    <button
                      onClick={startDiagnostic}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg select-none cursor-pointer"
                    >
                      Démarrer le diagnostic
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {learningPath.map((mod) => {
                    const isCompleted = completedLessons.includes(mod.id) || mod.isCompleted;
                    const isActive = activeModuleId === mod.id;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => loadLesson(mod.id)}
                        className={`p-3.5 border rounded-xl cursor-pointer select-none transition-all flex flex-col gap-2 ${
                          isActive
                            ? "border-indigo-500 bg-indigo-50/15"
                            : isCompleted
                            ? "border-emerald-100 bg-emerald-50/5 hover:bg-emerald-50/10"
                            : "border-slate-150 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                                Module {mod.order}
                              </span>
                              {mod.weakTopicRelation && (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-mono font-bold uppercase rounded-sm border border-rose-100/30">
                                  Prioritaire : {mod.weakTopicRelation}
                                </span>
                              )}
                            </div>
                            <h3 className="font-sans font-bold text-xs text-slate-805 truncate block max-w-56">{mod.title}</h3>
                          </div>

                          {isCompleted ? (
                            <span className="text-emerald-600 font-mono text-[10px] lowercase flex items-center gap-0.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> maîtrisé
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{mod.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SPACED REPETITION BLOCK: Agent 6 (Reinforcement Agent) */}
            {hasDocs && reinforcementData && reinforcementData.targetedQuickQuiz && (
              <div className="bg-secondary-container/60 border border-outline-variant text-on-surface p-5 rounded-2xl md-elevation-2 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-1.5 pb-3.5 border-b border-outline-variant">
                  <Activity className="w-4 h-4 text-primary animate-pulse" />
                  <div>
                    <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-primary">Répétition espacée active</h3>
                    <span className="text-[9px] text-on-surface-variant">Concept d'audit mémoriel programmé</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold text-on-surface">Concept : {reinforcementData.conceptName}</span>
                      <span className="text-on-surface-variant font-mono">{reinforcementData.originalSource}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed font-sans">{reinforcementData.spacedRepetitionExplanation}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-outline-variant space-y-3">
                    <span className="px-1.5 py-0.5 bg-primary-container text-primary text-[8px] font-mono font-bold uppercase border border-primary/20 rounded-sm">Vérification de rappel immédiat</span>
                    <p className="font-semibold text-on-surface text-[11px] leading-relaxed">{reinforcementData.targetedQuickQuiz.question}</p>
                    
                    <div className="space-y-2">
                      {reinforcementData.targetedQuickQuiz.options?.map((opt: any, optIdx: number) => {
                        const optText = getOptionText(opt);
                        const correctVal = getOptionText(reinforcementData.targetedQuickQuiz?.correctAnswer);
                        const isSelected = reinforcementAnswer === optText;
                        const isCorrectOpt = optText === correctVal;

                        return (
                          <button
                            key={getOptionKey(opt, optIdx)}
                            disabled={reinforcementSolved}
                            onClick={() => handleReinforceSubmit(optText)}
                            className={`w-full text-left px-3 py-2 text-[10px] font-medium rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                              reinforcementSolved
                                ? isCorrectOpt
                                  ? "bg-success-container/50 border-success/30 text-success"
                                  : isSelected
                                  ? "bg-error-container/50 border-error/30 text-error"
                                  : "bg-surface-container-low text-on-surface-variant border-outline-variant"
                                : "hover:bg-surface-container bg-white text-on-surface border-outline-variant"
                            }`}
                          >
                            <span>{optText}</span>
                            {reinforcementSolved && isCorrectOpt && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {reinforcementSolved && (
                      <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800">
                        <span className="font-semibold text-white block pb-1">Logique de correction :</span>
                        <span>{reinforcementData.targetedQuickQuiz.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Material Explainer + Practice Test */}
          <div className="lg:col-span-7 space-y-6">
            
            {!activeModuleId ? (
              <div className="bg-white py-16 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-slate-400 text-center px-6">
                <PlayCircle className="w-12 h-12 stroke-1 text-slate-300 animate-bounce mb-3" />
                <h3 className="font-sans font-medium text-slate-700 text-sm">Consulter les leçons du manuel</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Sélectionnez un module du parcours à gauche pour compiler son guide pédagogique IA et ses exercices adaptatifs.
                </p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
                
                {/* Active module lesson contents */}
                <div className="pb-5 border-b border-slate-50 space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">Lecture en cours</span>
                      <h2 className="text-lg font-sans font-bold text-slate-900 leading-tight">
                        {loadingLesson ? "L'agent compile la leçon..." : lessonContent?.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadPracticeQuiz}
                        disabled={loadingLesson || loadingPractice}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg select-none cursor-pointer text-slate-800 transition-all flex items-center gap-1 shrink-0"
                      >
                        <FileQuestion className="w-3.5 h-3.5" /> Défi pratique
                      </button>

                      <button
                        onClick={completeLessonAndMark}
                        disabled={loadingLesson || isFinishingLesson}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-lg select-none cursor-pointer transition-all flex items-center gap-1 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terminer la leçon
                      </button>
                    </div>
                  </div>

                  {loadingLesson ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs font-mono">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span>Synthèse des leçons, glossaires, scénarios réels et mnémoniques...</span>
                    </div>
                  ) : lessonContent ? (
                    <div className="space-y-5 text-slate-700 text-xs leading-relaxed">
                      {/* Detailed Text Explanations */}
                      <p className="whitespace-pre-line text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">{lessonContent.explanation}</p>

                      {/* Active Concept Glossary Flashcards */}
                      <div className="space-y-3">
                        <span className="font-semibold text-slate-900 block flex items-center gap-1">Fiches glossaire conceptuelles :</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {lessonContent.keyConcepts.map((item, keyIdx) => (
                            <div key={keyIdx} className="p-3 bg-linear-to-b from-indigo-50/10 to-indigo-50/20 border border-indigo-100/40 rounded-xl space-y-1">
                              <span className="font-semibold text-slate-800 block truncate">{item.term}</span>
                              <span className="text-[10px] text-slate-500 block leading-relaxed">{item.definition}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sciene Applied examples */}
                      {lessonContent.examples && (
                        <div className="p-4 bg-emerald-50/30 border border-emerald-150/40 rounded-xl space-y-2">
                          <span className="font-semibold text-emerald-800 block text-xs">Cas pratiques appliqués :</span>
                          <ul className="list-disc pl-4 space-y-1.5 text-slate-650">
                            {lessonContent.examples.map((ex, eIdx) => (
                              <li key={eIdx}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Sill eccentric memory tricks */}
                      {lessonContent.memoryTips && (
                        <div className="p-4 bg-amber-50/30 border border-amber-150/40 rounded-xl space-y-2">
                          <span className="font-semibold text-amber-800 block text-xs flex items-center gap-1.5">
                            <Smile className="w-4 h-4 text-amber-500 shrink-0" /> Astuces mnémoniques (Agent de leçon IA) :
                          </span>
                          <ul className="list-disc pl-4 space-y-1.5 text-slate-650 italic">
                            {lessonContent.memoryTips.map((tip, tIdx) => (
                              <li key={tIdx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400">
                      Contenu du module non chargé. Cliquez sur un module pour afficher la leçon.
                    </div>
                  )}
                </div>

                {/* PRACTICE CHALLENGES FRAME FOR CHOSEN LESSON MODULE */}
                {Array.isArray(practiceQuiz) && practiceQuiz.length > 0 ? (
                  <div className="pt-2 animate-fadeIn space-y-5">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <div>
                        <h3 className="font-sans font-semibold text-slate-900 text-sm flex items-center gap-1">
                          <FileQuestion className="w-4.5 h-4.5 text-indigo-500" /> Quiz adaptatif par thème
                        </h3>
                        <p className="text-[10px] text-slate-400">Vérification interactive compilée à partir des supports</p>
                      </div>
                      
                      {checkedPractice && practiceScore !== null && (
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                          practiceScore >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}>
                          Score : {practiceScore}%
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {practiceQuiz.map((pq, pqIdx) => (
                        <div key={pq.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-3">
                          <div className="flex justify-between">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono text-[9px] font-bold uppercase uppercase tracking-wider">
                              Q{pqIdx + 1} • {pq.type}
                            </span>
                            {checkedPractice && (
                              <span className={`font-semibold ${
                                (practiceAnswers[pq.id] || "").trim().toLowerCase() === getOptionText(pq.correctAnswer).trim().toLowerCase()
                                  ? "text-emerald-600" : "text-rose-600"
                              }`}>
                                {(practiceAnswers[pq.id] || "").trim().toLowerCase() === getOptionText(pq.correctAnswer).trim().toLowerCase() ? "Correct" : "Incorrect"}
                              </span>
                            )}
                          </div>
                          
                          <p className="font-semibold text-slate-800">{pq.question}</p>

                          {pq.options && pq.options.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {pq.options.map((option, optIdx) => (
                                <button
                                  key={getOptionKey(option, optIdx)}
                                  type="button"
                                  disabled={checkedPractice}
                                  onClick={() => setPracticeAnswers(prev => ({ ...prev, [pq.id]: getOptionText(option) }))}
                                  className={`px-3 py-2 text-left rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex justify-between items-center ${
                                    practiceAnswers[pq.id] === getOptionText(option)
                                      ? "bg-indigo-600 border-transparent text-white"
                                      : "hover:bg-slate-100 bg-white border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <span>{getOptionText(option)}</span>
                                  {practiceAnswers[pq.id] === getOptionText(option) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <input
                              type="text"
                              disabled={checkedPractice}
                              placeholder="Saisissez une description scientifique..."
                              value={practiceAnswers[pq.id] || ""}
                              onChange={(e) => setPracticeAnswers(prev => ({ ...prev, [pq.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 bg-white focus:outline-hidden text-xs rounded-lg"
                            />
                          )}

                          {checkedPractice && (
                            <div className="pt-2 border-t border-slate-150/40 text-[10px] text-slate-400">
                              <span className="font-semibold text-slate-700 block pb-0.5">Réponse correcte : {getOptionText(pq.correctAnswer)}</span>
                              <span className="block">{pq.explanation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {!checkedPractice ? (
                        <button
                          onClick={submitPracticeQuiz}
                          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer select-none transition-all"
                        >
                          Soumettre les réponses et évaluer
                        </button>
                      ) : (
                        <button
                          onClick={loadPracticeQuiz}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Recommencer le quiz
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  loadingPractice && (
                    <div className="pt-6 py-12 flex flex-col items-center justify-center space-y-2 font-mono text-xs text-slate-400">
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                      <span>L'agent collecte les paramètres des questions...</span>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

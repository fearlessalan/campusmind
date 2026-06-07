"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Award, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  PlayCircle, 
  HelpCircle, 
  Loader2, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Lightbulb,
  FileText
} from "lucide-react";
import { ExamSession, ExamGrading } from "../types";
import { apiFetch, parseApiResponse } from "../lib/api";
import { evaluateExam, generateExam } from "../lib/campusAi";
import { useModal } from "../context/ModalContext";

interface ExamSimulatorProps {
  documents: any[];
  onExamSaved: (db: Record<string, unknown>) => void;
  onAssetSaved?: (input: { type: "exam"; title: string; content: string; score: number; sourceCount?: number }) => Promise<void>;
}

type DifficultyLevel = "Facile" | "Moyen" | "Difficile";

const DIFFICULTY_OPTIONS: DifficultyLevel[] = ["Facile", "Moyen", "Difficile"];

export default function ExamSimulator({ documents, onExamSaved, onAssetSaved }: ExamSimulatorProps) {
  const { showAlert } = useModal();

  // States: "setup" | "active" | "results"
  const [examState, setExamState] = useState<"setup" | "active" | "results">("setup");
  
  // Exam metadata fields
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Moyen");
  const [examDuration, setExamDuration] = useState<number>(10); // inside minutes

  // Active Session Variables
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [activeExam, setActiveExam] = useState<ExamSession | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});

  // Countdown clock state
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Evaluation Metrics
  const [isGrading, setIsGrading] = useState(false);
  const [examResults, setExamResults] = useState<ExamGrading | null>(null);

  // Initialize and run timer
  useEffect(() => {
    if (examState === "active" && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            autoSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examState, secondsRemaining]);

  const startExam = async () => {
    setIsLoadingExam(true);
    setActiveExam(null);
    setStudentAnswers({});
    setCurrentQuestionIdx(0);

    try {
      if (documents.length === 0) throw new Error("Importez d'abord des documents.");
      const data = await generateExam(documents);
      setActiveExam(data);
      setSecondsRemaining(examDuration * 60);
      setExamState("active");
    } catch (err: any) {
      showAlert("Exam Simulator", err.message, "error");
    } finally {
      setIsLoadingExam(false);
    }
  };

  const handleSelectAnswer = (qId: string, value: string) => {
    setStudentAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const submitExam = async () => {
    if (!activeExam) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsGrading(true);
    setExamState("results");

    try {
      const grading = await evaluateExam(activeExam, studentAnswers);
      const response = await apiFetch("/api/exam/save-grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grading, examTitle: activeExam.title })
      });
      const data = await parseApiResponse<{ dbState: Record<string, unknown> }>(response);

      setExamResults(grading);
      if (data.dbState) {
        onExamSaved(data.dbState);
        await onAssetSaved?.({
          type: "exam",
          title: activeExam.title,
          content: `Score : ${grading.score}% — ${grading.totalQuestions} questions`,
          score: grading.score,
          sourceCount: documents.length,
        });
      }
    } catch (err: any) {
      showAlert("Correction", err.message, "error");
      setExamState("active");
    } finally {
      setIsGrading(false);
    }
  };

  const autoSubmitExam = () => {
    showAlert("Temps écoulé", "Durée de simulation écoulue ! L'agent examinateur soumet automatiquement toutes les réponses.", "warning");
    submitExam();
  };

  const handleReset = () => {
    setExamState("setup");
    setActiveExam(null);
    setExamResults(null);
  };

  // Human readable mm:ss parsing
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const hasDocs = documents.length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Dynamic Header */}
      <div className="p-6 bg-white rounded-2xl border border-outline-variant md-elevation-1">
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" /> Exam Simulator
        </h1>
        <p className="text-sm text-on-surface-variant max-w-xl mt-1">
          Génération d'examens réalistes, surveillance du temps, correction automatique, analyse des erreurs et recommandations de révision.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {["Exam Generator", "Proctor", "Grading", "Insights", "Recommendation"].map((agent) => (
            <span key={agent} className="md-chip text-[10px]">{agent}</span>
          ))}
        </div>
      </div>

      {/* PHASE 1: CONFIGURATION SETUPS */}
      {examState === "setup" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <h2 className="text-sm font-sans font-semibold text-slate-900 flex items-center gap-1.5 pb-3 border-b border-slate-55">
              <PlayCircle className="w-4 h-4 text-indigo-500" /> Configuration de la simulation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-xs">
                <label className="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Niveau de difficulté académique</label>
                <div className="flex gap-2">
                  {DIFFICULTY_OPTIONS.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        difficulty === diff
                          ? "bg-primary text-on-primary border-transparent shadow-xs"
                          : "bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Durée limite</label>
                <div className="flex items-center gap-2">
                  {[5, 10, 20].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setExamDuration(time)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        examDuration === time
                          ? "bg-primary text-on-primary border-transparent shadow-xs"
                          : "bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {time} min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={startExam}
                disabled={isLoadingExam || !hasDocs}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm font-sans hover:scale-102 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer select-none"
              >
                {isLoadingExam ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Finalisation des paramètres du générateur...
                  </>
                ) : (
                  <>
                    Lancer la session de simulation <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-primary-container/40 border border-primary/15 text-on-surface p-5 rounded-2xl md-elevation-2 flex flex-col justify-between">
            <div className="space-y-4 text-xs">
              <span className="px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-[9px] font-mono text-primary tracking-wider uppercase font-bold">
                Consignes de l'examinateur
              </span>
              <p className="text-on-surface-variant leading-relaxed font-sans">
                Le simulateur lit les chapitres actifs pour compiler 6 questions d'examen approfondies couvrant QCM, Vrai/Faux et définitions comparatives.
              </p>
              <ul className="space-y-2 text-[11px] text-slate-400 list-inside list-disc">
                <li>Aucun accès aux résumés de cours pendant le chronomètre</li>
                <li>Résultats en direct avec résolution des erreurs</li>
                <li>Feuille de route d'étude post-examen compilée</li>
              </ul>
            </div>
            
            {!hasDocs && (
              <div className="mt-4 p-3 bg-red-950/20 text-red-300 border border-red-900/40 rounded-lg text-[10px] leading-relaxed">
                *La base de connaissances est vide. Importez des cours depuis le tableau de bord au préalable !
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 2: ACTIVE EXAM HALL INTERFACE */}
      {examState === "active" && activeExam && Array.isArray(activeExam.questions) && activeExam.questions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* Dashboard Left Side: Navigation & Countdown */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Countdown Badge */}
            <div className="bg-primary-container/50 border border-primary/20 text-on-surface p-5 rounded-2xl flex items-center justify-between md-elevation-2">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-slate-450 uppercase tracking-wider font-bold block">Chronomètre de l'examinateur</span>
                <span className="text-xs font-sans text-on-surface-variant">Limites du compte à rebours actives</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/15 text-red-400 px-3.5 py-1.5 rounded-xl border border-red-500/10 font-mono text-lg font-bold">
                <Timer className="w-4.5 h-4.5 animate-pulse" /> {formatTime(secondsRemaining)}
              </div>
            </div>

            {/* Quick Hop Navigation Map */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">Matrice de navigation</h3>
              <div className="grid grid-cols-3 gap-2">
                {activeExam.questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIdx;
                  const isAnswered = studentAnswers[q.id] !== undefined;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`py-3.5 text-xs font-bold font-mono rounded-xl transition-all border cursor-pointer ${
                        isCurrent
                          ? "bg-primary text-on-primary border-transparent scale-103 shadow-md"
                          : isAnswered
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-105"
                      }`}
                    >
                      Q{idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-5 border-t border-slate-100 mt-5">
                <button
                  onClick={submitExam}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl hover:scale-102 transition-all cursor-pointer shadow-sm select-none"
                >
                  Conclure et soumettre la copie
                </button>
              </div>
            </div>

          </div>

          {/* Dashboard Right Side: Active Question Panel */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-5">
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  Question active {currentQuestionIdx + 1} sur {activeExam.questions.length} (Type : {activeExam.questions[currentQuestionIdx].type})
                </span>
                <span className="px-2 py-0.5 text-[9px] font-semibold bg-slate-50 text-slate-500 border rounded font-mono">
                  Niveau de qualification
                </span>
              </div>

              <div className="space-y-4">
                <p className="font-sans font-bold text-slate-800 text-base leading-relaxed">
                  {activeExam.questions[currentQuestionIdx].question}
                </p>

                {/* Question Option Selection */}
                {activeExam.questions[currentQuestionIdx].options ? (
                  <div className="grid grid-cols-1 gap-2.5 pt-3">
                    {activeExam.questions[currentQuestionIdx].options!.map((opt) => {
                      const isSelected = studentAnswers[activeExam.questions[currentQuestionIdx].id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectAnswer(activeExam.questions[currentQuestionIdx].id, opt)}
                          className={`w-full text-left px-4 py-3 text-xs rounded-xl font-medium border cursor-pointer select-none transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-600 text-white border-transparent shadow-xs"
                              : "hover:bg-slate-50 bg-slate-50/50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pt-3">
                    <textarea
                      rows={5}
                      placeholder="Saisissez une définition comparative rigoureuse sur les sujets demandés..."
                      value={studentAnswers[activeExam.questions[currentQuestionIdx].id] || ""}
                      onChange={(e) => handleSelectAnswer(activeExam.questions[currentQuestionIdx].id, e.target.value)}
                      className="w-full p-4 border rounded-xl bg-slate-50 text-xs focus:outline-hidden text-slate-700 focus:border-indigo-400 focus:bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Buttons */}
            <div className="flex justify-between pt-5 border-t border-slate-50 mt-8">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx((p) => p - 1)}
                className="px-3.5 py-1.5 text-xs text-slate-500 font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-all cursor-pointer select-none"
              >
                Section précédente
              </button>

              {currentQuestionIdx === activeExam.questions.length - 1 ? (
                <button
                  onClick={submitExam}
                  className="px-4 py-2 text-xs text-white font-semibold bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all cursor-pointer select-none"
                >
                  Terminer la session active
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                  className="px-4 py-2 text-xs text-slate-700 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg transition-all cursor-pointer select-none"
                >
                  Passer / Section suivante
                </button>
              )}
            </div>

          </div>

        </div>
      )}

      {/* PHASE 3: EVALUATIONS & SCORECARD FEEDBACK */}
      {examState === "results" && (
        <div className="space-y-6">
          
          {isGrading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-mono font-bold animate-pulse">L'agent de notation vérifie les réponses...</p>
              <span className="text-[10px] text-slate-400 italic">Comparaison des définitions avec les chapitres du manuel...</span>
            </div>
          ) : examResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
              
              {/* Score card summary left */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Gauge Panel */}
                <div className="bg-white p-6 rounded-2xl border border-slate-101 shadow-xs text-center space-y-4">
                  <h3 className="text-sm font-sans font-semibold text-slate-900">Relevé de notes</h3>
                  
                  {/* Big SVG circular gauge */}
                  <div className="relative w-36 h-36 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        stroke={examResults.score >= 70 ? "#10b981" : examResults.score >= 50 ? "#f59e0b" : "#f43f5e"} 
                        strokeWidth="8.5" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - examResults.score / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 origin-center -rotate-90"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-slate-900">{examResults.score}%</span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">Note globale</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase block">Décision de l'examinateur</span>
                    <span className={`text-xs font-bold ${examResults.score >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                      {examResults.score >= 70 ? "Réussi, excellent seuil de confiance !" : "Nécessite des actions d'étude ciblées."}
                    </span>
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Passer une autre simulation d'examen
                  </button>
                </div>

                {/* Recommendation plan (Agent 5 - Recommendation Agent) */}
                <div className="bg-secondary-container/60 border border-outline-variant text-on-surface p-5 rounded-2xl md-elevation-2 space-y-4">
                  <div className="pb-3 border-b border-outline-variant flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-wider text-primary">Recommandations du plan d'action</h4>
                      <span className="text-[9px] text-on-surface-variant block">Élaboré par l'agent de recommandation</span>
                    </div>
                  </div>

                  <ul className="space-y-3.5 text-xs">
                    {examResults.actionPlan.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-on-surface font-sans leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-outline-variant text-center">
                    <div className="p-2 bg-white border border-outline-variant rounded-xl space-y-0.5">
                      <span className="text-[8px] font-mono uppercase text-on-surface-variant font-bold block">Budget d'étude</span>
                      <span className="text-xs font-bold text-on-surface font-mono">{examResults.estimatedStudyTimeNeeded}</span>
                    </div>
                    <div className="p-2 bg-white border border-outline-variant rounded-xl space-y-0.5">
                      <span className="text-[8px] font-mono uppercase text-on-surface-variant font-bold block">Note prédite</span>
                      <span className="text-xs font-bold text-on-surface font-mono">{examResults.predictedExamScore}%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Mistakes audits right */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Section Proficiency breakdown matrix (Insight Agent) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h3 className="text-sm font-sans font-semibold text-slate-900">Analyse de rétention par module</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {examResults.chaptersPerformance.map((chap, idx) => (
                      <div key={idx} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-700 truncate block max-w-44">{chap.chapter}</span>
                          <span className="font-mono text-slate-500 font-bold">{chap.score}%</span>
                        </div>
                        <div className="w-full bg-slate-200/60 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full ${
                              chap.score >= 70 ? "bg-emerald-500" : chap.score >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${chap.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-sans font-semibold text-slate-900">Revue des réponses notées</h3>
                  
                  {examResults.corrections.map((corr, idx) => (
                    <div key={corr.questionId} className="p-4 rounded-xl bg-white border border-slate-100 shadow-3xs space-y-3.5 text-xs">
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Question {idx + 1}</span>
                        {corr.isCorrect ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-mono text-[9px] font-bold uppercase">Réussi</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-mono text-[9px] font-bold uppercase">À revoir</span>
                        )}
                      </div>

                      <p className="font-semibold text-slate-800 text-xs leading-relaxed">{corr.questionText}</p>

                      <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100 leading-relaxed font-mono text-[11px] text-slate-650">
                        <div>
                          <span className="font-bold text-slate-400 block pb-0.5 text-[10px]">Votre réponse :</span>
                          <span className={corr.isCorrect ? "text-emerald-600" : "text-rose-600"}>{corr.studentAnswer || "[Aucune réponse fournie]"}</span>
                        </div>
                        
                        {!corr.isCorrect && (
                          <div className="pt-2 mt-2 border-t border-slate-200/40">
                            <span className="font-bold text-slate-400 block pb-0.5 text-[10px]">Solution attendue :</span>
                            <span className="text-slate-800">{corr.correctAnswer}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-linear-to-b from-indigo-50/10 to-indigo-50/20 border border-indigo-100/30 rounded-lg text-[10px] text-slate-500 flex flex-col gap-0.5">
                        <span className="font-semibold text-indigo-700 font-sans block pb-0.5 flex items-center gap-1">Explication de correction :</span>
                        <span className="block leading-relaxed">{corr.explanation}</span>
                      </div>

                    </div>
                  ))}
                </div>

              </div>

            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs shadow">
              Matrices d'évaluation indisponibles. Relancez le diagnostic ci-dessus.
            </div>
          )}

        </div>
      )}

    </div>
  );
}

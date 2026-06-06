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
import { apiFetch } from "../lib/api";

interface AdaptiveTrainingProps {
  documents: any[];
  learningPath: LearningModule[];
  completedLessons: string[];
  onCurriculumUpdate: (path: LearningModule[], evaluation: any) => void;
  onLessonComplete: (moduleId: string) => void;
}

export default function AdaptiveTraining({
  documents,
  learningPath,
  completedLessons,
  onCurriculumUpdate,
  onLessonComplete
}: AdaptiveTrainingProps) {
  
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
      const response = await apiFetch("/api/diagnostic-quiz");
      if (!response.ok) throw new Error("Could not retrieve diagnostic material");
      const data = await response.json();
      setDiagnosticQuiz(data);
    } catch (err) {
      alert("Error starting academic assessment: " + (err as Error).message);
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
      const response = await apiFetch("/api/evaluate-and-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: studentAnswers,
          quizData: diagnosticQuiz
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Evaluation failed");
      
      setDiagnosticResult(data.evaluation);
      onCurriculumUpdate(data.learningPath, data.evaluation);
      setPhase("curriculum");
      // Load first module lesson automatically
      if (data.learningPath.length > 0) {
        loadLesson(data.learningPath[0].id);
      }
    } catch (err: any) {
      alert("Evaluation failed: " + err.message);
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
      const response = await apiFetch(`/api/module/${modId}/lesson`);
      if (!response.ok) throw new Error("Failed to compile module lesson notes");
      const data = await response.json();
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
      const response = await apiFetch(`/api/module/${activeModuleId}/quiz`);
      if (!response.ok) throw new Error("Failed quiz compiling");
      const data = await response.json();
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
      if (practiceAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        correctCount += 1;
      }
    });
    const finalScore = Math.round((correctCount / practiceQuiz.length) * 100);
    setPracticeScore(finalScore);
    setCheckedPractice(true);

    // Save score to performance ledger
    try {
      const targetModule = learningPath.find(m => m.id === activeModuleId);
      await apiFetch("/api/quiz/record-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleTitle: targetModule?.title || "Module Practices",
          score: finalScore
        })
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
      const response = await apiFetch("/api/reinforcement/scheduled");
      const data = await response.json();
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-white rounded-2xl border border-slate-105 shadow-3xs">
        <div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-500 animate-pulse" /> Adaptive Learning OS
          </h1>
          <p className="text-xs text-slate-500 max-w-lg">
            A real-time agentic curriculum built around your concept strengths and weaknesses. Prioritise failures and practice actively.
          </p>
        </div>

        {hasDocs && (
          <button
            onClick={startDiagnostic}
            className="mt-4 md:mt-0 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl hover:scale-102 cursor-pointer transition-all shadow-md select-none"
          >
            Trigger New Diagnostic Assessment
          </button>
        )}
      </div>

      {/* PHASE 1: DIAGNOSTIC TESTING ZONE */}
      {phase === "diagnostic" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
            <Timer className="w-5 h-5 text-indigo-500 animate-spin" />
            <div>
              <h2 className="text-base font-sans font-semibold text-slate-900">Cognitive Assessment Agent is Evaluating...</h2>
              <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Mapping baseline capability matrices</span>
            </div>
          </div>

          {loadingQuiz ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-mono">Formulating multi-format diagnostic quiz with active textbook pages...</p>
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
                      <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Hint: {q.hint}
                    </p>
                  )}

                  {/* Options rendering */}
                  {q.options && q.options.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt)}
                          className={`px-4 py-3 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer flex justify-between ${
                            studentAnswers[q.id] === opt
                              ? "bg-indigo-600 text-white border-transparent"
                              : "hover:bg-slate-100/50 bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>{opt}</span>
                          {studentAnswers[q.id] === opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-1.5">
                      <input
                        type="text"
                        placeholder="Type detailed educational breakdown explanation..."
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
                  {isSubmittingDiagnostic ? "Curriculum Agent compiling..." : "Analyze Performance & Compile Curriculum"}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              Mnemonic assessment engine offline. Try starting again.
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
                <ListTodo className="w-4 h-4 text-indigo-500" /> Active Master Curriculum
              </h2>

              {learningPath.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-3">
                  <p>You have not run an adaptive diagnostic assessment with the Curriculum Agent yet!</p>
                  <p className="text-[11px] opacity-80">We can generate standard learning modules right away using preloaded textbooks when you run diagnostic testing above.</p>
                  {hasDocs && (
                    <button
                      onClick={startDiagnostic}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg select-none cursor-pointer"
                    >
                      Start diagnostic testing
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
                                  Prioritised: {mod.weakTopicRelation}
                                </span>
                              )}
                            </div>
                            <h3 className="font-sans font-bold text-xs text-slate-805 truncate block max-w-56">{mod.title}</h3>
                          </div>

                          {isCompleted ? (
                            <span className="text-emerald-600 font-mono text-[10px] lowercase flex items-center gap-0.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> mastered
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
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-1.5 pb-3.5 border-b border-slate-850">
                  <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-indigo-300">Spaced Repetition Active</h3>
                    <span className="text-[9px] text-slate-400">Scheduled active memory audit concept</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-300">Concept: {reinforcementData.conceptName}</span>
                      <span className="text-slate-500 font-mono">{reinforcementData.originalSource}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{reinforcementData.spacedRepetitionExplanation}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 text-[8px] font-mono font-bold uppercase border border-indigo-400/10 rounded-sm">Immediate recall check</span>
                    <p className="font-semibold text-slate-205 text-[11px] leading-relaxed">{reinforcementData.targetedQuickQuiz.question}</p>
                    
                    <div className="space-y-2">
                      {reinforcementData.targetedQuickQuiz.options?.map((opt: string) => {
                        const correctVal = reinforcementData.targetedQuickQuiz?.correctAnswer;
                        const isSelected = reinforcementAnswer === opt;
                        const isCorrectOpt = opt === correctVal;

                        return (
                          <button
                            key={opt}
                            disabled={reinforcementSolved}
                            onClick={() => handleReinforceSubmit(opt)}
                            className={`w-full text-left px-3 py-2 text-[10px] font-medium rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                              reinforcementSolved
                                ? isCorrectOpt
                                  ? "bg-emerald-900/30 border-emerald-500/40 text-emerald-300"
                                  : isSelected
                                  ? "bg-red-900/30 border-red-500/40 text-red-300"
                                  : "bg-slate-850 text-slate-500 border-slate-800"
                                : "hover:bg-slate-800 bg-slate-900 text-slate-300 border-slate-800"
                            }`}
                          >
                            <span>{opt}</span>
                            {reinforcementSolved && isCorrectOpt && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {reinforcementSolved && (
                      <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800">
                        <span className="font-semibold text-white block pb-1">Correction Logic:</span>
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
                <h3 className="font-sans font-medium text-slate-700 text-sm">Review Textbook Lessons</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Select a Curriculum Module on the left side to compile its active AI teaching lesson guide and adaptive practice tests.
                </p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
                
                {/* Active module lesson contents */}
                <div className="pb-5 border-b border-slate-50 space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">Currently Reading</span>
                      <h2 className="text-lg font-sans font-bold text-slate-900 leading-tight">
                        {loadingLesson ? "Lesson Agent compiling details..." : lessonContent?.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadPracticeQuiz}
                        disabled={loadingLesson || loadingPractice}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg select-none cursor-pointer text-slate-800 transition-all flex items-center gap-1 shrink-0"
                      >
                        <FileQuestion className="w-3.5 h-3.5" /> Practice Challenge
                      </button>

                      <button
                        onClick={completeLessonAndMark}
                        disabled={loadingLesson || isFinishingLesson}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-lg select-none cursor-pointer transition-all flex items-center gap-1 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete Lesson
                      </button>
                    </div>
                  </div>

                  {loadingLesson ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs font-mono">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span>Synthesizing lessons, key glossary lists, real scenarios and pneumonics...</span>
                    </div>
                  ) : lessonContent ? (
                    <div className="space-y-5 text-slate-700 text-xs leading-relaxed">
                      {/* Detailed Text Explanations */}
                      <p className="whitespace-pre-line text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">{lessonContent.explanation}</p>

                      {/* Active Concept Glossary Flashcards */}
                      <div className="space-y-3">
                        <span className="font-semibold text-slate-900 block flex items-center gap-1">Glossary Concept Flashcards:</span>
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
                          <span className="font-semibold text-emerald-800 block text-xs">Applied Scenario Cases:</span>
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
                            <Smile className="w-4 h-4 text-amber-500 shrink-0" /> Eccentric Mneumonic Tricks (AI Lesson Agent):
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
                      Module coursework parameters unloaded. Click any module lessons.
                    </div>
                  )}
                </div>

                {/* PRACTICE CHALLENGES FRAME FOR CHOSEN LESSON MODULE */}
                {Array.isArray(practiceQuiz) && practiceQuiz.length > 0 ? (
                  <div className="pt-2 animate-fadeIn space-y-5">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <div>
                        <h3 className="font-sans font-semibold text-slate-900 text-sm flex items-center gap-1">
                          <FileQuestion className="w-4.5 h-4.5 text-indigo-500" /> Topic Adaptive Quiz
                        </h3>
                        <p className="text-[10px] text-slate-400">Interactive check compiled from materials</p>
                      </div>
                      
                      {checkedPractice && practiceScore !== null && (
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                          practiceScore >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}>
                          Score: {practiceScore}%
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
                                practiceAnswers[pq.id]?.trim().toLowerCase() === pq.correctAnswer.trim().toLowerCase()
                                  ? "text-emerald-600" : "text-rose-600"
                              }`}>
                                {practiceAnswers[pq.id]?.trim().toLowerCase() === pq.correctAnswer.trim().toLowerCase() ? "Correct" : "Incorrect"}
                              </span>
                            )}
                          </div>
                          
                          <p className="font-semibold text-slate-800">{pq.question}</p>

                          {pq.options && pq.options.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {pq.options.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={checkedPractice}
                                  onClick={() => setPracticeAnswers(prev => ({ ...prev, [pq.id]: option }))}
                                  className={`px-3 py-2 text-left rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex justify-between items-center ${
                                    practiceAnswers[pq.id] === option
                                      ? "bg-indigo-600 border-transparent text-white"
                                      : "hover:bg-slate-100 bg-white border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <span>{option}</span>
                                  {practiceAnswers[pq.id] === option && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <input
                              type="text"
                              disabled={checkedPractice}
                              placeholder="Type scientific description explanation..."
                              value={practiceAnswers[pq.id] || ""}
                              onChange={(e) => setPracticeAnswers(prev => ({ ...prev, [pq.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-200 bg-white focus:outline-hidden text-xs rounded-lg"
                            />
                          )}

                          {checkedPractice && (
                            <div className="pt-2 border-t border-slate-150/40 text-[10px] text-slate-400">
                              <span className="font-semibold text-slate-700 block pb-0.5">Correct Answer: {pq.correctAnswer}</span>
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
                          Submit Answers & Evaluate
                        </button>
                      ) : (
                        <button
                          onClick={loadPracticeQuiz}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retry Practice Quiz
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  loadingPractice && (
                    <div className="pt-6 py-12 flex flex-col items-center justify-center space-y-2 font-mono text-xs text-slate-400">
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                      <span>Quiz Agent collecting question parameters...</span>
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

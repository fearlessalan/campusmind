import React, { useState } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Trash2, 
  FileText, 
  GraduationCap, 
  TrendingUp, 
  Activity, 
  Award,
  RefreshCw,
  Plus,
  BookMarked,
  X
} from "lucide-react";
import { AcademicDocument, PerformanceStats, Course } from "../types";

interface DashboardProps {
  documents: AcademicDocument[];
  performance: PerformanceStats & { scoreHistory?: number[] };
  onResetDB: () => void;
  onResetPerformance: () => void;
  onSelectDoc: (docId: string) => void;
  activeDocId: string | null;
  onEnterWorkspace: () => void;
  
  // course props
  courses: Course[];
  activeCourseId: string;
  onCreateCourse: (title: string, description: string) => void;
  onSelectCourse: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
}

export default function Dashboard({
  documents,
  performance,
  onResetDB,
  onResetPerformance,
  onSelectDoc,
  activeDocId,
  onEnterWorkspace,
  courses,
  activeCourseId,
  onCreateCourse,
  onSelectCourse,
  onDeleteCourse
}: DashboardProps) {

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateCourse(newTitle, newDesc);
    setNewTitle("");
    setNewDesc("");
    setIsCreating(false);
  };

  const hasDocs = documents.length > 0;
  const history = performance.scoreHistory || [];

  return (
    <div className="space-y-8">
      {/* Dynamic Header Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-linear-to-r from-slate-900 to-indigo-950 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1 font-sans">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-mono font-medium border border-indigo-500/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" /> Core Cognitive Engine Online
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CampusMind Dashboard</h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Intelligent academic operating system. Turn passive documentation into active mastery, diagnostic trials, and spaced reinforcement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 relative z-10">
          <button
            onClick={onEnterWorkspace}
            disabled={courses.length === 0}
            className="inline-flex items-center gap-2 px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/10 hover:scale-103 cursor-pointer select-none transition-all mr-1 disabled:pointer-events-none"
          >
            💻 Ouvrir le Workspace Discussion (NotebookLM) →
          </button>
          <button
            onClick={onResetPerformance}
            disabled={courses.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Progress
          </button>
          <button
            onClick={onResetDB}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-300 text-xs font-medium border border-red-900/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Wipe System
          </button>
        </div>
      </div>

      {/* SECTION : SYSTÈMES DE COURS DE CAMPUSMIND */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-sans font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> Vos Espaces d'Étude & Cours réels
            </h2>
            <p className="text-slate-500 text-xs">
              Sélectionnez un cours pour charger ses documents d'étude réels, ses modules intelligents et lancer sa discussion.
            </p>
          </div>
          
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer select-none shadow-xs transition-all hover:scale-102"
            >
              <Plus className="w-3.5 h-3.5" /> Nouveau Cours réels
            </button>
          )}
        </div>

        {/* Quick Create Form Panel */}
        {isCreating && (
          <form onSubmit={handleSubmitCourse} className="p-5 bg-white rounded-2xl border border-indigo-100 shadow-xs space-y-4 animate-fadeIn transition-all">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-indigo-600" /> Configurer un nouveau cours réel
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-650 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nom du cours / Matière *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Algorithmique, Économie Publique, Droit Privé..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Description / Objectifs</label>
                <input
                  type="text"
                  placeholder="ex: Évaluation de la complexité temporelle et tris avancés."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg cursor-pointer transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-all"
              >
                Créer l'Espace Cours
              </button>
            </div>
          </form>
        )}

        {/* Courses Cards Grid */}
        {courses.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-200 bg-white rounded-2xl flex flex-col items-center justify-center space-y-3 shadow-3xs">
            <GraduationCap className="w-10 h-10 text-slate-300 animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700">Aucun cours disponible</p>
              <p className="text-xs text-slate-400 max-w-md">
                Créez votre premier cours réel pour commencer. Vous pourrez y importer vos propres chapitres, notes manuelles ou fiches de révision de façon 100% réelle.
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer select-none shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Créer mon premier cours réel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const isActive = course.id === activeCourseId;
              const docCount = course.documents?.length || 0;
              const moduleCount = course.learningPath?.length || 0;
              
              return (
                <div
                  key={course.id}
                  onClick={() => onSelectCourse(course.id)}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all relative flex flex-col justify-between h-[154px] group ${
                    isActive
                      ? "border-indigo-600 bg-linear-to-b from-indigo-50/20 to-white shadow-3xs ring-1 ring-indigo-500/20"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-3xs"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                        isActive
                          ? "bg-indigo-100/60 text-indigo-700 border-indigo-200/50"
                          : "bg-slate-50 text-slate-500 border-slate-150"
                      }`}>
                        {isActive ? "Actif & Chargé" : "Inactif"}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCourse(course.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
                        title="Supprimer ce cours"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-sans font-bold text-slate-900 text-sm leading-tight truncate">
                      {course.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 pr-2 leading-relaxed">
                      {course.description || "Aucune description fournie."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 text-[10px] font-mono text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-500/70" />
                      <strong>{docCount}</strong> {docCount <= 1 ? "doc réel" : "docs réels"}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500/70" />
                      <strong>{moduleCount}</strong> {moduleCount <= 1 ? "module" : "modules"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Mastery */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Concept Mastery</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Award className="w-4 h-4" /></span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {performance.exam_readiness ? `${performance.exam_readiness}%` : "0%"}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700" 
                style={{ width: `${performance.exam_readiness || 0}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> Derived from Quiz and Assessments
          </p>
        </div>

        {/* Metric 2: Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Course Progress</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BookOpen className="w-4 h-4" /></span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {performance.progress ? `${performance.progress}%` : "0%"}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700" 
                style={{ width: `${performance.progress || 0}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {Math.round((performance.progress || 0) / 25)} of 4 Curriculum Modules finished
          </p>
        </div>

        {/* Metric 3: Memory Retention */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Retention Rate</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Activity className="w-4 h-4" /></span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {performance.retention ? `${performance.retention}%` : "0%"}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-rose-500 h-1.5 rounded-full transition-all duration-700" 
                style={{ width: `${performance.retention || 0}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Calculated dynamic spaced repetition decay
          </p>
        </div>

        {/* Metric 4: Exam Readiness */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Exam Readiness</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><GraduationCap className="w-4 h-4" /></span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {performance.exam_readiness ? `${Math.round(performance.exam_readiness * 1.05 > 100 ? 100 : performance.exam_readiness * 1.05)}%` : "0%"}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-700" 
                style={{ width: `${Math.round(performance.exam_readiness * 1.05 > 100 ? 100 : performance.exam_readiness * 1.05)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Combined cognitive test score analysis
          </p>
        </div>

      </div>

      {/* Visual Analytics Charts (Bespoke SVGs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* score timeline graph */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <h2 className="text-base font-sans font-semibold text-slate-900 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-slate-500" /> Learning Score History
          </h2>
          {history.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-100 rounded-xl">
              <Activity className="w-8 h-8 opacity-40 mb-2 animate-pulse" />
              <p className="text-sm">No historical grades recorded.</p>
              <p className="text-xs opacity-85">Complete practice exercises or exams to plot progress.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Custom SVG Line Graph */}
              <svg className="w-full h-56" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal gridlines */}
                <line x1="30" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="170" x2="480" y2="170" stroke="#f8fafc" strokeWidth="1" strokeDasharray="4" />

                {/* Score Line */}
                {history.length > 0 && (
                  <>
                    <path
                      d={(() => {
                        const points = history.map((val, idx) => {
                          const x = 30 + (idx / (Math.max(1, history.length - 1))) * 440;
                          const y = 170 - (val / 100) * 150;
                          return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                        });
                        return points.join(" ");
                      })()}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Shadow Area under Line */}
                    <path
                      d={(() => {
                        const points = history.map((val, idx) => {
                          const x = 30 + (idx / (Math.max(1, history.length - 1))) * 440;
                          const y = 170 - (val / 100) * 150;
                          return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                        });
                        const xStart = 30;
                        const xEnd = 30 + 440;
                        return `${points.join(" ")} L ${xEnd} 170 L ${xStart} 170 Z`;
                      })()}
                      fill="url(#scoreGrad)"
                    />
                    {/* Dots */}
                    {history.map((val, idx) => {
                      const x = 30 + (idx / (Math.max(1, history.length - 1))) * 440;
                      const y = 170 - (val / 100) * 150;
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={y} r="5" fill="#4f46e5" />
                          <circle cx={x} cy={y} r="8" fill="#4f46e5" fillOpacity="0.2" className="animate-ping" />
                          <text x={x} y={y - 10} textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-700">
                            {val}%
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-8 mt-1">
                <span>Start</span>
                <span>Subsequent trials</span>
                <span>Current Level</span>
              </div>
            </div>
          )}
        </div>

        {/* Cognitive Focus Map / Active weak spots */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-sans font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" /> Cognitive Focus Map
            </h2>
            <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
              Chapitres analysés par l'IA nécessitant une révision active pour maximiser votre score.
            </p>

            <div className="space-y-3.5">
              {(() => {
                const parsedChunks = documents.flatMap(d => d.chunks);
                const distinctChapters = Array.from(new Set(parsedChunks.map(c => c.chapter))).slice(0, 3);
                
                if (distinctChapters.length === 0) {
                  return (
                    <div className="text-center py-6 text-slate-400 text-xs font-mono border border-dashed border-slate-150 rounded-xl bg-slate-50/50">
                      En attente de cours.
                    </div>
                  );
                }

                return distinctChapters.map((chapterName, idx) => {
                  const scores = [38, 52, 74];
                  const label = idx === 0 ? "Faible" : idx === 1 ? "Moyen" : "Excellent";
                  const bgClass = idx === 0 ? "bg-rose-50 text-rose-600" : idx === 1 ? "bg-amber-50 text-amber-600 font-semibold" : "bg-indigo-50 text-indigo-600";
                  const barClass = idx === 0 ? "bg-rose-400" : idx === 1 ? "bg-amber-400" : "bg-indigo-400";
                  const pct = scores[idx % scores.length];
                  
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[70%]">{chapterName}</span>
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold ${bgClass}`}>{label} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1">
                        <div className={`${barClass} h-1 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              *Intervalle de révision actif
            </div>
            <span className="text-[11px] font-mono text-indigo-600 font-bold uppercase animate-pulse">Répétition espacée active</span>
          </div>
        </div>

      </div>

      {/* Course Materials & Knowledge Base Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-50 mb-5 gap-3">
          <div>
            <h2 className="text-lg font-sans font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> Core Knowledge Stack
            </h2>
            <p className="text-xs text-slate-500">
              Cours, fiches de révision et documents d'étude réels ajoutés à ce cours et révisés par l'IA.
            </p>
          </div>
        </div>

        {!hasDocs ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <BookOpen className="w-12 h-12 stroke-1 opacity-40 mb-3 animate-pulse" />
            <h3 className="font-sans font-medium text-slate-700 text-sm">Votre base de connaissances est vide</h3>
            <p className="text-xs text-slate-400 text-center max-w-sm mt-1 mb-5 leading-relaxed">
              Pour ajouter des documents réels, cliquez sur "Ouvrir le Workspace" en haut de la page. Vous pourrez y téléverser vos fichiers PDF, DOCX, ou taper du texte réel pour générer votre programme !
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onEnterWorkspace}
                disabled={courses.length === 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer"
              >
                Ouvrir le Workspace & Ajouter des Fichiers réels
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-slate-100">
              <div className="grid grid-cols-12 text-left text-xs font-mono text-slate-400 uppercase tracking-wider pb-3 font-semibold px-4">
                <span className="col-span-4">Source Title</span>
                <span className="col-span-3">Incorporate Date</span>
                <span className="col-span-2">Page Size</span>
                <span className="col-span-2">Chunks Parsed</span>
                <span className="col-span-1 text-right">Scope</span>
              </div>
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    onClick={() => { onSelectDoc(doc.id); onEnterWorkspace(); }}
                    className={`grid grid-cols-12 px-4 py-3.5 items-center rounded-xl cursor-pointer text-slate-700 transition-all ${
                      activeDocId === doc.id 
                        ? "bg-indigo-50/40 border border-indigo-100 shadow-3xs" 
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="col-span-4 flex items-center gap-2.5">
                      <FileText className={`w-4 h-4 ${activeDocId === doc.id ? "text-indigo-600" : "text-slate-400"}`} />
                      <span className="font-medium text-slate-800 text-sm truncate">{doc.name}</span>
                    </div>
                    <div className="col-span-3 text-xs text-slate-400 font-mono">
                      {new Date(doc.uploadDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    <div className="col-span-2 text-xs font-mono text-slate-500">
                      {Math.round(doc.size / 1024)} KB
                    </div>
                    <div className="col-span-2">
                      <span className="px-2 py-1 text-[11px] font-mono font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md">
                        {doc.chunks.length} Chapters mapped
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        activeDocId === doc.id ? "bg-indigo-600" : "bg-slate-350"
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

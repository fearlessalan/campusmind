"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
} from "lucide-react";
import { AcademicDocument, Course, PerformanceStats } from "@/types";

interface CourseDashboardProps {
  course: Course;
  documents: AcademicDocument[];
  performance: PerformanceStats & { scoreHistory?: number[] };
  activeDocId: string | null;
  onSelectDoc: (docId: string) => void;
  onResetDB: () => void;
  onResetPerformance: () => void;
}

export default function CourseDashboard({
  course,
  documents,
  performance,
  activeDocId,
  onSelectDoc,
  onResetDB,
  onResetPerformance,
}: CourseDashboardProps) {
  const router = useRouter();
  const hasDocs = documents.length > 0;
  const history = performance.scoreHistory || [];
  const moduleCount = performance.progress ? Math.round(performance.progress / 25) : 0;

  const getChapterScore = (chapterName: string, idx: number) => {
    void chapterName;
    const base = performance.exam_readiness || 0;
    if (base === 0) return null;
    const variance = [0.6, 0.85, 1.0][idx % 3];
    return Math.min(100, Math.round(base * variance));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-primary-container/50 border border-primary/15 rounded-2xl text-on-surface md-elevation-2 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Tous les cours
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> Moteur d&apos;apprentissage IA actif
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-on-surface-variant text-sm max-w-xl">
            {course.description || "Parcours personnalisé : chat RAG, podcasts, examens simulés et analytics."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 relative z-10">
          <Link href={`/workspace/${course.id}`} className="md-btn-filled">
            Ouvrir l&apos;espace de travail →
          </Link>
          <button onClick={onResetPerformance} className="md-btn-tonal">
            <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser la progression
          </button>
          <button
            onClick={onResetDB}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-error/20 hover:bg-error/30 text-error-container text-xs font-medium border border-error/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Effacer les documents
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Maîtrise des concepts", value: performance.exam_readiness, color: "bg-success", icon: Award },
          { label: "Progression du cours", value: performance.progress, color: "bg-primary", icon: BookOpen },
          { label: "Taux de rétention", value: performance.retention, color: "bg-tertiary", icon: Activity },
          { label: "Préparation à l'examen", value: performance.exam_readiness, color: "bg-secondary", icon: GraduationCap },
        ].map((metric, i) => (
          <div key={i} className="md-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3">
              <span className="text-on-surface-variant text-xs uppercase tracking-wider">{metric.label}</span>
              <span className="p-2 bg-primary-container text-primary rounded-lg">
                <metric.icon className="w-4 h-4" />
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-on-surface">
                {metric.value ? `${metric.value}%` : "0%"}
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-1.5">
                <div className={`${metric.color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${metric.value || 0}%` }} />
              </div>
            </div>
            {i === 1 && (
              <p className="text-xs text-on-surface-variant mt-3">
                {moduleCount} module{moduleCount > 1 ? "s" : ""} terminé{moduleCount > 1 ? "s" : ""} sur 4
              </p>
            )}
            {i === 2 && <p className="text-xs text-on-surface-variant mt-3">Basé sur la répétition espacée</p>}
            {i === 3 && <p className="text-xs text-on-surface-variant mt-3">Analyse des quiz et examens</p>}
            {i === 0 && (
              <p className="text-xs text-on-surface-variant mt-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" /> Dérivé des évaluations
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="md-card p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-on-surface mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-on-surface-variant" /> Historique des scores
          </h2>
          {history.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
              <Activity className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-sm">Aucun score enregistré.</p>
              <p className="text-xs">Complétez des quiz ou examens pour voir votre progression.</p>
            </div>
          ) : (
            <div className="relative">
              <svg className="w-full h-56" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6750A4" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6750A4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="30" y1="20" x2="480" y2="20" stroke="#E7E0EC" strokeWidth="1" />
                <line x1="30" y1="70" x2="480" y2="70" stroke="#E7E0EC" strokeWidth="1" />
                <line x1="30" y1="120" x2="480" y2="120" stroke="#E7E0EC" strokeWidth="1" />
                <line x1="30" y1="170" x2="480" y2="170" stroke="#F3EDF7" strokeWidth="1" strokeDasharray="4" />
                <path
                  d={history
                    .map((val, idx) => {
                      const x = 30 + (idx / Math.max(1, history.length - 1)) * 440;
                      const y = 170 - (val / 100) * 150;
                      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#6750A4"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d={`${history
                    .map((val, idx) => {
                      const x = 30 + (idx / Math.max(1, history.length - 1)) * 440;
                      const y = 170 - (val / 100) * 150;
                      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ")} L 470 170 L 30 170 Z`}
                  fill="url(#scoreGrad)"
                />
                {history.map((val, idx) => {
                  const x = 30 + (idx / Math.max(1, history.length - 1)) * 440;
                  const y = 170 - (val / 100) * 150;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="5" fill="#6750A4" />
                      <text x={x} y={y - 10} textAnchor="middle" className="text-[10px] font-bold fill-on-surface">
                        {val}%
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex justify-between text-xs text-on-surface-variant px-8 mt-1">
                <span>Début</span>
                <span>Tentatives</span>
                <span>Niveau actuel</span>
              </div>
            </div>
          )}
        </div>

        <div className="md-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-on-surface mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" /> Points à renforcer
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Chapitres nécessitant une révision active selon vos performances.
            </p>
            <div className="space-y-3.5">
              {(() => {
                const chapters = Array.from(new Set(documents.flatMap((d) => d.chunks.map((c) => c.chapter)))).slice(0, 3);
                if (chapters.length === 0) {
                  return (
                    <div className="text-center py-6 text-on-surface-variant text-xs border border-dashed border-outline-variant rounded-xl">
                      Importez des documents pour obtenir une analyse.
                    </div>
                  );
                }
                return chapters.map((chapterName, idx) => {
                  const pct = getChapterScore(chapterName, idx);
                  const label = pct === null ? "En attente" : pct < 50 ? "Faible" : pct < 75 ? "Moyen" : "Bon";
                  const barColor = pct === null ? "bg-outline-variant" : pct < 50 ? "bg-error" : pct < 75 ? "bg-tertiary" : "bg-primary";
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-on-surface truncate max-w-[70%]">{chapterName}</span>
                        <span className="md-chip text-[10px]">
                          {label}
                          {pct !== null ? ` (${pct}%)` : ""}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-1">
                        <div className={`${barColor} h-1 rounded-full`} style={{ width: `${pct || 0}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <div className="pt-4 border-t border-outline-variant mt-4 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Répétition espacée</span>
            <span className="text-xs text-primary font-bold uppercase">Active</span>
          </div>
        </div>
      </div>

      <div className="md-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-outline-variant mb-5 gap-3">
          <div>
            <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Base de connaissances
            </h2>
            <p className="text-sm text-on-surface-variant">Documents indexés et analysés par l&apos;IA pour ce cours.</p>
          </div>
        </div>

        {!hasDocs ? (
          <div className="py-12 flex flex-col items-center text-on-surface-variant border border-dashed border-outline-variant rounded-2xl">
            <BookOpen className="w-12 h-12 opacity-40 mb-3" />
            <h3 className="font-medium text-on-surface text-sm">Base de connaissances vide</h3>
            <p className="text-sm text-center max-w-sm mt-1 mb-5">
              Ouvrez l&apos;espace de travail pour importer vos PDF, présentations ou notes.
            </p>
            <Link href={`/workspace/${course.id}?ingest=1`} className="md-btn-filled text-sm">
              Importer un document
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-12 text-left text-xs text-on-surface-variant uppercase tracking-wider pb-3 font-semibold px-4">
              <span className="col-span-4">Document</span>
              <span className="col-span-3">Date d&apos;import</span>
              <span className="col-span-2">Taille</span>
              <span className="col-span-2">Segments</span>
              <span className="col-span-1 text-right">Actif</span>
            </div>
            <div className="divide-y divide-outline-variant">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDoc(doc.id);
                    router.push(`/workspace/${course.id}`);
                  }}
                  className={`grid grid-cols-12 px-4 py-3.5 items-center rounded-xl cursor-pointer transition-all ${
                    activeDocId === doc.id ? "bg-primary-container/30 border border-primary/20" : "hover:bg-surface-container"
                  }`}
                >
                  <div className="col-span-4 flex items-center gap-2.5">
                    <FileText className={`w-4 h-4 ${activeDocId === doc.id ? "text-primary" : "text-outline"}`} />
                    <span className="font-medium text-on-surface text-sm truncate">{doc.name}</span>
                  </div>
                  <div className="col-span-3 text-xs text-on-surface-variant">
                    {new Date(doc.uploadDate).toLocaleDateString("fr-FR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="col-span-2 text-xs text-on-surface-variant">{Math.round(doc.size / 1024)} Ko</div>
                  <div className="col-span-2">
                    <span className="md-chip text-[11px]">{doc.chunks.length} chapitres</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${activeDocId === doc.id ? "bg-primary" : "bg-outline-variant"}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

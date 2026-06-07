import React from "react";
import {
  Sliders,
  Play,
  CheckCircle2,
  Loader2,
  BookOpen,
  ListTodo,
  Activity,
  Volume2,
  UserCheck,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { WorkflowItem } from "../types";
import { WorkflowOutputs } from "../hooks/useWorkflowRunner";

interface WorkflowBuilderProps {
  steps: WorkflowItem[];
  isRunning: boolean;
  isComplete: boolean;
  outputs: WorkflowOutputs;
  onStart: () => void;
  onPlayPodcast?: () => void;
  onPlayAudiobook?: () => void;
  hasDocuments: boolean;
}

const STEP_AGENTS: Record<string, string> = {
  "init-audiobook": "Structure Agent · Narration Agent · Voice Agent",
  "init-podcast": "Content Extraction · Podcast Script · Engagement · TTS",
  "assessment": "Assessment Agent",
  "curriculum": "Curriculum Agent",
  "training-quiz": "Quiz Agent · Performance Agent · Reinforcement Agent",
  "exam-sim": "Exam Generator · Proctor · Grading Agent",
  "analytics-report": "Insights Agent · Recommendation Agent",
};

const STEP_ICONS: Record<string, typeof Volume2> = {
  "init-audiobook": BookOpen,
  "init-podcast": Volume2,
  "assessment": UserCheck,
  "curriculum": ListTodo,
  "training-quiz": GraduationCap,
  "exam-sim": Activity,
  "analytics-report": TrendingUp,
};

export default function WorkflowBuilder({
  steps,
  isRunning,
  isComplete,
  outputs,
  onStart,
  onPlayPodcast,
  onPlayAudiobook,
  hasDocuments,
}: WorkflowBuilderProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-white rounded-2xl border border-outline-variant md-elevation-1 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Sliders className="w-6 h-6 text-primary" /> Workflow Builder
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl mt-1">
            Le pipeline tourne en arrière-plan. Fermez ce modal : la progression reste visible dans le panneau Studio.
          </p>
        </div>

        <button onClick={onStart} disabled={isRunning || !hasDocuments} className="md-btn-filled shrink-0">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Pipeline en cours...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current shrink-0" /> {isComplete ? "Relancer le pipeline" : "Pipeline d'étude complet"}
            </>
          )}
        </button>
      </div>

      {isComplete && (
        <div className="p-4 bg-success-container/30 border border-success/30 rounded-2xl flex flex-wrap gap-2 items-center">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span className="text-sm font-semibold text-success flex-1">Pipeline terminé — contenus prêts à consommer</span>
          {outputs.podcastScript && onPlayPodcast && (
            <button onClick={onPlayPodcast} className="md-btn-tonal text-xs">Écouter le podcast</button>
          )}
          {outputs.audiobookChapters.length > 0 && onPlayAudiobook && (
            <button onClick={onPlayAudiobook} className="md-btn-tonal text-xs">Lire l'audiobook</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-outline-variant md-elevation-1 space-y-5">
          <h2 className="text-sm font-bold text-on-surface pb-3 border-b border-outline-variant flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-primary" /> Enchaînement des agents
          </h2>

          <div className="space-y-6 relative pl-6">
            <div className="absolute left-9.5 top-2 bottom-6 w-0.5 bg-outline-variant" />

            {steps.map((step, sIdx) => {
              const status = step.status;
              const isRunningStep = status === "running";
              const isSuccess = status === "success";
              const isFailed = status === "failed";
              const StepIcon = STEP_ICONS[step.id] || Sliders;

              return (
                <div key={step.id} className="relative flex items-start gap-4 text-sm animate-fadeIn">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${
                    isSuccess ? "bg-success-container border-success text-success"
                    : isRunningStep ? "bg-primary-container border-primary text-primary md-elevation-2"
                    : isFailed ? "bg-error-container border-error text-error"
                    : "bg-surface border-outline-variant text-outline"
                  }`}>
                    {isSuccess ? <CheckCircle2 className="w-4 h-4" />
                    : isRunningStep ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <StepIcon className="w-3.5 h-3.5" />}
                  </div>

                  <div className="space-y-1 pt-1 flex-1">
                    <span className={`font-semibold text-sm block ${isRunningStep ? "text-primary font-bold" : "text-on-surface"}`}>
                      {sIdx + 1}. {step.name}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block">{STEP_AGENTS[step.id]}</span>
                    {step.message && (
                      <p className={`p-2.5 rounded-lg border text-xs leading-relaxed mt-1.5 ${
                        isSuccess ? "bg-success-container/30 border-success/30 text-success"
                        : "bg-error-container/30 border-error/30 text-error"
                      }`}>
                        {step.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-primary-container/40 border border-primary/15 p-5 rounded-2xl md-elevation-2">
          <span className="inline-block px-2.5 py-0.5 rounded bg-primary text-[10px] font-bold uppercase text-on-primary mb-4">
            Architecture multi-agents
          </span>
          <div className="font-mono text-xs text-on-surface-variant space-y-1 bg-white/60 rounded-xl p-4 border border-outline-variant">
            <p>Document → Audiobook → Audio Summary → Entraînement → Examen → Rapport</p>
          </div>
          <p className="text-on-surface-variant text-sm mt-4 leading-relaxed">
            Fermez ce modal : le pipeline continue. Suivez la progression dans le panneau Studio à droite.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Play,
  Radio,
  Sliders,
  TrendingUp,
} from "lucide-react";
import { WorkflowItem } from "../types";
import { WorkflowOutputs } from "../hooks/useWorkflowRunner";

interface WorkflowProgressPanelProps {
  steps: WorkflowItem[];
  isRunning: boolean;
  isComplete: boolean;
  progress: number;
  outputs: WorkflowOutputs;
  onStart: () => void;
  onOpenDetails: () => void;
  onPlayPodcast: () => void;
  onPlayAudiobook: () => void;
  hasDocuments: boolean;
}

export default function WorkflowProgressPanel({
  steps,
  isRunning,
  isComplete,
  progress,
  outputs,
  onStart,
  onOpenDetails,
  onPlayPodcast,
  onPlayAudiobook,
  hasDocuments,
}: WorkflowProgressPanelProps) {
  const runningStep = steps.find((s) => s.status === "running");
  const failedStep = steps.find((s) => s.status === "failed");

  if (!isRunning && !isComplete && steps.every((s) => s.status === "idle")) {
    return (
      <button
        onClick={onStart}
        disabled={!hasDocuments}
        className="w-full p-3 bg-primary-container/50 hover:bg-primary-container border border-primary/20 rounded-xl text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-on-surface">Pipeline d'étude complet</span>
        </div>
        <p className="text-[10px] text-on-surface-variant">
          Lance le workflow en arrière-plan — vous pouvez fermer le modal et suivre la progression ici.
        </p>
      </button>
    );
  }

  return (
    <div className="p-3 bg-white border border-primary/25 rounded-xl shadow-3xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isRunning ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          ) : isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          ) : (
            <Sliders className="w-4 h-4 text-primary shrink-0" />
          )}
          <span className="text-xs font-bold text-on-surface truncate">
            {isRunning ? "Pipeline en cours…" : isComplete ? "Pipeline terminé" : "Pipeline interrompu"}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-primary shrink-0">{progress}%</span>
      </div>

      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {runningStep && (
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          Étape en cours : <span className="text-primary font-semibold">{runningStep.name}</span>
        </p>
      )}

      {failedStep && (
        <p className="text-[10px] text-error leading-relaxed">{failedStep.message}</p>
      )}

      {isComplete && outputs.reportMessage && (
        <p className="text-[10px] text-success leading-relaxed line-clamp-3">{outputs.reportMessage}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button onClick={onOpenDetails} className="md-btn-text text-[10px] py-1 px-2">
          Voir le détail
        </button>

        {isComplete && outputs.podcastScript && (
          <button onClick={onPlayPodcast} className="md-btn-tonal text-[10px] py-1 px-2 flex items-center gap-1">
            <Radio className="w-3 h-3" /> Écouter le podcast
          </button>
        )}

        {isComplete && outputs.audiobookChapters.length > 0 && (
          <button onClick={onPlayAudiobook} className="md-btn-tonal text-[10px] py-1 px-2 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Lire l'audiobook
          </button>
        )}

        {isComplete && (
          <button onClick={onStart} className="md-btn-text text-[10px] py-1 px-2 flex items-center gap-1">
            <Play className="w-3 h-3" /> Relancer
          </button>
        )}
      </div>

      {isRunning && (
        <p className="text-[9px] text-on-surface-variant flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Le pipeline continue même si vous fermez le modal Studio.
        </p>
      )}
    </div>
  );
}

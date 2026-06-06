import { useCallback, useRef, useState } from "react";
import { apiFetch, parseApiResponse } from "../lib/api";
import { executeWorkflowStep, WORKFLOW_STEPS_TEMPLATE } from "../lib/campusAi";
import { AcademicDocument, AudiobookChapter, PodcastScript, WorkflowItem } from "../types";
import { useModal } from "../context/ModalContext";

export interface WorkflowOutputs {
  podcastScript: PodcastScript | null;
  audiobookChapters: AudiobookChapter[];
  reportMessage: string | null;
}

const EMPTY_OUTPUTS: WorkflowOutputs = {
  podcastScript: null,
  audiobookChapters: [],
  reportMessage: null,
};

export function useWorkflowRunner(
  documents: AcademicDocument[],
  onWorkflowComplete: (newDb: Record<string, unknown>) => void
) {
  const { showAlert } = useModal();
  const [steps, setSteps] = useState<WorkflowItem[]>(WORKFLOW_STEPS_TEMPLATE);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [outputs, setOutputs] = useState<WorkflowOutputs>(EMPTY_OUTPUTS);
  const indexRef = useRef(0);
  const runningRef = useRef(false);

  const reset = useCallback(() => {
    setSteps(WORKFLOW_STEPS_TEMPLATE.map((s) => ({ ...s, status: "idle" as const, message: undefined })));
    setIsRunning(false);
    setIsComplete(false);
    setOutputs(EMPTY_OUTPUTS);
    indexRef.current = 0;
    runningRef.current = false;
  }, []);

  const start = useCallback(async () => {
    if (documents.length === 0) {
      showAlert("Workflow", "La base de connaissances est vide. Importez d'abord des documents.", "warning");
      return;
    }
    if (runningRef.current) return;

    runningRef.current = true;
    setIsRunning(true);
    setIsComplete(false);
    setOutputs(EMPTY_OUTPUTS);
    indexRef.current = 0;
    setSteps(WORKFLOW_STEPS_TEMPLATE.map((s) => ({ ...s, status: "idle" as const, message: undefined })));

    const runStep = async () => {
      const idx = indexRef.current;
      if (idx >= WORKFLOW_STEPS_TEMPLATE.length) {
        runningRef.current = false;
        setIsRunning(false);
        setIsComplete(true);
        return;
      }

      const activeStep = WORKFLOW_STEPS_TEMPLATE[idx];
      setSteps((prev) =>
        prev.map((item) => (item.id === activeStep.id ? { ...item, status: "running" } : item))
      );

      try {
        let message: string;

        if (activeStep.id === "analytics-report") {
          const response = await apiFetch("/api/workflow/finalize", { method: "POST" });
          const data = await parseApiResponse<{ message: string; dbState?: Record<string, unknown> }>(response);
          message = data.message;
          setOutputs((prev) => ({ ...prev, reportMessage: message }));
          if (data.dbState) onWorkflowComplete(data.dbState);
        } else {
          const result = await executeWorkflowStep(activeStep.id, documents);
          message = result.message;
          if (result.outputs) {
            setOutputs((prev) => ({
              podcastScript: result.outputs?.podcastScript ?? prev.podcastScript,
              audiobookChapters: result.outputs?.audiobookChapters ?? prev.audiobookChapters,
              reportMessage: prev.reportMessage,
            }));
          }
        }

        setSteps((prev) =>
          prev.map((item) =>
            item.id === activeStep.id ? { ...item, status: "success", message } : item
          )
        );

        indexRef.current = idx + 1;
        setTimeout(runStep, 900);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Échec";
        setSteps((prev) =>
          prev.map((item) =>
            item.id === activeStep.id ? { ...item, status: "failed", message: msg } : item
          )
        );
        runningRef.current = false;
        setIsRunning(false);
      }
    };

    runStep();
  }, [documents, onWorkflowComplete, showAlert]);

  const completedCount = steps.filter((s) => s.status === "success").length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return { steps, isRunning, isComplete, outputs, progress, start, reset };
}

import React, { useState } from "react";
import { 
  Sliders, 
  Play, 
  CheckCircle2, 
  Loader2, 
  Flame, 
  Sparkles, 
  FileText, 
  ListTodo, 
  Activity, 
  Volume2, 
  UserCheck 
} from "lucide-react";
import { WorkflowItem } from "../types";
import { apiFetch } from "../lib/api";

interface WorkflowBuilderProps {
  documents: any[];
  onWorkflowComplete: (newDbState: any) => void;
}

export default function WorkflowBuilder({ documents, onWorkflowComplete }: WorkflowBuilderProps) {
  
  const [isRunning, setIsRunning] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowItem[]>([
    { id: "init-audiobook", name: "Assemble Audiobook Chapters", status: "idle" },
    { id: "init-podcast", name: "Formulate Professor-Student Podcast Discussion", status: "idle" },
    { id: "assessment", name: "Formulate Diagnostic Assessment Cards", status: "idle" },
    { id: "curriculum", name: "Compile Customized Weekly Learning Path", status: "idle" },
    { id: "training-quiz", name: "Generate Adaptive Practice Training Quizzes", status: "idle" },
    { id: "exam-sim", name: "Construct Exam Simulator qualification trials", status: "idle" },
    { id: "analytics-report", name: "Synchronize System Analytics Reports", status: "idle" }
  ]);

  const runOrchestrator = async () => {
    if (documents.length === 0) {
      alert("Core Knowledge Base is empty! Compile some textbooks/files on the Dashboard first.");
      return;
    }

    setIsRunning(true);
    
    // Clear status
    setWorkflowSteps((prev) => prev.map((item) => ({ ...item, status: "idle", message: undefined })));

    let index = 0;
    
    const executeNextStep = async () => {
      if (index >= workflowSteps.length) {
        setIsRunning(false);
        return;
      }

      const activeStep = workflowSteps[index];

      // Mark running
      setWorkflowSteps((prev) =>
        prev.map((item) => (item.id === activeStep.id ? { ...item, status: "running" } : item))
      );

      try {
        const response = await apiFetch("/api/workflow/execute-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepId: activeStep.id })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Step triggered exception");

        setWorkflowSteps((prev) =>
          prev.map((item) =>
            item.id === activeStep.id
              ? { ...item, status: "success", message: data.message }
              : item
          )
        );

        // Update database reports
        if (activeStep.id === "analytics-report" && data.dbState) {
          onWorkflowComplete(data.dbState);
        }

        // Wait a small bit before starting next step to give beautiful interactive logs
        setTimeout(() => {
          index += 1;
          executeNextStep();
        }, 1200);

      } catch (err: any) {
        setWorkflowSteps((prev) =>
          prev.map((item) =>
            item.id === activeStep.id
              ? { ...item, status: "failed", message: err.message || "Failed" }
              : item
          )
        );
        setIsRunning(false);
      }
    };

    executeNextStep();
  };

  const hasDocs = documents.length > 0;

  return (
    <div className="space-y-8">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-3xs gap-4">
        <div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-500" /> Agentic Workspace Orchestration
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Single-click academic pipelines. Watch multiple specialized learning agents collaborate recursively to parse and prepare dynamic dashboards.
          </p>
        </div>

        <button
          onClick={runOrchestrator}
          disabled={isRunning || !hasDocs}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 select-none shadow-sm transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Compiling Workspace...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white shrink-0" /> Execute Automated Pipeline
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* Left Interactive Graph */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
          <h2 className="text-sm font-sans font-bold text-slate-900 pb-3 border-b border-slate-50 flex items-center gap-1.5">
            <Sliders className="w-4.5 h-4.5 text-indigo-505 text-indigo-500" /> Pipeline Flow Diagram
          </h2>

          <div className="space-y-6 relative pl-6">
            {/* Visual connector line in background */}
            <div className="absolute left-9.5 top-2 bottom-6 w-0.5 bg-slate-200" />

            {workflowSteps.map((step, sIdx) => {
              const status = step.status;
              const isIdle = status === "idle";
              const isRunningStep = status === "running";
              const isSuccess = status === "success";
              const isFailed = status === "failed";

              // Get visual icon indexes
              let StepIcon = FileText;
              if (step.id.includes("audiobook")) StepIcon = Volume2;
              if (step.id.includes("podcast")) StepIcon = Volume2;
              if (step.id.includes("assessment")) StepIcon = UserCheck;
              if (step.id.includes("curriculum")) StepIcon = ListTodo;
              if (step.id.includes("analytics")) StepIcon = Activity;

              return (
                <div key={step.id} className="relative flex items-start gap-4 text-xs animate-fadeIn">
                  
                  {/* Circle Indicator */}
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${
                    isSuccess 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-600" 
                      : isRunningStep 
                      ? "bg-indigo-50 border-indigo-500 text-indigo-600 shadow-md shadow-indigo-600/15" 
                      : isFailed 
                      ? "bg-red-50 border-red-500 text-red-600" 
                      : "bg-white border-slate-350 text-slate-400"
                  }`}>
                    {isSuccess ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isRunningStep ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="space-y-1 pt-1.5 flex-1 select-none">
                    <span className={`font-semibold text-xs ${
                      isRunningStep ? "text-indigo-600 font-bold font-sans" : isSuccess ? "text-slate-505 text-slate-600" : "text-slate-705 text-slate-700"
                    }`}>
                      Stage {sIdx + 1} • {step.name}
                    </span>

                    {step.message && (
                      <p className={`p-2.5 rounded-lg border text-[10.5px] font-mono leading-relaxed mt-1.5 animate-fadeIn ${
                        isSuccess 
                          ? "bg-emerald-50/20 border-emerald-100 text-emerald-700" 
                          : "bg-red-50/20 border-red-100 text-red-700"
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

        {/* Right Info Box */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <span className="inline-block px-2.5 py-0.5 rounded bg-linear-to-r from-indigo-505 from-indigo-500 to-indigo-600 text-[10px] font-mono tracking-wider font-bold uppercase uppercase text-white">
              Agent Orchestrator Matrix
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              Normally, a student must manually upload summaries, formulate quizes, customize weekly lesson schedules, schedule spaced memory targets, and generate exam simulations.
            </p>
            <p className="text-slate-305 text-slate-400 leading-relaxed">
              Our <strong>Single-Click OS builder</strong> recruits cooperating agents to build and verify everything for you in less than 10 seconds.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-8 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Workspace state:</span>
            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-sm ${
              isRunning 
                ? "bg-amber-950 text-amber-300 border border-amber-900/40 animate-pulse" 
                : "bg-emerald-950 text-emerald-300 border border-emerald-900/40"
            }`}>
              {isRunning ? "compiling courseos" : "standing by ready"}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Plus, 
  FileWarning,
  Flame,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { AcademicDocument } from "../types";
import { apiFetch } from "../lib/api";

interface IngestionHubProps {
  documents: AcademicDocument[];
  onIngestSuccess: (doc: AcademicDocument) => void;
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
}

export default function IngestionHub({
  documents,
  onIngestSuccess,
  activeDocId,
  onSelectDoc
}: IngestionHubProps) {
  const [manualText, setManualText] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pipelineSteps = [
    "Establishing cloud communication link...",
    "Executing Multimodal Gemini OCR & Handwriting Extraction...",
    "Initiating semantic document paragraph sanitation...",
    "Indexing coordinate pages & compiling chapters...",
    "Injecting chapters successfully into core knowledge map!"
  ];

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    setIsProcessing(true);
    setUploadError(null);
    setProgressStep(0);

    const stepsTimer = setInterval(() => {
      setProgressStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 850);

    try {
      const response = await apiFetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: manualTitle.trim() ? `${manualTitle.trim()}.txt` : "lecture_scratchpad.txt",
          manualText: manualText
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Manual submission failed");

      onIngestSuccess(data.document);
      setManualText("");
      setManualTitle("");
    } catch (err: any) {
      setUploadError(err.message || "Could not complete text compilation");
    } finally {
      clearInterval(stepsTimer);
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadError(null);
    setProgressStep(0);

    // Simulate pipeline progression
    const stepsTimer = setInterval(() => {
      setProgressStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    try {
      // Encode file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Content = reader.result as string;
        try {
          const response = await apiFetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileContent: base64Content
            })
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "File parsing failed");

          onIngestSuccess(data.document);
        } catch (err: any) {
          setUploadError(err.message || "Text extraction node malfunctioned");
        } finally {
          clearInterval(stepsTimer);
          setIsProcessing(false);
          setProgressStep(0);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError("Could not retrieve file content details");
      clearInterval(stepsTimer);
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Visual Header */}
      <div className="space-y-1.5 p-6 bg-white rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl pointer-events-none" />
        <h1 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">Syllabus Ingestion Hub</h1>
        <p className="text-xs text-slate-500 max-w-xl">
          Upload PDF files, slides, docx documents, clear images of handwritten study notebooks or paste copy-pasted concepts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Upload Panels */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* File Uploader */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h2 className="text-sm font-sans font-semibold text-slate-900 mb-3.5 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-indigo-500" /> Incorporate Academic Files
            </h2>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 cursor-pointer rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50/20 transition-all select-none"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,application/pdf,.docx,.doc,.txt"
              />
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-sans font-semibold text-xs text-slate-700">Drag or browse to incorporate courseware</p>
              <p className="text-[10px] text-slate-400 mt-1">PDF, Word docs, Scans, handwritten Photos or simple text (Max 10MB)</p>
            </div>
          </div>

          {/* Manual Entry Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h2 className="text-sm font-sans font-semibold text-slate-900 mb-3.5 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-indigo-500" /> Paste Academic Concepts Manual
            </h2>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Title of Lecture / Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Bio 101 Lecture notes or Robotics Seminar Overview"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-700 rounded-lg bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Scientific descriptions / Copied facts</label>
                <textarea
                  rows={6}
                  placeholder="Copy and paste messy summaries, textbook sections, lecture notes or facts... "
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-700 rounded-lg bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-indigo-400"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!manualText.trim() || isProcessing}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 select-none shadow-sm cursor-pointer"
                >
                  Compile Notes to Knowledge Base
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Side: Parsing Logs or File Tree */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Compilation Live Log (OCR Pipeline Tracker) */}
          {isProcessing && (
            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 animate-pulse">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">Semantic Ingestion Logging</span>
              </div>
              
              <div className="space-y-3">
                {pipelineSteps.map((step, idx) => {
                  const isCurrent = idx === progressStep;
                  const isFinished = idx < progressStep;
                  return (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      {isFinished ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : isCurrent ? (
                        <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-700 block shrink-0 mt-0.5" />
                      )}
                      <span className={`font-mono text-[11px] ${
                        isFinished ? "text-slate-400 line-through" : isCurrent ? "text-indigo-300 font-bold" : "text-slate-500"
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compilation Errors */}
          {uploadError && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs">
              <FileWarning className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold block">Knowledge Ingest Blocked</span>
                <span>{uploadError}</span>
              </div>
            </div>
          )}

          {/* Sourced Textbook files preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-sans font-semibold text-slate-900 mb-3.5">
              Active Documents ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 font-sans text-center py-6">
                No active documentations ingested. Enter some text on the left!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                      activeDocId === doc.id
                        ? "bg-indigo-50/20 border-indigo-200"
                        : "hover:bg-slate-50/50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 truncate block w-full">{doc.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>{doc.chunks.length} Chapters</span>
                      <span>{Math.round(doc.size / 1024)} KB</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

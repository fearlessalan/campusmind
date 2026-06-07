"use client";

import React, { useState, useRef, useCallback } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  PlusCircle,
  FileWarning,
  Flame
} from "lucide-react";
import { AcademicDocument } from "../types";
import { apiFetch } from "../lib/api";
import { extractChunksFromFile } from "../lib/firebaseAi";

interface IngestionHubProps {
  documents: AcademicDocument[];
  onIngestSuccess: (doc: AcademicDocument) => void;
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx"];
const ACCEPTED_MIME_PREFIXES = ["image/", "application/pdf", "text/"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isAcceptedFile(file: File): boolean {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (ACCEPTED_EXTENSIONS.includes(ext)) return true;
  return ACCEPTED_MIME_PREFIXES.some((p) => file.type.startsWith(p));
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
  const [isDragging, setIsDragging] = useState(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const pipelineSteps = [
    "Connexion à Firebase AI Logic...",
    "OCR multimodal et extraction manuscrite...",
    "Nettoyage et découpage sémantique du document...",
    "Indexation des pages et compilation des chapitres...",
    "Injection des chapitres dans la base de connaissances !"
  ];

  const processFile = useCallback(async (file: File) => {
    if (isProcessing) return;

    if (!isAcceptedFile(file)) {
      setUploadError("Format non supporté. Utilisez PDF, Word, PowerPoint, images ou texte.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Fichier trop volumineux (maximum 10 Mo).");
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    setProgressStep(0);

    const stepsTimer = setInterval(() => {
      setProgressStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Content = reader.result as string;
        const mime = file.type || "application/octet-stream";
        const base64Data = base64Content.includes("base64,")
          ? base64Content.split("base64,")[1]
          : base64Content;

        try {
          const chunks = await extractChunksFromFile(file.name, mime, base64Data);
          if (!chunks.length) throw new Error("Aucun contenu extrait du document");

          const response = await apiFetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType: mime,
              fileSize: file.size,
              preChunks: chunks
            })
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Échec de l'enregistrement du document");

          onIngestSuccess(data.document);
        } catch (err: any) {
          setUploadError(err.message || "Erreur lors de l'extraction du texte");
        } finally {
          clearInterval(stepsTimer);
          setIsProcessing(false);
          setProgressStep(0);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.onerror = () => {
        setUploadError("Impossible de lire le contenu du fichier");
        clearInterval(stepsTimer);
        setIsProcessing(false);
        setProgressStep(0);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError("Impossible de traiter le fichier");
      clearInterval(stepsTimer);
      setIsProcessing(false);
      setProgressStep(0);
    }
  }, [isProcessing, onIngestSuccess]);

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
          fileName: manualTitle.trim() ? `${manualTitle.trim()}.txt` : "notes_manuelles.txt",
          manualText: manualText
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec de l'envoi du texte");

      onIngestSuccess(data.document);
      setManualText("");
      setManualTitle("");
    } catch (err: any) {
      setUploadError(err.message || "Impossible de compiler le texte");
    } finally {
      clearInterval(stepsTimer);
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5 p-6 bg-white rounded-2xl border border-outline-variant md-elevation-1 relative overflow-hidden">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Centre d'ingestion</h1>
        <p className="text-sm text-on-surface-variant max-w-xl">
          Importez vos PDF, présentations PowerPoint, documents Word, notes scannées ou images. Vous pouvez aussi coller du texte directement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-outline-variant md-elevation-1">
            <h2 className="text-sm font-semibold text-on-surface mb-3.5 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-primary" /> Importer des fichiers
            </h2>
            
            <div 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? "border-primary bg-primary-container/50 scale-[1.01] cursor-copy"
                  : isProcessing
                  ? "border-outline-variant bg-surface-container-low opacity-60 cursor-not-allowed"
                  : "border-outline-variant hover:border-primary bg-surface-container-low hover:bg-surface-container cursor-pointer"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,application/pdf,.docx,.doc,.txt,.pptx,.ppt"
                disabled={isProcessing}
              />
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${
                isDragging ? "bg-primary text-on-primary" : "bg-primary-container text-primary"
              }`}>
                <Upload className={`w-6 h-6 ${isDragging ? "animate-bounce" : ""}`} />
              </div>
              <p className="font-semibold text-sm text-on-surface">
                {isDragging ? "Déposez le fichier ici" : "Glissez-déposez ou cliquez pour parcourir"}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">PDF, Word, PowerPoint, scans, photos ou texte (max. 10 Mo)</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-outline-variant md-elevation-1">
            <h2 className="text-sm font-semibold text-on-surface mb-3.5 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-primary" /> Saisie manuelle
            </h2>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant">Titre du cours / sujet</label>
                <input
                  type="text"
                  placeholder="ex. : Cours de biologie, Séminaire de droit..."
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="md-textfield-outlined"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant">Contenu des notes</label>
                <textarea
                  rows={6}
                  placeholder="Collez vos résumés, extraits de manuels, notes de cours..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="md-textfield-outlined resize-none"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!manualText.trim() || isProcessing}
                  className="md-btn-filled"
                >
                  Indexer dans la base de connaissances
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {isProcessing && (
            <div className="bg-primary-container/50 border border-primary/20 text-on-primary-container p-5 rounded-2xl md-elevation-2 space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Traitement en cours</span>
              </div>
              
              <div className="space-y-3">
                {pipelineSteps.map((step, idx) => {
                  const isCurrent = idx === progressStep;
                  const isFinished = idx < progressStep;
                  return (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      {isFinished ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      ) : isCurrent ? (
                        <Flame className="w-4 h-4 text-tertiary shrink-0 mt-0.5 animate-bounce" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-outline shrink-0 mt-0.5" />
                      )}
                      <span className={`text-[11px] ${
                        isFinished ? "text-on-surface-variant line-through" : isCurrent ? "text-primary font-bold" : "text-outline"
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-error-container text-error border border-error/20 rounded-xl flex items-start gap-2.5 text-sm">
              <FileWarning className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold block">Ingestion bloquée</span>
                <span>{uploadError}</span>
              </div>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-outline-variant md-elevation-1">
            <h3 className="text-sm font-semibold text-on-surface mb-3.5">
              Documents actifs ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">
                Aucun document indexé. Importez un fichier ou saisissez du texte.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                      activeDocId === doc.id
                        ? "bg-primary-container/30 border-primary/30"
                        : "hover:bg-surface-container border-outline-variant"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-on-surface truncate">{doc.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mt-2">
                      <span>{doc.chunks.length} chapitres</span>
                      <span>{Math.round(doc.size / 1024)} Ko</span>
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

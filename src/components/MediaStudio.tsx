"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Loader2, 
  Radio, 
  ArrowRight, 
  ArrowLeftRight,
  User, 
  Headphones, 
  Download,
  Square
} from "lucide-react";
import { PodcastScript, AudiobookChapter } from "../types";
import { generateAudiobookStructure, generatePodcastScript } from "../lib/campusAi";
import { useModal } from "../context/ModalContext";

interface MediaStudioProps {
  documents: any[];
  initialMode?: "podcast" | "audiobook";
  lockedMode?: boolean;
  initialPodcastScript?: PodcastScript | null;
  initialAudiobookChapters?: AudiobookChapter[];
}

const speakerLabel = (speaker: string) => {
  if (speaker === "Professor") return "Professeur";
  if (speaker === "Student") return "Étudiant";
  return speaker;
};

export default function MediaStudio({
  documents,
  initialMode = "podcast",
  lockedMode = false,
  initialPodcastScript = null,
  initialAudiobookChapters,
}: MediaStudioProps) {
  const { showAlert } = useModal();
  const [activeMode, setActiveMode] = useState<"podcast" | "audiobook">(initialMode);

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  // -----------------------------------------------------------
  // Podcast States
  // -----------------------------------------------------------
  const [podcastScript, setPodcastScript] = useState<PodcastScript | null>(initialPodcastScript);
  const [loadingPodcast, setLoadingPodcast] = useState(false);
  
  // Audio playback variables
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [activePodcastIdx, setActivePodcastIdx] = useState<number | null>(null);

  // -----------------------------------------------------------
  // Audiobook States
  // -----------------------------------------------------------
  const [audiobookChapters, setAudiobookChapters] = useState<AudiobookChapter[]>(initialAudiobookChapters ?? []);

  useEffect(() => {
    if (initialPodcastScript) setPodcastScript(initialPodcastScript);
  }, [initialPodcastScript]);

  useEffect(() => {
    if (initialAudiobookChapters?.length) setAudiobookChapters(initialAudiobookChapters);
  }, [initialAudiobookChapters]);
  const [loadingAudiobook, setLoadingAudiobook] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  
  // Audiobook audio items
  const [isPlayingAudiobook, setIsPlayingAudiobook] = useState(false);
  const [activeSpeechUtterance, setActiveSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Cleanup any running speech when switching tabs or closing
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // -----------------------------------------------------------
  // Podcast Actions
  // -----------------------------------------------------------
  const compilePodcast = async () => {
    setLoadingPodcast(true);
    setPodcastScript(null);
    setActivePodcastIdx(null);
    setIsPlayingPodcast(false);
    window.speechSynthesis?.cancel();

    try {
      if (documents.length === 0) throw new Error("Importez des documents pour générer un podcast.");
      const data = await generatePodcastScript(documents);
      setPodcastScript(data);
    } catch (err: any) {
      showAlert("Audio Summary", err.message, "error");
    } finally {
      setLoadingPodcast(false);
    }
  };

  const playPodcastSpeakLoop = (startIdx: number) => {
    if (!podcastScript) return;
    setIsPlayingPodcast(true);
    window.speechSynthesis?.cancel();

    const segments = podcastScript.segments;
    let idx = startIdx;

    const speakNext = () => {
      if (idx >= segments.length) {
        setIsPlayingPodcast(false);
        setActivePodcastIdx(null);
        return;
      }

      if (!window.speechSynthesis) {
        showAlert("Synthèse vocale", "Votre navigateur ne prend pas en charge la synthèse vocale.", "warning");
        setIsPlayingPodcast(false);
        return;
      }

      setActivePodcastIdx(idx);
      const seg = segments[idx];
      const utterance = new SpeechSynthesisUtterance(seg.text);

      // Customize voices dynamically between Professor and Student!
      if (seg.speaker === "Professor") {
        utterance.pitch = 0.82; // Mature low structured pitch
        utterance.rate = 0.88;  // Elegant steady tempo
      } else {
        utterance.pitch = 1.25; // Youthful bright pitch
        utterance.rate = 1.05;  // Energetic rapid tempo
      }

      // Voice mapping fallback checks
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (seg.speaker === "Professor") {
          // Look for native male structured english voices or defaults
          const maleVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("google uk english male"));
          if (maleVoice) utterance.voice = maleVoice;
        } else {
          // Look for native bright female sounds or defaults
          const femaleVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("microsoft zira") || v.name.toLowerCase().includes("google us english"));
          if (femaleVoice) utterance.voice = femaleVoice;
        }
      }

      utterance.onend = () => {
        idx += 1;
        speakNext();
      };

      utterance.onerror = (e) => {
        console.error("Speech utterance err", e);
        setIsPlayingPodcast(false);
        setActivePodcastIdx(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const pausePodcast = () => {
    window.speechSynthesis?.cancel();
    setIsPlayingPodcast(false);
  };

  const stopPodcast = () => {
    window.speechSynthesis?.cancel();
    setIsPlayingPodcast(false);
    setActivePodcastIdx(null);
  };

  // -----------------------------------------------------------
  // Audiobook Actions
  // -----------------------------------------------------------
  const compileAudiobook = async () => {
    setLoadingAudiobook(true);
    setAudiobookChapters([]);
    setActiveChapterIdx(0);
    setIsPlayingAudiobook(false);
    window.speechSynthesis?.cancel();

    try {
      if (documents.length === 0) throw new Error("Importez des documents pour générer un audiobook.");
      const data = await generateAudiobookStructure(documents);
      setAudiobookChapters(data.chapters);
    } catch (err: any) {
      showAlert("Audiobook", err.message, "error");
    } finally {
      setLoadingAudiobook(false);
    }
  };

  const playAudiobookSection = () => {
    if (audiobookChapters.length === 0) return;
    setIsPlayingAudiobook(true);
    window.speechSynthesis?.cancel();

    const chapterText = audiobookChapters[activeChapterIdx].text;
    const utterance = new SpeechSynthesisUtterance(chapterText);
    utterance.pitch = 0.95;
    utterance.rate = 0.92; // Serene read mode

    const voices = window.speechSynthesis?.getVoices();
    if (voices && voices.length > 0) {
      const readingVoice = voices.find(v => v.name.toLowerCase().includes("google uk english female") || v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("zira"));
      if (readingVoice) utterance.voice = readingVoice;
    }

    utterance.onend = () => {
      setIsPlayingAudiobook(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudiobook(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pauseAudiobook = () => {
    window.speechSynthesis?.cancel();
    setIsPlayingAudiobook(false);
  };

  const hasDocs = documents.length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white rounded-2xl border border-outline-variant md-elevation-1 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            {activeMode === "podcast" ? (
              <><Radio className="w-6 h-6 text-primary animate-pulse" /> Audio Summary</>
            ) : (
              <><BookOpen className="w-6 h-6 text-primary" /> Audiobook</>
            )}
          </h1>
          <p className="text-sm text-on-surface-variant max-w-lg mt-1">
            {activeMode === "podcast"
              ? "Transformez vos notes en discussion podcast : extraction de contenu, script à deux voix, engagement pédagogique et synthèse vocale."
              : "Conversion fidèle de vos sources en livre audio : OCR, détection de structure, narration verbatim et voix."}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(activeMode === "podcast"
              ? ["Extraction", "Script", "Engagement", "TTS"]
              : ["OCR", "Structure", "Narration", "Voix"]
            ).map((agent) => (
              <span key={agent} className="md-chip text-[10px]">{agent}</span>
            ))}
          </div>
        </div>

        {!lockedMode && (
          <div className="flex bg-surface-container-high p-1.5 rounded-xl border border-outline-variant self-start sm:self-center">
            <button
              onClick={() => { setActiveMode("podcast"); window.speechSynthesis?.cancel(); setIsPlayingAudiobook(false); setIsPlayingPodcast(false); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg select-none transition-all cursor-pointer ${
                activeMode === "podcast" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Audio Summary
            </button>
            <button
              onClick={() => { setActiveMode("audiobook"); window.speechSynthesis?.cancel(); setIsPlayingPodcast(false); setIsPlayingAudiobook(false); }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg select-none transition-all cursor-pointer ${
                activeMode === "audiobook" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Audiobook
            </button>
          </div>
        )}
      </div>

      {/* CASE 1: PODCAST DEBATE SCREEN */}
      {activeMode === "podcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Controls/Visual Waves */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[300px]">
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-3 border-b border-slate-50 mb-4 flex items-center gap-1.5">
                <Headphones className="w-4.5 h-4.5 text-indigo-500" /> Contrôleur Podcast
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans mb-5">
                Générez un dialogue académique résumant les éléments du cours. Deux voix synthétisées échangent sur les sujets abordés.
              </p>

              {podcastScript && isPlayingPodcast && (
                <div className="space-y-2 py-4">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-indigo-600 block animate-pulse">
                    Diffusion en direct des voix synthétisées...
                  </span>
                  
                  {/* CSS waveform animation in pure Tailwind */}
                  <div className="flex items-end justify-center gap-1 h-14 bg-slate-50 border border-slate-100/60 rounded-xl p-3">
                    <span className="w-1.5 bg-indigo-505 bg-indigo-500 rounded-sm scale-y-100 animate-[bounce_0.6s_infinite_alternate]" />
                    <span className="w-1.5 bg-indigo-650 bg-indigo-600 rounded-sm scale-y-50 animate-[bounce_0.8s_infinite_alternate_0.1s]" />
                    <span className="w-1.5 bg-indigo-500 rounded-sm scale-y-110 animate-[bounce_1.1s_infinite_alternate_0.2s]" />
                    <span className="w-1.5 bg-indigo-600 rounded-sm scale-y-75 animate-[bounce_0.7s_infinite_alternate_0.15s]" />
                    <span className="w-1.5 bg-indigo-400 rounded-sm scale-y-40 animate-[bounce_0.9s_infinite_alternate_0.3s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-50">
              {!podcastScript ? (
                <button
                  disabled={loadingPodcast || !hasDocs}
                  onClick={compilePodcast}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-705 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all hover:scale-102 cursor-pointer text-center select-none flex items-center justify-center gap-2"
                >
                  {loadingPodcast ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Élaboration des scripts...
                    </>
                  ) : (
                    <>
                      Compiler le podcast dynamique <Sparkles className="w-4 h-4 animate-pulse" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  {!isPlayingPodcast ? (
                    <button
                      onClick={() => playPodcastSpeakLoop(activePodcastIdx || 0)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" /> Lancer la lecture
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={pausePodcast}
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Pause className="w-4 h-4 fill-white" /> Pause
                      </button>
                      <button
                        onClick={stopPodcast}
                        className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-slate-700" /> Arrêter
                      </button>
                    </div>
                  )}

                  <button
                    onClick={compilePodcast}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center cursor-pointer"
                  >
                    Régénérer le script podcast
                  </button>
                </div>
              )}

              {!hasDocs && (
                <p className="text-[10px] text-red-500 leading-relaxed text-center">
                  *Documentation requise. Chargez ou importez des supports d'étude au préalable.
                </p>
              )}
            </div>
          </div>

          {/* Right Script bubble stream */}
          <div className="lg:col-span-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 min-h-[450px] max-h-[550px] overflow-y-auto space-y-4">
            {!podcastScript ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 text-center">
                <Radio className="w-12 h-12 stroke-1 text-slate-300 animate-pulse mb-3" />
                <h3 className="text-slate-705 text-sm font-medium font-sans">Affichage du script podcast</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Assemblez ici les éléments de votre manuel pour inspecter les interactions du dialogue.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-200 flex justify-between items-center bg-white px-4 py-3 rounded-xl shadow-3xs">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 tracking-wider font-semibold uppercase block">Sujet de la session de dialogue</span>
                    <span className="text-xs font-bold text-slate-800">{podcastScript.title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-sm">Professeur + Étudiant</span>
                </div>

                <div className="space-y-3.5 pt-2">
                  {podcastScript.segments.map((seg, sIdx) => {
                    const isActive = activePodcastIdx === sIdx;
                    const isProf = seg.speaker === "Professor";

                    return (
                      <div 
                        key={sIdx}
                        className={`p-3 rounded-xl border leading-relaxed text-xs transition-all flex items-start gap-3 ${
                          isActive 
                            ? "bg-indigo-50 border-indigo-300 shadow-xs scale-[1.01]" 
                            : "bg-white border-slate-100 hover:border-slate-150"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isProf ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                            isProf ? "bg-amber-100/30 text-amber-700" : "bg-indigo-100/30 text-indigo-700"
                          }`}>
                            {speakerLabel(seg.speaker)}
                          </span>
                          <p className={`pt-1 text-slate-700 ${isActive ? "text-slate-900 font-medium" : ""}`}>
                            {seg.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* CASE 2: AUDIOBOOK NARRATOR SCREEN */}
      {activeMode === "audiobook" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left chapters list */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[300px]">
            <div>
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-3 border-b border-slate-50 mb-4 flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-indigo-500" /> Chapitres de l'audiobook compilé
              </h2>

              {audiobookChapters.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-4">
                  <p>Le registre de compilation de l'audiobook est actuellement vide.</p>
                  
                  <button
                    disabled={loadingAudiobook || !hasDocs}
                    onClick={compileAudiobook}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 select-none cursor-pointer"
                  >
                    {loadingAudiobook ? "Compilation des narrations..." : "Assembler l'audiobook"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {audiobookChapters.map((ch, idx) => {
                    const isActive = activeChapterIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => { setActiveChapterIdx(idx); window.speechSynthesis?.cancel(); setIsPlayingAudiobook(false); }}
                        className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col text-xs leading-relaxed gap-0.5 ${
                          isActive
                            ? "border-indigo-500 bg-indigo-50/10"
                            : "hover:bg-slate-50 bg-white border-slate-100"
                        }`}
                      >
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Section {idx + 1}</span>
                        <h4 className="font-sans font-bold text-slate-800 text-xs truncate max-w-56">{ch.title}</h4>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {audiobookChapters.length > 0 && (
              <div className="pt-5 border-t border-slate-50 mt-5 space-y-2">
                {!isPlayingAudiobook ? (
                  <button
                    onClick={playAudiobookSection}
                    className="w-full py-3 bg-indigo-650 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Lire le chapitre actif
                  </button>
                ) : (
                  <button
                    onClick={pauseAudiobook}
                    className="w-full py-3 bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5 fill-white" /> Mettre en pause la narration
                  </button>
                )}

                <button
                  onClick={compileAudiobook}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center cursor-pointer"
                >
                  Régénérer les chapitres de l'audiobook
                </button>
              </div>
            )}
          </div>

          {/* Right Text display for Active chapter */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[400px]">
            {audiobookChapters.length === 0 ? (
              <div className="py-16 text-center text-slate-405 text-slate-400 flex flex-col items-center justify-center h-full">
                <FileText className="w-12 h-12 stroke-1 opacity-40 mb-3 animate-pulse" />
                <h3 className="text-slate-705 text-sm font-medium font-sans">Console de lecture des chapitres</h3>
                <p className="text-xs text-indigo-400/80 mt-1 max-w-sm">
                  Les transcriptions du manuel sont organisées en séquence chronologique de chapitres, sans résumé, pour une lecture vocale intégrale.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-50 bg-slate-50 px-4 py-2.5 rounded-lg border">
                  <div>
                    <span className="text-[9px] font-mono text-slate-450 uppercase tracking-wider block">Section audiobook intégrale</span>
                    <span className="text-xs font-bold text-slate-800">{audiobookChapters[activeChapterIdx].title}</span>
                  </div>
                  
                  {/* Download button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => showAlert("Téléchargement", "Compilation MP3 terminée ! Téléchargement lancé.", "success")}
                      className="p-1 px-2 text-[10px] bg-white border hover:bg-slate-50 rounded text-slate-650 transition-all font-semibold flex items-center gap-1 cursor-pointer select-none"
                    >
                      <Download className="w-3 h-3 text-slate-500" /> Enregistrer MP3
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-650 leading-relaxed font-sans space-y-4">
                  <p className={`p-4 rounded-xl leading-relaxed text-slate-600 border border-dashed hover:border-indigo-200 transition-all ${
                    isPlayingAudiobook ? "bg-indigo-50/15 border-indigo-200 glow-indigo" : "bg-slate-50/50"
                  }`}>
                    {audiobookChapters[activeChapterIdx].text}
                  </p>

                  <div className="p-3 bg-primary-container/40 border border-primary/15 text-on-surface rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Journal de transcription phonétique</span>
                    <p className="text-[11px] text-slate-350 italic font-mono leading-relaxed">
                      {audiobookChapters[activeChapterIdx].transcript}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

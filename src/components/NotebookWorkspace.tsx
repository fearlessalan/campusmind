import React, { useState, useRef, useEffect } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Check, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  FolderPlus, 
  Copy, 
  Send, 
  Sparkles, 
  Compass, 
  Tag, 
  Loader2, 
  Radio, 
  ArrowLeft, 
  Settings, 
  ChevronRight,
  User,
  GraduationCap,
  Award,
  Sliders,
  Play,
  FileText,
  Clock,
  Trash2,
  Brain
} from "lucide-react";
import { AcademicDocument, DocumentChunk, LearningModule, PerformanceStats } from "../types";
import { apiFetch } from "../lib/api";
import IngestionHub from "./IngestionHub";
import MediaStudio from "./MediaStudio";
import AdaptiveTraining from "./AdaptiveTraining";
import ExamSimulator from "./ExamSimulator";
import WorkflowBuilder from "./WorkflowBuilder";

interface NotebookWorkspaceProps {
  documents: AcademicDocument[];
  performance: PerformanceStats;
  learningPath: LearningModule[];
  completedLessons: string[];
  activeDocId: string | null;
  onSelectDoc: (id: string | null) => void;
  onBackToDashboard: () => void;
  handleIngestSuccess: (doc: AcademicDocument) => void;
  handleCurriculumUpdate: (path: LearningModule[], evaluation: any) => void;
  handleLessonComplete: (moduleId: string) => void;
  handleWorkflowComplete: (newDb: any) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: DocumentChunk[];
}

interface UserNote {
  id: string;
  title: string;
  sourceCount: number;
  timeAgo: string;
  content: string;
}

export default function NotebookWorkspace({
  documents,
  performance,
  learningPath,
  completedLessons,
  activeDocId,
  onSelectDoc,
  onBackToDashboard,
  handleIngestSuccess,
  handleCurriculumUpdate,
  handleLessonComplete,
  handleWorkflowComplete
}: NotebookWorkspaceProps) {
  // Active selected documents checkboxes
  const [checkedDocIds, setCheckedDocIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fastResearch, setFastResearch] = useState(true);

  // Discussion state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Studio actions & floating notes state
  const [activeStudioModal, setActiveStudioModal] = useState<
    "podcast" | "audiobook" | "flashcards" | "quizzes" | "mockexam" | "learningpath" | "workflow" | "ingest" | null
  >(null);

  // preseeded custom student notes state from image
  const [userNotes, setUserNotes] = useState<UserNote[]>([
    {
      id: "note-1",
      title: "Algorithmes & Tri - Synthèse",
      sourceCount: 2,
      timeAgo: "Il y a 2 min",
      content: "Les algorithmes de tri comme le Tri Fusion ou le Tri Rapide permettent d'organiser des ensembles de données de manière efficace. Le choix d'un algorithme dépend de la quantité de données et des contraintes mémoire."
    },
    {
      id: "note-2",
      title: "Complexité Temporelle",
      sourceCount: 1,
      timeAgo: "Il y a 10 min",
      content: "La complexité temporelle évalue le temps d'exécution d'un algorithme en fonction de la taille de l'entrée. La notation Grand O permet de classifier les algorithmes de manière théorique (O(1), O(log n), O(n), O(n log n))."
    },
    {
      id: "note-3",
      title: "Structures de Données Linéaires",
      sourceCount: 1,
      timeAgo: "Il y a 1 j",
      content: "Les structures linéaires classiques incluent les tableaux, les listes chaînées, les piles et les files. Chacune offre des compromis différents pour les opérations d'insertion, de suppression et d'accès."
    }
  ]);

  // Editing or creating custom note variables
  const [showAddNotePrompt, setShowAddNotePrompt] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [viewNoteDetail, setViewNoteDetail] = useState<UserNote | null>(null);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Sync default checked docs when documents list changes
  useEffect(() => {
    if (documents.length > 0 && checkedDocIds.length === 0) {
      setCheckedDocIds(documents.map(d => d.id));
    }
  }, [documents]);

  const toggleDocCheckbox = (id: string) => {
    setCheckedDocIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleAllDocs = () => {
    if (checkedDocIds.length === documents.length) {
      setCheckedDocIds([]);
    } else {
      setCheckedDocIds(documents.map(d => d.id));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const query = inputVal;
    setInputVal("");
    const userMsg: Message = { role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Find the first checked document as focal context, or none if multiple are scanning
      const selectedDocId = checkedDocIds.length === 1 ? checkedDocIds[0] : (activeDocId || null);

      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          selectedDocId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat query failed");

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          citations: data.citations
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Interruption de connexion : ${err.message || "Erreur de pipeline RAG"}`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const insertSuggestion = (prompt: string) => {
    setInputVal(prompt);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote: UserNote = {
      id: "note-custom-" + Date.now(),
      title: newNoteTitle.trim(),
      sourceCount: checkedDocIds.length || 1,
      timeAgo: "À l'instant",
      content: newNoteContent.trim()
    };

    setUserNotes(prev => [newNote, ...prev]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowAddNotePrompt(false);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserNotes(prev => prev.filter(n => n.id !== id));
    if (viewNoteDetail?.id === id) {
      setViewNoteDetail(null);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* 🧭 Top Navigation Header (Replica matching the image style) */}
      <header className="h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Tableau de bord</span>
          </button>
          
          <div className="h-4 w-[1px] bg-slate-300" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600/10 flex items-center justify-center border border-indigo-500/10 shadow-inner animate-pulse">
              <Brain className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 line-clamp-1 max-w-sm md:max-w-xl">
                {documents.find(d => d.id === activeDocId)?.name || "Algorithmique et Structures de Données"}
              </h2>
              <span className="text-[10px] font-mono text-slate-500 block tracking-wider uppercase">Active Chat Workspace</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> CampusMind OS Connecté
          </div>
          <button 
            onClick={() => setActiveStudioModal("ingest")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm hover:scale-102 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Ingestion
          </button>
        </div>
      </header>

      {/* Immersive 3-Column Workspace Main Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================= */}
        {/* COLUMN 1: SOURCES PANEL (LEFT) */}
        {/* ========================================================= */}
        <div className="w-[280px] bg-slate-50 border-r border-slate-200 flex flex-col justify-between shrink-0 h-full overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 tracking-wide uppercase font-mono flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" /> Sources
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-mono text-slate-600 font-bold">
                {checkedDocIds.length}/{documents.length}
              </span>
            </div>

            {/* Quick action button container */}
            <div className="p-4 space-y-3 shrink-0">
              <button 
                onClick={() => setActiveStudioModal("ingest")}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 hover:border-indigo-500/30 text-center cursor-pointer transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 text-indigo-500 group-hover:scale-110" /> Ajouter des sources
              </button>

              {/* Research toggle bar matching image */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Rechercher des sources..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-350 text-slate-800 placeholder-slate-400 rounded-xl outline-none transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Sources List with checkbox selection */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1 pb-1">
                <span>Liste des documents</span>
                <button 
                  onClick={handleToggleAllDocs}
                  className="hover:text-slate-700 underline cursor-pointer"
                >
                  {checkedDocIds.length === documents.length ? "Tout désactiver" : "Tout sélectionner"}
                </button>
              </div>

              {filteredDocs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-sans italic">
                  Aucun textbook trouvé.
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const isChecked = checkedDocIds.includes(doc.id);
                  const isFocused = activeDocId === doc.id;
                  
                  return (
                    <div 
                      key={doc.id}
                      onClick={() => onSelectDoc(doc.id)}
                      className={`p-3 rounded-xl border relative cursor-pointer group transition-all duration-150 ${
                        isFocused 
                          ? "bg-indigo-50/50 border-indigo-200/80 shadow-xs" 
                          : "bg-white hover:bg-slate-100 border-slate-200 shadow-3xs"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Checkbox */}
                        <div 
                          onClick={(e) => {
                              e.stopPropagation();
                              toggleDocCheckbox(doc.id);
                          }}
                          className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            isChecked 
                              ? "bg-indigo-600 border-indigo-500 text-white" 
                              : "border-slate-300 bg-white group-hover:border-slate-400"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0 pr-1.5">
                          <h4 className="text-xs font-semibold text-slate-750 truncate group-hover:text-slate-900 font-sans tracking-tight">
                            {doc.name}
                          </h4>
                          <span className="text-[10px] font-mono text-indigo-600 mt-1 block">
                            {doc.chunks.length} segments extraits
                          </span>
                        </div>
                      </div>

                      {/* Small focus glow indicator */}
                      {isFocused && (
                        <span className="absolute left-0 top-1/4 bottom-1/4 w-[3.5px] bg-indigo-500 rounded-r" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: DISCUSSION CHAT PANEL (CENTER) */}
        {/* ========================================================= */}
        <div className="flex-1 bg-white flex flex-col h-full overflow-hidden relative">
          
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-indigo-500" /> Discussion
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
              Contexte : {checkedDocIds.length} sources actives
            </span>
          </div>

          {/* Body discussion */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-white">
            
            {/* If no chat messages, show high-fidelity NotebookLM start dashboard */}
            {messages.length === 0 ? (
              <div className="max-w-xl mx-auto py-6 space-y-6">
                
                {/* Simulated Book overview card */}
                <div className="p-6 bg-slate-50/65 border border-slate-200 rounded-2xl relative overflow-hidden shadow-xs animate-scaleUp">
                  {/* Avatar profile visual */}
                  <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-500 flex items-center justify-center font-bold text-lg mb-4">
                    <BookOpen className="w-6 h-6 text-orange-500" />
                  </div>

                  <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight leading-tight">
                    {documents.find(d => d.id === activeDocId)?.name || "Algorithmique et Structures de Données: Cours et Exercices"}
                  </h1>
                  
                  <div className="text-[11px] font-mono text-slate-500 mt-1.5 flex items-center gap-2">
                    <span>{documents.length} sources actives</span>
                    <span>•</span>
                    <span>Dernier accès : Aujourd'hui</span>
                  </div>

                  <p className="text-xs text-slate-650 leading-relaxed font-sans pt-4 mt-2 border-t border-slate-200">
                    Ce support pédagogique détaille les concepts fondamentaux de l'algorithmique, incluant l'analyse de la complexité temporelle et spatiale, l'optimisation des structures de données linéaires et non linéaires, ainsi que la conception d'algorithmes robustes d'aide à la décision.
                  </p>

                  {/* Actions footer representing screenshot */}
                  <div className="flex items-center gap-4.5 mt-8 pt-4">
                    <button 
                      onClick={() => {
                        const newNote: UserNote = {
                          id: "note-saved-" + Date.now(),
                          title: "Note de Synthèse Générée",
                          sourceCount: checkedDocIds.length,
                          timeAgo: "À l'instant",
                          content: "Génération automatique d'une note d'assimilation sur " + (documents.find(d => d.id === activeDocId)?.name || "les chapitres")
                        };
                        setUserNotes(prev => [newNote, ...prev]);
                        alert("Note synthèse consignée dans votre Studio.");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 hover:border-slate-400 transition-all cursor-pointer shadow-3xs"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> Enregistrer dans une note
                    </button>
                    
                    <button 
                      onClick={() => alert("Copié dans le presse-papier")}
                      className="text-slate-500 hover:text-slate-800 cursor-pointer" 
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-2.5">
                      <button className="text-slate-500 hover:text-slate-800 cursor-pointer"><ThumbsUp className="w-3.5 h-3.5" /></button>
                      <button className="text-slate-500 hover:text-slate-850 cursor-pointer"><ThumbsDown className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>

                {/* Suggested Starters */}
                <div className="space-y-3">
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <Compass className="w-3.5 h-3.5" /> Suggestions de recherche rapide :
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <button 
                      onClick={() => insertSuggestion("Explique la structure d'un algorithme de Tri Fusion (Merge Sort) et sa complexite.")}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs text-left rounded-xl cursor-pointer transition-all hover:translate-x-0.5"
                    >
                      "Fonctionnement du Tri Fusion."
                    </button>
                    <button 
                      onClick={() => insertSuggestion("Comment evalue-t-on la complexite temporelle au pire des cas avec la notation Big-O ?")}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs text-left rounded-xl cursor-pointer transition-all hover:translate-x-0.5"
                    >
                      "Calcul de la complexite Big-O."
                    </button>
                    <button 
                      onClick={() => insertSuggestion("Quelle est la difference en termes de performance entre un tableau et une liste chainee ?")}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs text-left rounded-xl cursor-pointer transition-all hover:translate-x-0.5"
                    >
                      "Tableaux vs Listes chainees."
                    </button>
                    <button 
                      onClick={() => insertSuggestion("Quelles sont les applications pratiques d'une structure de donnees de type Pile (Stack) ?")}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs text-left rounded-xl cursor-pointer transition-all hover:translate-x-0.5"
                    >
                      "Utilisation de la structure Pile."
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Chat Message Stream */
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((m, idx) => {
                  const isAI = m.role === 'assistant';
                  return (
                    <div 
                      key={idx} 
                      className={`flex ${isAI ? "justify-start animate-fadeIn" : "justify-end"}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-4.5 text-xs leading-relaxed space-y-3.5 border ${
                        isAI 
                          ? "bg-slate-50 text-slate-850 border-slate-250 border" 
                          : "bg-indigo-600 text-white border-transparent shadow-md"
                      }`}>
                        
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/60 font-sans">
                          {isAI ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">CampusMind Advisor</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-indigo-100" />
                              <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-indigo-100">Étudiant</span>
                            </>
                          )}
                        </div>

                        <p className="whitespace-pre-line text-[12px]">{m.content}</p>

                        {/* Citations section */}
                        {isAI && m.citations && m.citations.length > 0 && (
                          <div className="pt-3 border-t border-slate-205 mt-3 space-y-1.5">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-650 font-bold block flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" /> SOURCES DOCUMENTAIRES CITÉES :
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                              {m.citations.map((cite, cIdx) => (
                                <div 
                                  key={cite.id || cIdx} 
                                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[10px] text-slate-755 transition-all flex flex-col justify-between"
                                >
                                  <span className="font-bold text-slate-800 truncate block">{cite.source}</span>
                                  <span className="font-mono text-slate-500 mt-1 flex items-center gap-0.5">
                                    <Tag className="w-3 h-3 text-indigo-500" /> {cite.chapter} | {cite.page}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-2 animate-pulse">
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      <span className="text-xs text-slate-500 font-mono italic">CampusMind synthétise les textbooks...</span>
                    </div>
                  </div>
                )}
                
                <div ref={scrollRef} />
              </div>
            )}
          </div>

          {/* Prompt/Message Form */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 animate-fadeIn">
            <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2 relative">
              <input
                type="text"
                placeholder="Posez une question ou créez quelque chose..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isTyping}
                className="flex-1 pl-4 pr-16 py-3.5 text-xs text-slate-800 rounded-xl bg-white hover:bg-slate-100/40 focus:bg-white border border-slate-200 focus:border-slate-350 focus:outline-none transition-all disabled:opacity-50 shadow-3xs"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 hover:scale-103 cursor-pointer select-none transition-all flex items-center justify-center shrink-0"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>

        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: STUDIO TOOLBOX & FLOATING NOTES (RIGHT) */}
        {/* ========================================================= */}
        <div className="w-[300px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 h-full overflow-hidden">
          
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-slate-700 tracking-wide uppercase font-mono flex items-center gap-1.5">
              <Sliders className="w-4.5 h-4.5 text-indigo-505" /> Studio
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-sm">
              BÊTA
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0 bg-slate-50">
            
            {/* Studio dynamic tools grid */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest px-1">
                Gérer mes supports
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                
                {/* Résumé audio */}
                <button 
                  onClick={() => setActiveStudioModal("podcast")}
                  className="p-3 bg-white hover:bg-slate-100/60 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all cursor-pointer group shadow-3xs"
                >
                  <Radio className="w-5 h-5 text-indigo-500 group-hover:scale-105 transition-transform mb-2.5" />
                  <span className="text-xs font-bold text-slate-800 block">Résumé Audio</span>
                  <span className="text-[9px] text-slate-500 truncate block mt-0.5">Dual Debate Podcast</span>
                </button>

                {/* Présentation / Narration verbatim */}
                <button 
                  onClick={() => setActiveStudioModal("audiobook")}
                  className="p-3 bg-white hover:bg-slate-100/60 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all cursor-pointer group shadow-3xs"
                >
                  <BookOpen className="w-5 h-5 text-emerald-500 group-hover:scale-105 transition-transform mb-2.5" />
                  <span className="text-xs font-bold text-slate-800 block">Présentation</span>
                  <span className="text-[9px] text-slate-500 truncate block mt-0.5">Libre audio lecture</span>
                </button>

                {/* Fiches d'apprentissage */}
                <button 
                  onClick={() => setActiveStudioModal("flashcards")}
                  className="p-3 bg-white hover:bg-slate-100/60 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all cursor-pointer group shadow-3xs"
                >
                  <FileText className="w-5 h-5 text-amber-500 group-hover:scale-105 transition-transform mb-2.5" />
                  <span className="text-xs font-bold text-slate-880 block">Fiches Mémo</span>
                  <span className="text-[9px] text-slate-500 truncate block mt-0.5">Glossaire & mnémos</span>
                </button>

                {/* Quiz */}
                <button 
                  onClick={() => setActiveStudioModal("quizzes")}
                  className="p-3 bg-white hover:bg-slate-100/60 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all cursor-pointer group shadow-3xs"
                >
                  <Award className="w-5 h-5 text-pink-500 group-hover:scale-105 transition-transform mb-2.5" />
                  <span className="text-xs font-bold text-slate-880 block">Quiz Pratique</span>
                  <span className="text-[9px] text-slate-500 truncate block mt-0.5">Évaluation adaptive</span>
                </button>

                {/* Examen Simulator */}
                <button 
                  onClick={() => setActiveStudioModal("mockexam")}
                  className="p-3 bg-white hover:bg-slate-100/60 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all cursor-pointer group col-span-2 flex items-center gap-3.5 shadow-3xs"
                >
                  <GraduationCap className="w-6 h-6 text-purple-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-880 block">Examen Blanc National</span>
                    <span className="text-[9px] text-slate-500 block truncate">Rapport prédictif & timing d'études</span>
                  </div>
                </button>

                {/* Workflow pipeline builder */}
                <button 
                  onClick={() => setActiveStudioModal("workflow")}
                  className="p-3 bg-white hover:bg-slate-100/60 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all cursor-pointer group col-span-2 flex items-center gap-3.5 shadow-3xs"
                >
                  <Sliders className="w-6 h-6 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-880 block">Pipeline de données</span>
                    <span className="text-[9px] text-slate-500 block truncate">Orchestrer l'ensemble en un clic</span>
                  </div>
                </button>

              </div>
            </div>

            {/* Student Saved Notes Ledger */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest px-1">
                  Notes enregistrées ({userNotes.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5">
                {userNotes.map((note) => (
                  <div 
                    key={note.id}
                    onClick={() => setViewNoteDetail(note)}
                    className="p-3 bg-white hover:bg-slate-100/40 border border-slate-200 hover:border-slate-350 rounded-xl cursor-pointer group relative overflow-hidden transition-all duration-155 shadow-3xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-650">
                        {note.title}
                      </h4>
                      <button 
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="text-slate-400 hover:text-red-650 p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[9px] font-mono text-slate-500">
                      <span>{note.sourceCount} source(s)</span>
                      <span>{note.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* "+ Ajouter une note" Floating controls bar at bottom of studio panel */}
          <div className="p-4 bg-slate-100/60 border-t border-slate-200 text-center shrink-0">
            <button 
              onClick={() => setShowAddNotePrompt(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-sans shadow-sm cursor-pointer hover:scale-102 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-white" /> Ajouter une note
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL ENGINE FOR EXPANDED WORKSPACE TOOLS (AUDIO, EXAMS...) */}
      {/* ========================================================= */}
      {activeStudioModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-850 w-full max-w-5xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-100 animate-scaleUp">
            
            {/* Dark modal header to fit visual standard */}
            <div className="px-6 py-4.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white md:px-8 shrink-0">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {activeStudioModal === "podcast" && "Générateur Audio Podcast & Échanges"}
                    {activeStudioModal === "audiobook" && "Lecture en Verbatim d'Audiobooks"}
                    {activeStudioModal === "flashcards" && "Fiches Mnémotechniques & Sessions Assimilation"}
                    {activeStudioModal === "quizzes" && "Quiz d'Évaluation de Connaissances"}
                    {activeStudioModal === "mockexam" && "Simulateur d'Examens Blancs Nationaux"}
                    {activeStudioModal === "workflow" && "Pipeline d'Assemblages de Supports Générés"}
                    {activeStudioModal === "ingest" && "OCR de Transcription & Indexation de Livres"}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                    Mode d'exécution et d'intégration direct
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setActiveStudioModal(null);
                  // Kill speech synthesis if modal is closed
                  window.speechSynthesis?.cancel();
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center hover:text-white cursor-pointer"
                title="Clore le module"
              >
                &times;
              </button>
            </div>

            {/* Inner responsive panel content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
              
              {activeStudioModal === "ingest" && (
                <IngestionHub 
                  documents={documents}
                  onIngestSuccess={(doc) => {
                    handleIngestSuccess(doc);
                    setActiveStudioModal(null);
                  }}
                  activeDocId={activeDocId}
                  onSelectDoc={onSelectDoc}
                />
              )}

              {(activeStudioModal === "podcast" || activeStudioModal === "audiobook") && (
                <MediaStudio documents={documents} />
              )}

              {(activeStudioModal === "flashcards" || activeStudioModal === "quizzes" || activeStudioModal === "learningpath") && (
                <AdaptiveTraining 
                  documents={documents}
                  learningPath={learningPath}
                  completedLessons={completedLessons}
                  onCurriculumUpdate={handleCurriculumUpdate}
                  onLessonComplete={handleLessonComplete}
                />
              )}

              {activeStudioModal === "mockexam" && (
                <ExamSimulator 
                  documents={documents}
                  onExamSaved={(newDb) => {
                    handleWorkflowComplete(newDb);
                    setActiveStudioModal(null);
                  }}
                />
              )}

              {activeStudioModal === "workflow" && (
                <WorkflowBuilder 
                  documents={documents}
                  onWorkflowComplete={(newDb) => {
                    handleWorkflowComplete(newDb);
                    setActiveStudioModal(null);
                  }}
                />
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* WRITE NEW NOTE MODAL POPUP */}
      {/* ========================================================= */}
      {showAddNotePrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4 animate-fadeIn">
          <form 
            onSubmit={handleCreateNote}
            className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-scaleUp"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-850">Enregistrer une nouvelle note</h3>
              <p className="text-[11px] text-slate-500">Consigner vos observations et synthèses personnalisées.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Titre de la note</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Concepts clés Glycolyse" 
                  value={newNoteTitle} 
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-400 text-slate-800 placeholder-slate-400 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Contenu</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Saisissez les notes d'assimilation..." 
                  value={newNoteContent} 
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-400 text-slate-800 placeholder-slate-400 rounded-lg outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddNotePrompt(false)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-250 text-slate-600 rounded-lg"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Consigner la Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW NOTE DETAIL MODAL POPUP */}
      {/* ========================================================= */}
      {viewNoteDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-850 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div>
                <span className="text-[9px] font-mono text-slate-400 tracking-wider font-semibold uppercase block">Note de Synthèse</span>
                <h3 className="text-sm font-bold text-slate-800">{viewNoteDetail.title}</h3>
              </div>
              <span className="text-[9px] font-mono text-slate-500">{viewNoteDetail.timeAgo}</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans bg-slate-50 p-4 rounded-xl border border-slate-220">
              {viewNoteDetail.content}
            </p>

            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>{viewNoteDetail.sourceCount} source(s) liée(s)</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setInputVal(`Considère le contenu de cette note enregistrée: "${viewNoteDetail.content}" — Peux-tu élaborer et synthétiser cette idée ?`);
                    setViewNoteDetail(null);
                  }}
                  className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-750 hover:bg-indigo-100 rounded transition-all font-semibold"
                >
                  Insérer dans Discussion RAG
                </button>
                <button 
                  onClick={() => setViewNoteDetail(null)}
                  className="px-3 py-1 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

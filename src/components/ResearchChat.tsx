import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  BookOpen, 
  Tag,
  Compass,
  CornerDownRight,
  Loader2
} from "lucide-react";
import { AcademicDocument, DocumentChunk } from "../types";
import { apiFetch } from "../lib/api";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: DocumentChunk[];
}

interface ResearchChatProps {
  documents: AcademicDocument[];
  activeDocId: string | null;
}

export default function ResearchChat({ documents, activeDocId }: ResearchChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your AI Research Assistant. Ask me difficult questions, ask for comparative guides, or request complete synthesis summaries regarding your compiled course textbooks."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          selectedDocId: activeDocId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat failed");

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          citations: data.citations
        }
      ]);

    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Connection Interrupted: ${err.message || "Failed to reach agent channel"}`
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestClick = (q: string) => {
    setInputValue(q);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs h-[650px] flex flex-col justify-between overflow-hidden">
      
      {/* Header Info */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="font-sans font-bold text-sm block">CampusMind RAG Agent</span>
            <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wide">Retrieval-Augmented Intelligent Advisor</span>
          </div>
        </div>

        {activeDocId ? (
          <span className="px-2.5 py-0.5 rounded-sm bg-indigo-500/15 border border-indigo-400/25 text-[10px] font-mono text-indigo-300">
            Scoped: Single File
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-sm bg-slate-850 text-[10px] font-mono text-slate-400">
            Scanning All Materials ({documents.length} docs)
          </span>
        )}
      </div>

      {/* Suggestion Prompts */}
      {messages.length === 1 && (
        <div className="p-4 bg-slate-50 border-b border-slate-150 text-xs">
          <span className="font-semibold text-slate-600 mb-2 block flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Suggestions de questions :
          </span>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleSuggestClick("Pouvez-vous me faire un résumé structuré des concepts clés du document ?")}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] rounded-lg cursor-pointer transition-all"
            >
              "Résumer ce cours"
            </button>
            <button 
              onClick={() => handleSuggestClick("Quels sont les termes déontologiques ou définitions les plus importants ici ?")}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] rounded-lg cursor-pointer transition-all"
            >
              "Extraire les définitions clés"
            </button>
            <button 
              onClick={() => handleSuggestClick("Donnez-moi des exemples d'applications concrètes ou d'études de cas associées.")}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] rounded-lg cursor-pointer transition-all"
            >
              "Cas d'études & applications"
            </button>
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => {
          const isAI = m.role === 'assistant';
          return (
            <div 
              key={idx} 
              className={`flex ${isAI ? "justify-start" : "justify-end"}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 shadow-3xs border ${
                isAI 
                  ? "bg-white text-slate-800 border-slate-100" 
                  : "bg-indigo-600 text-white border-transparent"
              }`}>
                {/* Message text formatted */}
                <p className="whitespace-pre-line">{m.content}</p>

                {/* Citations block */}
                {isAI && m.citations && m.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 mt-2 space-y-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-600 font-bold block flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> VERIFIED SOURCES REFERENCED:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {m.citations.map((cite, cIdx) => (
                        <div 
                          key={cite.id || cIdx} 
                          className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/30 border border-slate-100 text-[10px] text-slate-600 transition-all flex flex-col justify-between"
                        >
                          <span className="font-semibold text-slate-700 truncate block">{cite.source}</span>
                          <span className="font-mono text-slate-400 mt-1 flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5 text-indigo-400" /> {cite.chapter} | {cite.page}
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

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-3xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500 font-mono italic animate-pulse">CampusMind thinking... RAG pipeline executing...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Field Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white flex gap-2">
        <input
          type="text"
          placeholder="Ask analytical questions about your uploaded documents..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          className="flex-1 px-4 py-3 text-xs text-slate-700 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 hover:scale-103 cursor-pointer select-none transition-all flex items-center justify-center shrink-0"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>

    </div>
  );
}

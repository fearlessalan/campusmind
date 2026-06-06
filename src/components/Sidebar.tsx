import React from "react";
import {
  Building2,
  BookOpen,
  MessageSquare,
  GraduationCap,
  Play,
  Database,
  Sliders,
  Sparkles,
  RefreshCw,
  Award
} from "lucide-react";

type Tab_Type = "dashboard" | "ingested" | "chat" | "adaptive" | "simulator" | "media" | "workflow";

interface SidebarProps {
  activeTab: Tab_Type;
  setActiveTab: (tab: Tab_Type) => void;
  documentCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, documentCount }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", name: "Overview Studio", icon: Building2 },
    { id: "ingested", name: "Syllabus Ingestion", icon: Database },
    { id: "chat", name: "RAG Research Chat", icon: MessageSquare },
    { id: "adaptive", name: "Adaptive Training", icon: GraduationCap, extra: "Flagship" },
    { id: "simulator", name: "Exam Simulator", icon: Award },
    { id: "media", name: "Media Studio", icon: Play },
    { id: "workflow", name: "Workflow Builder", icon: Sliders },
  ] as const;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Brand Header */}
        <div className="px-6 py-5.5 border-b border-slate-850 flex items-center gap-3">
          <div className="w-9 h-9 bg-linear-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-sans font-extrabold text-white text-base tracking-tight block">CampusMind</span>
            <span className="text-[10px] font-mono text-slate-400 font-medium uppercase tracking-widest block">Academic OS</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-5 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left select-none outline-none select-none transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 font-semibold text-white shadow-sm shadow-indigo-600/10"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                  <span className="text-xs font-sans tracking-wide">{item.name}</span>
                </div>
                
                {/* Visual badges */}
                {item.id === "adaptive" && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase ${
                    isActive ? "bg-white/20 text-white" : "bg-indigo-950 text-indigo-300 border border-indigo-900/40"
                  }`}>
                    Agentic
                  </span>
                )}
                {item.id === "ingested" && documentCount > 0 && (
                  <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono font-extrabold ${
                    isActive ? "bg-white text-indigo-600" : "bg-slate-800 text-slate-300"
                  }`}>
                    {documentCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer metadata indicator */}
      <div className="p-4 border-t border-slate-850 bg-slate-950/40">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-between w-full">
            <span>Server Container Live</span>
            <span className="text-slate-500 text-[9px]">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

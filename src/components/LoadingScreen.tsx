"use client";

import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function LoadingScreen({ message = "Chargement de votre espace personnel CampusMind..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-mono space-y-3">
      <Logo size={40} className="mb-1 opacity-80" />
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <span className="text-sm font-semibold text-slate-600">{message}</span>
    </div>
  );
}

"use client";

import AppHeader from "@/components/AppHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <AppHeader />
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto h-full">{children}</div>
        </div>
      </main>
    </div>
  );
}

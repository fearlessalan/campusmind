"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import { useAppData } from "@/context/AppDataContext";

export default function AppHeader() {
  const params = useParams();
  const courseId = params.courseId as string | undefined;
  const { courses, handleLogout } = useAppData();
  const course = courseId ? courses.find((c) => c.id === courseId) : undefined;

  return (
    <header className="h-14 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 z-30">
      <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
        <Logo size={24} />
        <span className="text-sm font-semibold text-slate-800 shrink-0">CampusMind</span>
        {course && (
          <>
            <span className="text-slate-300 shrink-0">/</span>
            <span className="text-sm text-slate-500 truncate">{course.title}</span>
          </>
        )}
      </Link>

      <button
        onClick={handleLogout}
        className="p-2 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition-all cursor-pointer"
        title="Se déconnecter"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  );
}

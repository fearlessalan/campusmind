"use client";

import AuthGuard from "@/components/AuthGuard";
import { AppDataProvider } from "@/context/AppDataContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppDataProvider>{children}</AppDataProvider>
    </AuthGuard>
  );
}

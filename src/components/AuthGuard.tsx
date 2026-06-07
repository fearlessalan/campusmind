"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !user) {
      router.replace("/login");
    }
  }, [authReady, user, router]);

  if (!authReady) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoadingScreen message="Redirection vers la connexion..." />;
  }

  return <>{children}</>;
}

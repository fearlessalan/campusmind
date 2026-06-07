"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginScreen from "@/components/LoginScreen";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && user) {
      router.replace("/dashboard");
    }
  }, [authReady, user, router]);

  if (!authReady) {
    return <LoadingScreen />;
  }

  if (user) {
    return <LoadingScreen message="Redirection vers le tableau de bord..." />;
  }

  return <LoginScreen />;
}

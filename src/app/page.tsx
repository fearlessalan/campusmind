"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [authReady, user, router]);

  return <LoadingScreen />;
}

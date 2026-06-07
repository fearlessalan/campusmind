"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import { useAppData } from "@/context/AppDataContext";

export default function WorkspaceRedirectPage() {
  const router = useRouter();
  const { activeCourseId, loadingDB } = useAppData();

  useEffect(() => {
    if (loadingDB) return;
    if (activeCourseId) {
      router.replace(`/workspace/${activeCourseId}`);
    } else {
      router.replace("/dashboard");
    }
  }, [activeCourseId, loadingDB, router]);

  return <LoadingScreen />;
}

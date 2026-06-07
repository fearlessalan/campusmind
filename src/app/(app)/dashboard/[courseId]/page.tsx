"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CourseDashboard from "@/components/CourseDashboard";
import LoadingScreen from "@/components/LoadingScreen";
import { useAppData } from "@/context/AppDataContext";

export default function CourseDashboardPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const {
    courses,
    activeCourseId,
    documents,
    performance,
    activeDocId,
    loadingDB,
    setActiveDocId,
    handleSelectCourse,
    handleResetDB,
    handleResetPerformance,
  } = useAppData();

  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    if (loadingDB) return;
    if (!course) {
      router.replace("/dashboard");
      return;
    }
    if (courseId !== activeCourseId) {
      handleSelectCourse(courseId);
    }
  }, [courseId, activeCourseId, course, loadingDB, handleSelectCourse, router]);

  if (loadingDB || !course || courseId !== activeCourseId) {
    return <LoadingScreen />;
  }

  return (
    <CourseDashboard
      course={course}
      documents={documents}
      performance={performance}
      activeDocId={activeDocId}
      onSelectDoc={setActiveDocId}
      onResetDB={handleResetDB}
      onResetPerformance={handleResetPerformance}
    />
  );
}

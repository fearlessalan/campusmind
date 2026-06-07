"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import NotebookWorkspace from "@/components/NotebookWorkspace";
import LoadingScreen from "@/components/LoadingScreen";
import { useAppData } from "@/context/AppDataContext";

function WorkspaceContent() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialStudioModal, setInitialStudioModal] = useState<"ingest" | null>(null);

  const {
    courses,
    activeCourseId,
    documents,
    performance,
    learningPath,
    completedLessons,
    activeDocId,
    loadingDB,
    setActiveDocId,
    handleSelectCourse,
    handleIngestSuccess,
    handleCurriculumUpdate,
    handleLessonComplete,
    handleWorkflowComplete,
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

  useEffect(() => {
    if (searchParams.get("ingest") === "1") {
      setInitialStudioModal("ingest");
    }
  }, [searchParams]);

  if (loadingDB || !course || courseId !== activeCourseId) {
    return <LoadingScreen />;
  }

  return (
    <NotebookWorkspace
      courseId={courseId}
      courseTitle={course.title}
      documents={documents}
      performance={performance}
      learningPath={learningPath}
      completedLessons={completedLessons}
      activeDocId={activeDocId}
      onSelectDoc={setActiveDocId}
      handleIngestSuccess={handleIngestSuccess}
      handleCurriculumUpdate={handleCurriculumUpdate}
      handleLessonComplete={handleLessonComplete}
      handleWorkflowComplete={handleWorkflowComplete}
      initialStudioModal={initialStudioModal}
      onInitialModalConsumed={() => setInitialStudioModal(null)}
    />
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <WorkspaceContent />
    </Suspense>
  );
}

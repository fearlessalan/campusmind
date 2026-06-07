"use client";

import CoursesDashboard from "@/components/CoursesDashboard";
import LoadingScreen from "@/components/LoadingScreen";
import { useAppData } from "@/context/AppDataContext";

export default function CoursesDashboardPage() {
  const { courses, loadingDB, handleCreateCourse, handleDeleteCourse } = useAppData();

  if (loadingDB) {
    return <LoadingScreen />;
  }

  return (
    <CoursesDashboard
      courses={courses}
      onCreateCourse={handleCreateCourse}
      onDeleteCourse={handleDeleteCourse}
    />
  );
}

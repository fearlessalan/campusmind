"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { apiFetch } from "@/lib/api";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import { AcademicDocument, Course, LearningModule, PerformanceStats } from "@/types";

interface AppDataContextValue {
  courses: Course[];
  activeCourseId: string;
  documents: AcademicDocument[];
  performance: PerformanceStats & { scoreHistory?: number[] };
  learningPath: LearningModule[];
  completedLessons: string[];
  activeDocId: string | null;
  loadingDB: boolean;
  setActiveDocId: (id: string | null) => void;
  fetchState: () => Promise<void>;
  handleCreateCourse: (title: string, description: string) => Promise<void>;
  handleSelectCourse: (courseId: string) => Promise<void>;
  handleDeleteCourse: (courseId: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleResetDB: () => Promise<void>;
  handleResetPerformance: () => Promise<void>;
  handleIngestSuccess: (doc: AcademicDocument) => void;
  handleCurriculumUpdate: (path: LearningModule[], evaluation: { mastery_score: number }) => void;
  handleLessonComplete: (moduleId: string) => void;
  handleWorkflowComplete: (newDb: {
    documents: AcademicDocument[];
    performance: PerformanceStats;
    learningPath: LearningModule[];
    completedLessons?: string[];
  }) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function applyDbState(
  data: Record<string, unknown>,
  setters: {
    setCourses: (v: Course[]) => void;
    setActiveCourseId: (v: string) => void;
    setDocuments: (v: AcademicDocument[]) => void;
    setPerformance: (v: PerformanceStats & { scoreHistory?: number[] }) => void;
    setLearningPath: (v: LearningModule[]) => void;
    setCompletedLessons: (v: string[]) => void;
    setActiveDocId: (v: string | null) => void;
  }
) {
  setters.setCourses((data.courses as Course[]) || []);
  setters.setActiveCourseId((data.activeCourseId as string) || "");
  setters.setDocuments((data.documents as AcademicDocument[]) || []);
  setters.setPerformance(
    (data.performance as PerformanceStats & { scoreHistory?: number[] }) || {
      progress: 0,
      retention: 0,
      exam_readiness: 0,
      scoreHistory: [],
    }
  );
  setters.setLearningPath((data.learningPath as LearningModule[]) || []);
  setters.setCompletedLessons((data.completedLessons as string[]) || []);

  const docs = data.documents as AcademicDocument[] | undefined;
  if (docs && docs.length > 0) {
    setters.setActiveDocId(docs[0].id);
  } else {
    setters.setActiveDocId(null);
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { showAlert, showConfirm } = useModal();
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState("");
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [performance, setPerformance] = useState<PerformanceStats & { scoreHistory?: number[] }>({
    progress: 0,
    retention: 0,
    exam_readiness: 0,
    scoreHistory: [],
  });
  const [learningPath, setLearningPath] = useState<LearningModule[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [loadingDB, setLoadingDB] = useState(true);

  const setters = {
    setCourses,
    setActiveCourseId,
    setDocuments,
    setPerformance,
    setLearningPath,
    setCompletedLessons,
    setActiveDocId,
  };

  const fetchState = useCallback(async () => {
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/db");
      if (!response.ok) throw new Error("Impossible de joindre le serveur");
      const data = await response.json();
      applyDbState(data, setters);
    } catch (e) {
      console.error("Boot state fetch failing: ", e);
    } finally {
      setLoadingDB(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchState();
    } else {
      setLoadingDB(false);
    }
  }, [user, fetchState]);

  const handleCreateCourse = useCallback(async (title: string, description: string) => {
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Impossible de créer le cours");
      }
      const data = await response.json();
      applyDbState(data.db, setters);
      const newCourseId = data.db.activeCourseId as string;
      router.push(`/dashboard/${newCourseId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      showAlert("Erreur", message, "error");
    } finally {
      setLoadingDB(false);
    }
  }, [router, showAlert]);

  const handleSelectCourse = useCallback(async (courseId: string) => {
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/courses/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Impossible de charger le cours");
      }
      const data = await response.json();
      applyDbState(data.db, setters);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      showAlert("Erreur", message, "error");
    } finally {
      setLoadingDB(false);
    }
  }, [showAlert]);

  const handleDeleteCourse = useCallback(async (courseId: string) => {
    const confirmed = await showConfirm(
      "Supprimer le cours",
      "Êtes-vous sûr de vouloir supprimer ce cours ? Tous ses documents associés seront perdus."
    );
    if (!confirmed) return;
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/courses/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Impossible de supprimer le cours");
      }
      const data = await response.json();
      applyDbState(data.db, setters);
      if (activeCourseId === courseId) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      showAlert("Erreur", message, "error");
    } finally {
      setLoadingDB(false);
    }
  }, [activeCourseId, router, showAlert, showConfirm]);

  const handleLogout = async () => {
    setLoadingDB(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase signOut issue: ", e);
    }
    setCourses([]);
    setActiveCourseId("");
    setDocuments([]);
    setPerformance({ progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] });
    setLearningPath([]);
    setCompletedLessons([]);
    setActiveDocId(null);
    setLoadingDB(false);
    router.replace("/login");
  };

  const handleResetDB = async () => {
    const confirmed = await showConfirm(
      "Réinitialiser l'espace",
      "Voulez-vous réinitialiser votre espace et effacer tous les documents ?"
    );
    if (!confirmed) return;
    setLoadingDB(true);
    try {
      await apiFetch("/api/db/reset-performance", { method: "POST" });
      setDocuments([]);
      setPerformance({ progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] });
      setLearningPath([]);
      setCompletedLessons([]);
      setActiveDocId(null);
      showAlert("Réinitialisation", "Votre espace personnel a été réinitialisé.", "success");
    } catch (err) {
      showAlert("Erreur", (err as Error).message, "error");
    } finally {
      setLoadingDB(false);
    }
  };

  const handleResetPerformance = async () => {
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/db/reset-performance", { method: "POST" });
      const data = await response.json();
      setPerformance(data.db.performance);
      setLearningPath(data.db.learningPath.map((m: LearningModule) => ({ ...m, isCompleted: false })));
      setCompletedLessons([]);
      showAlert("Performance", "Historique des quiz et scores réinitialisés.", "success");
    } catch (err) {
      showAlert("Erreur", (err as Error).message, "error");
    } finally {
      setLoadingDB(false);
    }
  };

  const handleIngestSuccess = (doc: AcademicDocument) => {
    setDocuments((prev) => [...prev, doc]);
    setActiveDocId(doc.id);
    showAlert("Import réussi", `« ${doc.name} » a été indexé avec succès.`, "success");
  };

  const handleCurriculumUpdate = (path: LearningModule[], evaluation: { mastery_score: number }) => {
    setLearningPath(path);
    setPerformance((prev) => ({
      ...prev,
      exam_readiness: evaluation.mastery_score,
      retention: Math.round(evaluation.mastery_score * 0.95),
      progress: 10,
    }));
  };

  const handleLessonComplete = (moduleId: string) => {
    setCompletedLessons((prev) => (prev.includes(moduleId) ? prev : [...prev, moduleId]));
    fetchState();
  };

  const handleWorkflowComplete = (newDb: {
    documents: AcademicDocument[];
    performance: PerformanceStats;
    learningPath: LearningModule[];
    completedLessons?: string[];
  }) => {
    setDocuments(newDb.documents);
    setPerformance(newDb.performance);
    setLearningPath(newDb.learningPath);
    setCompletedLessons(newDb.completedLessons || []);
    showAlert("Workflow terminé", "Orchestration intelligente CampusMind initialisée avec succès !", "success");
  };

  return (
    <AppDataContext.Provider
      value={{
        courses,
        activeCourseId,
        documents,
        performance,
        learningPath,
        completedLessons,
        activeDocId,
        loadingDB,
        setActiveDocId,
        fetchState,
        handleCreateCourse,
        handleSelectCourse,
        handleDeleteCourse,
        handleLogout,
        handleResetDB,
        handleResetPerformance,
        handleIngestSuccess,
        handleCurriculumUpdate,
        handleLessonComplete,
        handleWorkflowComplete,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData doit être utilisé dans AppDataProvider");
  return ctx;
}

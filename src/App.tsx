import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Database, 
  MessageSquare, 
  GraduationCap, 
  Award, 
  Play, 
  Sliders, 
  Sparkles,
  RefreshCw,
  Loader2,
  LogOut,
  User
} from "lucide-react";

import NotebookWorkspace from "./components/NotebookWorkspace";
import Dashboard from "./components/Dashboard";
import { AcademicDocument, PerformanceStats, LearningModule, Course } from "./types";
import { auth, googleProvider, signInWithPopup, signOut } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { apiFetch } from "./lib/api";

export default function App() {
  const [activeView, setActiveView] = useState<"dashboard" | "workspace">("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>("");
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [performance, setPerformance] = useState<PerformanceStats & { scoreHistory?: number[] }>({
    progress: 0,
    retention: 0,
    exam_readiness: 0,
    scoreHistory: []
  });
  const [learningPath, setLearningPath] = useState<LearningModule[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const [loadingDB, setLoadingDB] = useState(true);

  // Authentication states
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem("campusmind_email"));
  const [token, setToken] = useState<string | null>(localStorage.getItem("campusmind_token"));
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Sync state on boot or login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = user.email || "";
        const token = btoa(email);
        localStorage.setItem("campusmind_token", token);
        localStorage.setItem("campusmind_email", email);
        setToken(token);
        setUserEmail(email);
        fetchState();
      } else {
        localStorage.removeItem("campusmind_token");
        localStorage.removeItem("campusmind_email");
        setToken(null);
        setUserEmail(null);
        setLoadingDB(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchState = async () => {
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/db");
      if (!response.ok) throw new Error("Could not reach DB endpoint");
      const data = await response.json();
      
      setCourses(data.courses || []);
      setActiveCourseId(data.activeCourseId || "");
      setDocuments(data.documents || []);
      setPerformance(data.performance || { progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] });
      setLearningPath(data.learningPath || []);
      setCompletedLessons(data.completedLessons || []);
      
      if (data.documents && data.documents.length > 0) {
        setActiveDocId(data.documents[0].id);
      } else {
        setActiveDocId(null);
      }
    } catch (e) {
      console.error("Boot state fetch failing: ", e);
    } finally {
      setLoadingDB(false);
    }
  };

  const handleCreateCourse = async (title: string, description: string) => {
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Impossible de créer le cours");
      }
      const data = await response.json();
      setCourses(data.db.courses || []);
      setActiveCourseId(data.db.activeCourseId || "");
      setDocuments(data.db.documents || []);
      setPerformance(data.db.performance || { progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] });
      setLearningPath(data.db.learningPath || []);
      setCompletedLessons(data.db.completedLessons || []);
      if (data.db.documents && data.db.documents.length > 0) {
        setActiveDocId(data.db.documents[0].id);
      } else {
        setActiveDocId(null);
      }
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setLoadingDB(false);
    }
  };

  const handleSelectCourse = async (courseId: string) => {
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/courses/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Impossible de charger le cours");
      }
      const data = await response.json();
      setCourses(data.db.courses || []);
      setActiveCourseId(data.db.activeCourseId || "");
      setDocuments(data.db.documents || []);
      setPerformance(data.db.performance || { progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] });
      setLearningPath(data.db.learningPath || []);
      setCompletedLessons(data.db.completedLessons || []);
      if (data.db.documents && data.db.documents.length > 0) {
        setActiveDocId(data.db.documents[0].id);
      } else {
        setActiveDocId(null);
      }
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setLoadingDB(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours ? Tous ses documents associés seront perdus.")) return;
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/courses/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Impossible de supprimer le cours");
      }
      const data = await response.json();
      setCourses(data.db.courses || []);
      setActiveCourseId(data.db.activeCourseId || "");
      setDocuments(data.db.documents || []);
      setPerformance(data.db.performance || { progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] });
      setLearningPath(data.db.learningPath || []);
      setCompletedLessons(data.db.completedLessons || []);
      if (data.db.documents && data.db.documents.length > 0) {
        setActiveDocId(data.db.documents[0].id);
      } else {
        setActiveDocId(null);
      }
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setLoadingDB(false);
    }
  };

  const handleLogout = async () => {
    setLoadingDB(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase signOut issue: ", e);
    }
    localStorage.removeItem("campusmind_token");
    localStorage.removeItem("campusmind_email");
    setToken(null);
    setUserEmail(null);
    setCourses([]);
    setActiveCourseId("");
    setDocuments([]);
    setPerformance({ progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] });
    setLearningPath([]);
    setCompletedLessons([]);
    setActiveDocId(null);
    setLoadingDB(false);
  };

  const handleLoadDemo = async (topic: "biology" | "ethics") => {
    setLoadingDB(true);
    try {
      // Re-seed DB
      const response = await apiFetch("/api/db/reset", { method: "POST" });
      const data = await response.json();
      
      setDocuments(data.db.documents);
      setPerformance(data.db.performance);
      setLearningPath(data.db.learningPath);
      setCompletedLessons(data.db.completedLessons || []);
      
      setActiveDocId(data.db.documents[0]?.id || "demo-doc-algo");

      alert("Le cours de demo d'Algorithmique et Structures de Donnees a ete charge dans votre espace !");
    } catch (err) {
      alert("Erreur lors du chargement de la démo: " + (err as Error).message);
    } finally {
      setLoadingDB(false);
    }
  };

  const handleResetDB = async () => {
    if (!confirm("Voulez-vous réinitialiser votre espace et effacer tous les documents ?")) return;
    setLoadingDB(true);
    try {
      const response = await apiFetch("/api/db/reset-performance", { method: "POST" });
      const data = await response.json();
      
      setDocuments([]);
      setPerformance({ progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] });
      setLearningPath([]);
      setCompletedLessons([]);
      setActiveDocId(null);
      
      alert("Votre espace personnel a été réinitialisé.");
    } catch (err) {
      alert("Erreur de réinitialisation: " + (err as Error).message);
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
      setLearningPath(data.db.learningPath.map((m: any) => ({ ...m, isCompleted: false })));
      setCompletedLessons([]);
      
      alert("Historique des quiz et scores réinitialisés.");
    } catch (err) {
      alert("Erreur: " + (err as Error).message);
    } finally {
      setLoadingDB(false);
    }
  };

  const handleIngestSuccess = (doc: AcademicDocument) => {
    setDocuments((prev) => [...prev, doc]);
    setActiveDocId(doc.id);
    setActiveView("workspace");
    alert(`"${doc.name}" dactylographié et indexé avec succès !`);
  };

  const handleCurriculumUpdate = (path: LearningModule[], evaluation: any) => {
    setLearningPath(path);
    setPerformance((prev) => ({
      ...prev,
      exam_readiness: evaluation.mastery_score,
      retention: Math.round(evaluation.mastery_score * 0.95),
      progress: 10
    }));
  };

  const handleLessonComplete = (moduleId: string) => {
    if (!completedLessons.includes(moduleId)) {
      setCompletedLessons((prev) => [...prev, moduleId]);
    }
    fetchState();
  };

  const handleWorkflowComplete = (newDb: any) => {
    setDocuments(newDb.documents);
    setPerformance(newDb.performance);
    setLearningPath(newDb.learningPath);
    setCompletedLessons(newDb.completedLessons || []);
    alert("Orchestration intelligente CampusMind initialisée avec succès !");
  };

  if (loadingDB) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-mono space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-605 animate-spin" />
        <span className="text-sm font-semibold text-slate-650">Chargement de votre espace personnel CampusMind...</span>
      </div>
    );
  }

  // Authentic Authentication Screen (if not logged in)
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
        <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col items-center space-y-2 mb-6">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shadow-3xs animate-bounce animate-duration-2000">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CampusMind</h1>
            <p className="text-xs text-slate-500 text-center">
              Le système d'intelligence académique pour structurer vos cours et vos révisions.
            </p>
          </div>

          <div className="space-y-4">
            {authError && (
              <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl font-mono text-center">
                {authError}
              </div>
            )}

            <p className="text-xs text-slate-500 text-center mb-2">
              Connectez-vous en un clic avec votre compte Google universitaire ou personnel pour sécuriser vos documents d'étude personnalisés.
            </p>

            <button
              onClick={async () => {
                setAuthLoading(true);
                setAuthError(null);
                try {
                  await signInWithPopup(auth, googleProvider);
                } catch (err: any) {
                  console.error("Google SSO error: ", err);
                  setAuthError(err.message || "Une erreur est survenue lors de la connexion Google.");
                } finally {
                  setAuthLoading(false);
                }
              }}
              disabled={authLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 mr-0.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 1.83 15.44 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.556-4.435 10.556-10.74 0-.72-.078-1.27-.172-1.815V10.285z" />
                  </svg>
                  Se connecter avec Google
                </>
              )}
            </button>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-6 text-center">
          CampusMind • Cloud Sandbox Firestore & Auth • Données isolées
        </div>
      </div>
    );
  }

  // View 2: Immersive 3-Column Notebook Workspace
  if (activeView === "workspace") {
    return (
      <NotebookWorkspace
        documents={documents}
        performance={performance}
        learningPath={learningPath}
        completedLessons={completedLessons}
        activeDocId={activeDocId}
        onSelectDoc={setActiveDocId}
        onBackToDashboard={() => setActiveView("dashboard")}
        handleIngestSuccess={handleIngestSuccess}
        handleCurriculumUpdate={handleCurriculumUpdate}
        handleLessonComplete={handleLessonComplete}
        handleWorkflowComplete={handleWorkflowComplete}
      />
    );
  }

  // View 1: Overall Dashboard / Course Library Selector
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Header Controls Bar */}
        <header className="h-[68px] border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0 shadow-3xs z-30">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">Matière active :</span>
            {activeDocId ? (
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100/60 rounded-lg text-indigo-700 text-xs font-semibold max-w-72 truncate block">
                {documents.find((d) => d.id === activeDocId)?.name || "Textbook Source active"}
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-100/60 rounded-lg text-amber-700 text-xs font-semibold">
                Aucun document d'étude actif
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchState}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-500 hover:text-slate-800 cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-100 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer flex items-center gap-1"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold font-mono uppercase tracking-wider hidden sm:inline">Quitter</span>
            </button>

            <div className="w-0.5 h-4 bg-slate-200" />
            
            <button
               onClick={() => setActiveView("workspace")}
               className="text-xs font-bold text-indigo-650 hover:underline px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg cursor-pointer mr-2"
             >
               Ouvrir le Workspace
             </button>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block animate-pulse" /> CampusMind OS
            </div>
          </div>
        </header>

        {/* Course Analytics Map Dashboard Row */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto h-full">
            <Dashboard
              documents={documents}
              performance={performance}
              onResetDB={handleResetDB}
              onResetPerformance={handleResetPerformance}
              onSelectDoc={setActiveDocId}
              activeDocId={activeDocId}
              onEnterWorkspace={() => setActiveView("workspace")}
              courses={courses}
              activeCourseId={activeCourseId}
              onCreateCourse={handleCreateCourse}
              onSelectCourse={handleSelectCourse}
              onDeleteCourse={handleDeleteCourse}
            />
          </div>
        </div>

      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Plus, BookMarked, X, Trash2, FileText, BookOpen } from "lucide-react";
import { Course } from "@/types";

interface CoursesDashboardProps {
  courses: Course[];
  onCreateCourse: (title: string, description: string) => void;
  onDeleteCourse: (courseId: string) => void;
}

export default function CoursesDashboard({ courses, onCreateCourse, onDeleteCourse }: CoursesDashboardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateCourse(newTitle, newDesc);
    setNewTitle("");
    setNewDesc("");
    setIsCreating(false);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Mes cours</h1>
        <p className="text-on-surface-variant text-sm max-w-xl">
          Sélectionnez un cours pour accéder à ses analytics, documents et outils d&apos;étude.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" /> Bibliothèque
          </h2>
          {!isCreating && (
            <button onClick={() => setIsCreating(true)} className="md-btn-filled text-sm">
              <Plus className="w-3.5 h-3.5" /> Nouveau cours
            </button>
          )}
        </div>

        {isCreating && (
          <form onSubmit={handleSubmitCourse} className="p-5 md-card space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-primary" /> Créer un cours
              </span>
              <button type="button" onClick={() => setIsCreating(false)} className="md-btn-text p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">Nom du cours *</label>
                <input
                  type="text"
                  required
                  placeholder="ex. : Algorithmique, Économie, Droit..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="md-textfield-outlined"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">Description</label>
                <input
                  type="text"
                  placeholder="ex. : Préparation à l'examen final"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="md-textfield-outlined"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="md-btn-outlined text-sm">
                Annuler
              </button>
              <button type="submit" className="md-btn-filled text-sm">
                Créer le cours
              </button>
            </div>
          </form>
        )}

        {courses.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-outline-variant bg-surface-container-low rounded-2xl flex flex-col items-center space-y-3">
            <GraduationCap className="w-10 h-10 text-outline-variant" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface">Aucun cours</p>
              <p className="text-sm text-on-surface-variant max-w-md">
                Créez votre premier cours pour importer vos documents et commencer à apprendre.
              </p>
            </div>
            <button onClick={() => setIsCreating(true)} className="md-btn-filled text-sm">
              <Plus className="w-3.5 h-3.5" /> Créer mon premier cours
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const docCount = course.documents?.length || 0;
              const modCount = course.learningPath?.length || 0;

              return (
                <Link
                  key={course.id}
                  href={`/dashboard/${course.id}`}
                  className="group p-5 rounded-2xl border border-outline-variant bg-surface-container-low hover:md-elevation-2 transition-all flex flex-col justify-between h-[154px] cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="md-chip text-[10px]">Cours</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteCourse(course.id);
                        }}
                        className="p-1 text-outline hover:text-error hover:bg-error-container rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="font-bold text-on-surface text-sm truncate">{course.title}</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {course.description || "Aucune description."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-outline-variant text-xs text-on-surface-variant mt-2">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <strong>{docCount}</strong> doc{docCount > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <strong>{modCount}</strong> module{modCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

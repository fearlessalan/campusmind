import type { NextRequest } from "next/server";
import { getUserData, writeUserData } from "../db";
import { errorResponse, jsonResponse } from "../response";

function syncActiveCourse(userData: Record<string, unknown>) {
  if (userData.activeCourseId && Array.isArray(userData.courses)) {
    const activeIdx = (userData.courses as { id: string }[]).findIndex(
      (c) => c.id === userData.activeCourseId
    );
    if (activeIdx !== -1) {
      (userData.courses as Record<string, unknown>[])[activeIdx] = {
        ...(userData.courses as Record<string, unknown>[])[activeIdx],
        documents: userData.documents || [],
        performance: userData.performance || {
          progress: 0,
          retention: 0,
          exam_readiness: 0,
          scoreHistory: [],
        },
        learningPath: userData.learningPath || [],
        completedLessons: userData.completedLessons || [],
        quizHistory: userData.quizHistory || [],
      };
    }
  }
}

export async function handleCreateCourse(req: NextRequest) {
  const { title, description } = await req.json();
  if (!title) {
    return errorResponse("Le titre du cours est requis.");
  }

  const userData = getUserData(req);
  syncActiveCourse(userData);

  const newCourse = {
    id: "course-" + Date.now(),
    title: title.trim(),
    description: (description || "").trim(),
    createdAt: new Date().toISOString(),
    documents: [],
    performance: { progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] },
    learningPath: [],
    completedLessons: [],
    quizHistory: [],
  };

  if (!userData.courses) userData.courses = [];
  (userData.courses as unknown[]).push(newCourse);
  userData.activeCourseId = newCourse.id;
  userData.documents = newCourse.documents;
  userData.performance = newCourse.performance;
  userData.learningPath = newCourse.learningPath;
  userData.completedLessons = newCourse.completedLessons;
  userData.quizHistory = newCourse.quizHistory;

  writeUserData(req, userData);
  return jsonResponse({ success: true, db: userData });
}

export async function handleSelectCourse(req: NextRequest) {
  const { courseId } = await req.json();
  if (!courseId) {
    return errorResponse("L'ID du cours est requis.");
  }

  const userData = getUserData(req);
  syncActiveCourse(userData);

  const targetCourse = (userData.courses as { id: string }[] | undefined)?.find(
    (c) => c.id === courseId
  ) as Record<string, unknown> | undefined;
  if (!targetCourse) {
    return errorResponse("Cours non trouvé.", 404);
  }

  userData.activeCourseId = courseId;
  userData.documents = targetCourse.documents || [];
  userData.performance = targetCourse.performance || {
    progress: 0,
    retention: 0,
    exam_readiness: 0,
    scoreHistory: [],
  };
  userData.learningPath = targetCourse.learningPath || [];
  userData.completedLessons = targetCourse.completedLessons || [];
  userData.quizHistory = targetCourse.quizHistory || [];

  writeUserData(req, userData);
  return jsonResponse({ success: true, db: userData });
}

export async function handleDeleteCourse(req: NextRequest) {
  const { courseId } = await req.json();
  if (!courseId) {
    return errorResponse("L'ID du cours est requis.");
  }

  const userData = getUserData(req);
  if (!userData.courses) userData.courses = [];

  userData.courses = (userData.courses as { id: string }[]).filter((c) => c.id !== courseId);

  if (userData.activeCourseId === courseId) {
    const courses = userData.courses as Record<string, unknown>[];
    if (courses.length > 0) {
      const nextCourse = courses[0];
      userData.activeCourseId = nextCourse.id;
      userData.documents = nextCourse.documents || [];
      userData.performance = nextCourse.performance || {
        progress: 0,
        retention: 0,
        exam_readiness: 0,
        scoreHistory: [],
      };
      userData.learningPath = nextCourse.learningPath || [];
      userData.completedLessons = nextCourse.completedLessons || [];
      userData.quizHistory = nextCourse.quizHistory || [];
    } else {
      userData.activeCourseId = "";
      userData.documents = [];
      userData.performance = { progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] };
      userData.learningPath = [];
      userData.completedLessons = [];
      userData.quizHistory = [];
    }
  }

  writeUserData(req, userData);
  return jsonResponse({ success: true, db: userData });
}

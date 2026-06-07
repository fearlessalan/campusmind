import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";
import { getUserEmail } from "./auth";

const DB_PATH = path.join(process.cwd(), "db.json");

export interface DatabaseSchema {
  documents: {
    id: string;
    name: string;
    contentType: string;
    size: number;
    uploadDate: string;
    chunks: {
      id: string;
      source: string;
      page: string;
      chapter: string;
      content: string;
    }[];
  }[];
  performance: {
    progress: number;
    retention: number;
    exam_readiness: number;
    scoreHistory: number[];
  };
  learningPath: {
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    order: number;
    weakTopicRelation?: string;
    isCompleted?: boolean;
  }[];
  completedLessons: string[];
  quizHistory: {
    date: string;
    type: string;
    score: number;
  }[];
}

export const getInitialUserState = () => ({
  courses: [] as unknown[],
  activeCourseId: "",
  documents: [],
  performance: {
    progress: 0,
    retention: 0,
    exam_readiness: 0,
    scoreHistory: [] as number[],
  },
  learningPath: [],
  completedLessons: [] as string[],
  quizHistory: [] as { date: string; type: string; score: number }[],
});

const initialDB: DatabaseSchema & { users?: Record<string, unknown> } = {
  users: {},
  documents: [],
  performance: {
    progress: 0,
    retention: 0,
    exam_readiness: 0,
    scoreHistory: [],
  },
  learningPath: [],
  completedLessons: [],
  quizHistory: [],
};

export function readDB(): Record<string, unknown> {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf8");
      return JSON.parse(raw) as Record<string, unknown>;
    }
  } catch (e) {
    console.error("Error reading database file, using empty schema", e);
  }
  return { ...initialDB };
}

export function writeDB(db: Record<string, unknown>) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing database file", e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserData(req: NextRequest): Promise<any> {
  const email = await getUserEmail(req);
  const db = readDB();
  if (email) {
    if (!db.users) db.users = {};
    const users = db.users as Record<string, { passwordHash: string; data: ReturnType<typeof getInitialUserState> }>;
    if (!users[email]) {
      users[email] = {
        passwordHash: "",
        data: getInitialUserState(),
      };
      writeDB(db);
    }
    return users[email].data;
  }
  return db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeUserData(req: NextRequest, data: any) {
  const email = await getUserEmail(req);
  const db = readDB();
  if (email) {
    if (!db.users) db.users = {};
    const users = db.users as Record<string, { passwordHash: string; data: ReturnType<typeof getInitialUserState> }>;
    if (!users[email]) {
      users[email] = {
        passwordHash: "",
        data: getInitialUserState(),
      };
    }

    if (data.activeCourseId && Array.isArray(data.courses)) {
      const courseIndex = data.courses.findIndex((c: { id: string }) => c.id === data.activeCourseId);
      if (courseIndex !== -1) {
        data.courses[courseIndex] = {
          ...data.courses[courseIndex],
          documents: data.documents || [],
          performance: data.performance || { progress: 0, retention: 0, exam_readiness: 0, scoreHistory: [] },
          learningPath: data.learningPath || [],
          completedLessons: data.completedLessons || [],
          quizHistory: data.quizHistory || [],
        };
      }
    }

    users[email].data = data;
    writeDB(db);
  } else {
    const legacy = db as unknown as DatabaseSchema;
    legacy.documents = data.documents || legacy.documents;
    legacy.performance = data.performance || legacy.performance;
    legacy.learningPath = data.learningPath || legacy.learningPath;
    legacy.completedLessons = data.completedLessons || legacy.completedLessons;
    legacy.quizHistory = data.quizHistory || legacy.quizHistory;
    writeDB(db);
  }
}

try {
  readDB();
} catch (e) {
  console.error("Database initialization failed", e);
}

export { initialDB };

import type { NextRequest } from "next/server";
import { getUserEmail } from "../auth";
import {
  getUserData,
  writeUserData,
  readDB,
  writeDB,
  getInitialUserState,
  initialDB,
} from "../db";
import { jsonResponse } from "../response";

export async function handleGetDb(req: NextRequest) {
  return jsonResponse(getUserData(req));
}

export async function handleResetDb(req: NextRequest) {
  const email = getUserEmail(req);
  if (email) {
    const db = readDB();
    if (!db.users) db.users = {};
    const users = db.users as Record<string, { passwordHash: string; data: ReturnType<typeof getInitialUserState> }>;
    if (!users[email]) {
      users[email] = { passwordHash: "", data: getInitialUserState() };
    }
    const freshData = getInitialUserState();
    users[email].data = freshData;
    writeDB(db);
    return jsonResponse({ message: "Espace réinitialisé avec succès.", db: freshData });
  }

  writeDB({ ...initialDB });
  return jsonResponse({ message: "Base de données réinitialisée.", db: initialDB });
}

export async function handleResetPerformance(req: NextRequest) {
  const userDB = getUserData(req);
  userDB.performance = {
    progress: 0,
    retention: 0,
    exam_readiness: 0,
    scoreHistory: [],
  };
  userDB.learningPath = (userDB.learningPath as { isCompleted?: boolean }[]).map((m) => ({
    ...m,
    isCompleted: false,
  }));
  userDB.completedLessons = [];
  userDB.quizHistory = [];
  writeUserData(req, userDB);
  return jsonResponse({ message: "Progression réinitialisée.", db: userDB });
}

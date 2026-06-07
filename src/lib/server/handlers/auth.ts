import type { NextRequest } from "next/server";
import { hashPassword, getUserEmail } from "../auth";
import { readDB, writeDB, getInitialUserState } from "../db";
import { errorResponse, jsonResponse } from "../response";

export async function handleRegister(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return errorResponse("L'e-mail et le mot de passe sont requis.");
  }
  const cleanEmail = email.trim().toLowerCase();
  const db = readDB();
  if (!db.users) db.users = {};
  const users = db.users as Record<string, unknown>;
  if (users[cleanEmail]) {
    return errorResponse("Cet e-mail est déjà enregistré.");
  }

  users[cleanEmail] = {
    passwordHash: hashPassword(password),
    data: getInitialUserState(),
  };
  writeDB(db);

  return jsonResponse({ success: true, email: cleanEmail });
}

export async function handleLogin(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return errorResponse("L'e-mail et le mot de passe sont requis.");
  }
  const cleanEmail = email.trim().toLowerCase();
  const db = readDB();
  const users = db.users as Record<string, { passwordHash: string }> | undefined;
  if (!users?.[cleanEmail]) {
    return errorResponse("Identifiants de connexion invalides.", 401);
  }

  const hash = hashPassword(password);
  if (users[cleanEmail].passwordHash !== hash) {
    return errorResponse("Mot de passe incorrect.", 401);
  }

  return jsonResponse({
    success: true,
    email: cleanEmail,
    token: Buffer.from(cleanEmail).toString("base64"),
  });
}

export async function handleMe(req: NextRequest) {
  const email = getUserEmail(req);
  if (email) {
    const db = readDB();
    const users = db.users as Record<string, unknown> | undefined;
    if (users?.[email]) {
      return jsonResponse({ success: true, email });
    }
  }
  return errorResponse("Session expirée ou invalide.", 401);
}

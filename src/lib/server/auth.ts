import crypto from "crypto";
import type { NextRequest } from "next/server";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: { email?: string }[] };
    const email = data.users?.[0]?.email;
    return email ? email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function getUserEmail(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.substring(7);
    return verifyFirebaseIdToken(idToken);
  }
  return null;
}

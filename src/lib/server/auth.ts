import crypto from "crypto";
import type { NextRequest } from "next/server";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function getUserEmail(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const email = Buffer.from(token, "base64").toString("utf8");
      return email.trim().toLowerCase();
    } catch {
      /* invalid token */
    }
  }
  const headerEmail = req.headers.get("x-user-email");
  if (headerEmail) {
    return headerEmail.trim().toLowerCase();
  }
  return null;
}

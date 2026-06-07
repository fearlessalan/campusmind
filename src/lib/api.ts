"use client";

import { auth } from "@/firebase";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const finalInit: RequestInit = init ? { ...init } : {};
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    const headers = new Headers(finalInit.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    finalInit.headers = headers;
  }

  return fetch(input, finalInit);
}

export async function parseApiResponse<T = Record<string, unknown>>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new Error(`Erreur serveur (${response.status}). Redémarrez le serveur avec npm run dev.`);
    }
    return {} as T;
  }
  try {
    const data = JSON.parse(text) as T;
    if (!response.ok) {
      const err = data as { error?: string };
      throw new Error(err.error || `Erreur serveur (${response.status})`);
    }
    return data;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Erreur")) throw e;
    throw new Error(`Réponse serveur invalide (${response.status})`);
  }
}

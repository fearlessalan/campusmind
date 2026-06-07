"use client";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db as firestore, auth } from "@/firebase";

export type SavedAssetType = "note" | "quiz" | "exam" | "podcast" | "audiobook";

export interface SavedAsset {
  id: string;
  type: SavedAssetType;
  title: string;
  content: string;
  audioBase64?: string;
  audioMimeType?: string;
  sourceCount: number;
  score?: number;
  createdAt: Date;
}

export interface SavedAssetInput {
  type: SavedAssetType;
  title: string;
  content: string;
  audioBase64?: string;
  audioMimeType?: string;
  sourceCount?: number;
  score?: number;
}

function assetsCollection(courseId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Utilisateur non connecté");
  return collection(firestore, "users", uid, "courses", courseId, "assets");
}

function toSavedAsset(id: string, data: Record<string, unknown>): SavedAsset {
  const createdAt = data.createdAt;
  return {
    id,
    type: data.type as SavedAssetType,
    title: String(data.title || ""),
    content: String(data.content || ""),
    audioBase64: data.audioBase64 as string | undefined,
    audioMimeType: data.audioMimeType as string | undefined,
    sourceCount: Number(data.sourceCount || 0),
    score: data.score !== undefined ? Number(data.score) : undefined,
    createdAt:
      createdAt instanceof Timestamp
        ? createdAt.toDate()
        : createdAt
          ? new Date(String(createdAt))
          : new Date(),
  };
}

export function subscribeSavedAssets(
  courseId: string,
  onChange: (assets: SavedAsset[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(assetsCollection(courseId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const assets = snapshot.docs.map((d) => toSavedAsset(d.id, d.data()));
      onChange(assets);
    },
    (err) => onError?.(err)
  );
}

export async function saveAsset(courseId: string, input: SavedAssetInput): Promise<string> {
  const id = `${input.type}-${Date.now()}`;
  await setDoc(doc(assetsCollection(courseId), id), {
    type: input.type,
    title: input.title,
    content: input.content,
    audioBase64: input.audioBase64 || null,
    audioMimeType: input.audioMimeType || null,
    sourceCount: input.sourceCount ?? 0,
    score: input.score ?? null,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function deleteAsset(courseId: string, assetId: string): Promise<void> {
  await deleteDoc(doc(assetsCollection(courseId), assetId));
}

export function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

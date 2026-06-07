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

function getLocalAssets(courseId: string): SavedAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`campusmind-assets-${courseId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
    }
  } catch (e) {
    console.error("Failed to read local assets:", e);
  }
  return [];
}

function saveLocalAssets(courseId: string, assets: SavedAsset[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`campusmind-assets-${courseId}`, JSON.stringify(assets));
  } catch (e) {
    console.error("Failed to write local assets:", e);
  }
}

export function subscribeSavedAssets(
  courseId: string,
  onChange: (assets: SavedAsset[]) => void,
  onError?: (error: Error) => void
): () => void {
  let unsubscribed = false;
  let unsubscribeFirestore: (() => void) | null = null;

  const handleLocalUpdate = () => {
    if (unsubscribed) return;
    const localItems = getLocalAssets(courseId);
    onChange(localItems);
  };

  if (typeof window !== "undefined") {
    window.addEventListener(`campusmind-assets-updated-${courseId}`, handleLocalUpdate);
  }

  try {
    const q = query(assetsCollection(courseId), orderBy("createdAt", "desc"));
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (unsubscribed) return;
        const assets = snapshot.docs.map((d) => toSavedAsset(d.id, d.data()));
        saveLocalAssets(courseId, assets);
        onChange(assets);
      },
      (err) => {
        console.warn("Firestore subscription failed, falling back to localStorage:", err);
        handleLocalUpdate();
      }
    );
  } catch (err) {
    console.warn("Firestore query creation failed, falling back to localStorage:", err);
    handleLocalUpdate();
  }

  return () => {
    unsubscribed = true;
    if (unsubscribeFirestore) unsubscribeFirestore();
    if (typeof window !== "undefined") {
      window.removeEventListener(`campusmind-assets-updated-${courseId}`, handleLocalUpdate);
    }
  };
}

export async function saveAsset(courseId: string, input: SavedAssetInput): Promise<string> {
  const id = `${input.type}-${Date.now()}`;
  try {
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
  } catch (err) {
    console.warn("Firestore saveAsset failed, saving to localStorage instead:", err);
    const localAssets = getLocalAssets(courseId);
    const newAsset: SavedAsset = {
      id,
      type: input.type,
      title: input.title,
      content: input.content,
      audioBase64: input.audioBase64,
      audioMimeType: input.audioMimeType,
      sourceCount: input.sourceCount ?? 0,
      score: input.score,
      createdAt: new Date(),
    };
    saveLocalAssets(courseId, [newAsset, ...localAssets]);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(`campusmind-assets-updated-${courseId}`));
    }
    return id;
  }
}

export async function deleteAsset(courseId: string, assetId: string): Promise<void> {
  try {
    await deleteDoc(doc(assetsCollection(courseId), assetId));
  } catch (err) {
    console.warn("Firestore deleteAsset failed, deleting from localStorage instead:", err);
    const localAssets = getLocalAssets(courseId);
    const updated = localAssets.filter((a) => a.id !== assetId);
    saveLocalAssets(courseId, updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(`campusmind-assets-updated-${courseId}`));
    }
  }
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

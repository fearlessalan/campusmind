"use client";

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAI, VertexAIBackend } from "firebase/ai";

type CampusFirebaseConfig = FirebaseOptions & { firestoreDatabaseId?: string };

function getFirebaseConfig(): CampusFirebaseConfig {
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID,
    };
  }

  if (typeof window === "undefined") {
    return {
      apiKey: "build-placeholder",
      authDomain: "placeholder.firebaseapp.com",
      projectId: "placeholder",
    };
  }

  throw new Error(
    "Configuration Firebase manquante. Définissez NEXT_PUBLIC_FIREBASE_* dans .env.local."
  );
}

const firebaseConfig = getFirebaseConfig();

export const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const aiLogic = getAI(app, { backend: new VertexAIBackend("us-central1") });

export { signInWithPopup, signOut };

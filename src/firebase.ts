import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAI, GoogleAIBackend } from "firebase/ai";
import firebaseConfig from "../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firebase AI Logic — Gemini Developer API (pas de permissions Vertex IAM requises)
export const aiLogic = getAI(app, { backend: new GoogleAIBackend() });

export { signInWithPopup, signOut };

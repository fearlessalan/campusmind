"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { auth, googleProvider, signInWithPopup } from "@/firebase";
import Logo from "@/components/Logo";

export default function LoginScreen() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col items-center space-y-2 mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CampusMind</h1>
          <Logo size={64} />
          <p className="text-sm text-slate-500 text-center">
            Transformez vos documents académiques en parcours d&apos;apprentissage personnalisés.
          </p>
        </div>

        <div className="space-y-4">
          {authError && (
            <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl font-mono text-center">
              {authError}
            </div>
          )}

          <p className="text-xs text-slate-500 text-center mb-2">
            Connectez-vous en un clic avec votre compte Google universitaire ou personnel pour sécuriser vos documents d&apos;étude personnalisés.
          </p>

          <button
            onClick={async () => {
              setAuthLoading(true);
              setAuthError(null);
              try {
                await signInWithPopup(auth, googleProvider);
              } catch (err: unknown) {
                console.error("Google SSO error: ", err);
                const message = err instanceof Error ? err.message : "Une erreur est survenue lors de la connexion Google.";
                setAuthError(message);
              } finally {
                setAuthLoading(false);
              }
            }}
            disabled={authLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            {authLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 mr-0.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 1.83 15.44 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.556-4.435 10.556-10.74 0-.72-.078-1.27-.172-1.815V10.285z" />
                </svg>
                Se connecter avec Google
              </>
            )}
          </button>
        </div>
      </div>
      <div className="text-[10px] text-slate-400 font-mono mt-6 text-center">
        CampusMind • Propulsé par Gemini • Données sécurisées
      </div>
    </div>
  );
}

# CampusMind

Transformez vos documents académiques en parcours d'apprentissage personnalisés, propulsés par Gemini et Firebase.

## Lancer en local

**Prérequis :** Node.js

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Copier `.env.example` vers `.env` et renseigner :
   - `GEMINI_API_KEY` — clé API Gemini pour le serveur
   - `NEXT_PUBLIC_FIREBASE_*` — configuration Firebase (Auth + Firestore)
3. Démarrer l'application :
   ```bash
   npm run dev
   ```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

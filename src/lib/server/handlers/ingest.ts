import type { NextRequest } from "next/server";
import { Type } from "@google/genai";
import { getUserData, writeUserData } from "../db";
import { getGemini } from "../gemini";
import { LANG_FR } from "../lang";
import { errorResponse, jsonResponse } from "../response";

export async function handleIngest(req: NextRequest) {
  const { fileName, fileType, fileContent, manualText, preChunks, fileSize } = await req.json();
  const userData = getUserData(req);
  if (!userData.documents) userData.documents = [];

  try {
    if (preChunks && Array.isArray(preChunks) && preChunks.length > 0) {
      const docId = "doc-" + Date.now();
      const extractedChunks = preChunks.map(
        (c: { source?: string; page?: string; chapter?: string; content: string }, index: number) => ({
          id: `chunk-ai-${Date.now()}-${index}`,
          source: c.source || fileName,
          page: c.page || `Page ${index + 1}`,
          chapter: c.chapter || "Vue d'ensemble",
          content: c.content,
        })
      );

      const newDoc = {
        id: docId,
        name: fileName,
        contentType: fileType || "application/octet-stream",
        size: fileSize ?? 0,
        uploadDate: new Date().toISOString(),
        chunks: extractedChunks,
      };

      userData.documents.push(newDoc);
      writeUserData(req, userData);
      return jsonResponse({ success: true, document: newDoc });
    }

    if (manualText) {
      const docId = "doc-" + Date.now();
      const paragraphs = manualText.split("\n\n").filter(Boolean);
      const chunks = paragraphs.map((para: string, i: number) => ({
        id: `chunk-${docId}-${i}`,
        source: fileName || "notes_manuelles.txt",
        page: `Page ${Math.ceil((i + 1) / 2)}`,
        chapter: "Notes manuelles",
        content: para.trim(),
      }));

      const newDoc = {
        id: docId,
        name: fileName || "notes_manuelles.txt",
        contentType: "text/plain",
        size: manualText.length,
        uploadDate: new Date().toISOString(),
        chunks,
      };

      userData.documents.push(newDoc);
      writeUserData(req, userData);
      return jsonResponse({ success: true, document: newDoc });
    }

    if (fileContent && fileContent.includes("base64,")) {
      const fileData = fileContent.split("base64,")[1];
      const mime = fileType || "application/pdf";

      const ai = getGemini();
      const prompt = `Tu es l'assistant d'ingestion CampusMind, expert en OCR, transcription académique et découpage sémantique.
Traite le fichier académique joint :
1. Extrais le texte en haute définition (OCR sur manuscrits, images ou figures).
2. Nettoie la structure, corrige les fautes et découpe sémantiquement le document.
3. Organise le texte en segments de 1 à 3 paragraphes pédagogiques.
4. Pour CHAQUE segment, définis :
   - "source" : nom exact du fichier "${fileName}"
   - "page" : numéro logique (ex. "Page 1", "Page 2")
   - "chapter" : titre de chapitre ou section en français
   - "content" : contenu académique transcrit

Réponds UNIQUEMENT en JSON valide avec un tableau "chunks". Pas de markdown.${LANG_FR}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ inlineData: { mimeType: mime, data: fileData } }, prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chunks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    page: { type: Type.STRING },
                    chapter: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  required: ["source", "page", "chapter", "content"],
                },
              },
            },
            required: ["chunks"],
          },
        },
      });

      const parsedResult = JSON.parse(response.text || '{"chunks": []}');
      const extractedChunks = parsedResult.chunks.map(
        (c: { source?: string; page?: string; chapter?: string; content: string }, index: number) => ({
          id: `chunk-ai-${Date.now()}-${index}`,
          source: c.source || fileName,
          page: c.page || `Page ${index + 1}`,
          chapter: c.chapter || "Vue d'ensemble",
          content: c.content,
        })
      );

      const docId = "doc-" + Date.now();
      const newDoc = {
        id: docId,
        name: fileName,
        contentType: mime,
        size: Math.round(fileData.length * 0.75),
        uploadDate: new Date().toISOString(),
        chunks: extractedChunks,
      };

      userData.documents.push(newDoc);
      writeUserData(req, userData);
      return jsonResponse({ success: true, document: newDoc });
    }

    return errorResponse("Aucun contenu texte ou fichier reçu.");
  } catch (error: unknown) {
    console.error("Ingestion failed:", error);
    const message = error instanceof Error ? error.message : "Échec de l'ingestion du document.";
    return errorResponse(message, 500);
  }
}

import type { NextRequest } from "next/server";
import { getUserData } from "../db";
import { getGemini } from "../gemini";
import { LANG_FR } from "../lang";
import { errorResponse, jsonResponse } from "../response";

export async function handleChat(req: NextRequest) {
  const { messages, selectedDocId } = await req.json();
  const db = await getUserData(req);

  try {
    const ai = getGemini();

    let allChunks = (db.documents as { chunks: unknown[] }[]).flatMap((d) => d.chunks);
    if (selectedDocId) {
      const selectedDoc = (db.documents as { id: string; chunks: unknown[] }[]).find(
        (d) => d.id === selectedDocId
      );
      if (selectedDoc) {
        allChunks = selectedDoc.chunks;
      }
    }

    if (allChunks.length === 0) {
      return jsonResponse({
        role: "assistant",
        content:
          "Votre base de connaissances est vide. Importez des documents ou saisissez des notes pour commencer à discuter avec vos cours.",
        citations: [],
      });
    }

    const latestUserMsg = messages[messages.length - 1]?.content || "";
    const queryWords = latestUserMsg.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

    const matchScores = (
      allChunks as { content: string; chapter: string; source: string }[]
    ).map((chunk) => {
      let score = 0;
      const text = (chunk.content + " " + chunk.chapter + " " + chunk.source).toLowerCase();
      queryWords.forEach((word: string) => {
        if (text.includes(word)) score += 1;
      });
      return { chunk, score };
    });

    const relevantMatches = matchScores
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.chunk);

    const contextChunks =
      relevantMatches.length > 0 ? relevantMatches : allChunks.slice(0, 3);

    const contextPrompt = (
      contextChunks as { source: string; chapter: string; page: string; content: string }[]
    )
      .map(
        (c, idx) => `
[Source #${idx + 1}]
File: ${c.source}
Chapter: ${c.chapter}
Location: ${c.page}
Content: ${c.content}
`
      )
      .join("\n");

    const chatPrompt = `Tu es CampusMind, un conseiller académique IA expert.
Réponds à la question de l'étudiant en t'appuyant UNIQUEMENT sur les sources ci-dessous.

Consignes :
- Explique les concepts complexes avec clarté et pédagogie.
- Chaque affirmation importante doit citer sa source : (Source : [Fichier] [Emplacement]).
- Ne fabrique pas de faits externes.
- Formate ta réponse en Markdown.

Sources :
${contextPrompt}

Historique :
${messages
  .slice(-5)
  .map((m: { role: string; content: string }) => `${m.role === "user" ? "Étudiant" : "CampusMind"}: ${m.content}`)
  .join("\n")}
Étudiant : ${latestUserMsg}
CampusMind :${LANG_FR}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatPrompt,
    });

    return jsonResponse({
      role: "assistant",
      content:
        result.text || "Je n'ai pas pu traiter cette question. Pouvez-vous la reformuler ?",
      citations: contextChunks,
    });
  } catch (error: unknown) {
    console.error("Chat API failed:", error);
    const message = error instanceof Error ? error.message : "Erreur du chat de recherche.";
    return errorResponse(message, 500);
  }
}

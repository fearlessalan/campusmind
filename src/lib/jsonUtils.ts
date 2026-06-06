export function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function tryParseJson<T>(text: string): T {
  const cleaned = stripJsonFences(text);
  if (!cleaned) throw new Error("Réponse vide du modèle");

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstErr) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        // fall through
      }
    }
    const hint = firstErr instanceof Error ? firstErr.message : "JSON invalide";
    throw new Error(`Réponse JSON invalide ou tronquée : ${hint}`);
  }
}

export function safeParseJson<T>(text: string, fallback: T): T {
  try {
    return tryParseJson<T>(text);
  } catch {
    return fallback;
  }
}

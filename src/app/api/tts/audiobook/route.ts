import { handleAudiobookTts } from "@/lib/server/handlers/media";

export async function POST(req: Request) {
  return handleAudiobookTts(req as import("next/server").NextRequest);
}

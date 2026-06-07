import { handleAudiobookStructure } from "@/lib/server/handlers/media";

export async function GET(req: Request) {
  return handleAudiobookStructure(req as import("next/server").NextRequest);
}

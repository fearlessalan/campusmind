import { handlePodcastTts } from "@/lib/server/handlers/media";

export async function POST(req: Request) {
  return handlePodcastTts(req as import("next/server").NextRequest);
}

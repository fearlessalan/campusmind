import { handlePodcastScript } from "@/lib/server/handlers/media";

export async function GET(req: Request) {
  return handlePodcastScript(req as import("next/server").NextRequest);
}

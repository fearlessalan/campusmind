import { handleTts } from "@/lib/server/handlers/media";

export async function POST(req: Request) {
  return handleTts(req as import("next/server").NextRequest);
}

import { handleSaveCurriculum } from "@/lib/server/handlers/training";

export async function POST(req: Request) {
  return handleSaveCurriculum(req as import("next/server").NextRequest);
}

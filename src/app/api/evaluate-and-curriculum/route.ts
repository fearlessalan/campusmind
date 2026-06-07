import { handleEvaluateAndCurriculum } from "@/lib/server/handlers/training";

export async function POST(req: Request) {
  return handleEvaluateAndCurriculum(req as import("next/server").NextRequest);
}

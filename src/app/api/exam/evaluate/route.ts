import { handleEvaluateExam } from "@/lib/server/handlers/exam";

export async function POST(req: Request) {
  return handleEvaluateExam(req as import("next/server").NextRequest);
}

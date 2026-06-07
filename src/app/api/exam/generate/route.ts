import { handleGenerateExam } from "@/lib/server/handlers/exam";

export async function GET(req: Request) {
  return handleGenerateExam(req as import("next/server").NextRequest);
}

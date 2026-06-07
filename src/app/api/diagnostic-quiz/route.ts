import { handleDiagnosticQuiz } from "@/lib/server/handlers/training";

export async function GET(req: Request) {
  return handleDiagnosticQuiz(req as import("next/server").NextRequest);
}

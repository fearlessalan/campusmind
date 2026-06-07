import { handleSaveGrading } from "@/lib/server/handlers/exam";

export async function POST(req: Request) {
  return handleSaveGrading(req as import("next/server").NextRequest);
}

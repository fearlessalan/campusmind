import { handleRecordScore } from "@/lib/server/handlers/module";

export async function POST(req: Request) {
  return handleRecordScore(req as import("next/server").NextRequest);
}

import { handleResetPerformance } from "@/lib/server/handlers/db-handlers";

export async function POST(req: Request) {
  return handleResetPerformance(req as import("next/server").NextRequest);
}

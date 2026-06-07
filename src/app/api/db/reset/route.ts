import { handleResetDb } from "@/lib/server/handlers/db-handlers";

export async function POST(req: Request) {
  return handleResetDb(req as import("next/server").NextRequest);
}

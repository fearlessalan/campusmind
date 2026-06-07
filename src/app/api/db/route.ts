import { handleGetDb } from "@/lib/server/handlers/db-handlers";

export async function GET(req: Request) {
  return handleGetDb(req as import("next/server").NextRequest);
}

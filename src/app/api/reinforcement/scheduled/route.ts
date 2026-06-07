import { handleReinforcementScheduled } from "@/lib/server/handlers/training";

export async function GET(req: Request) {
  return handleReinforcementScheduled(req as import("next/server").NextRequest);
}

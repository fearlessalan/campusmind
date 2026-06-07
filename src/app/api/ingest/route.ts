import { handleIngest } from "@/lib/server/handlers/ingest";

export const maxDuration = 120;

export async function POST(req: Request) {
  return handleIngest(req as import("next/server").NextRequest);
}

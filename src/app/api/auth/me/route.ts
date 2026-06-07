import { handleMe } from "@/lib/server/handlers/auth";

export async function GET(req: Request) {
  return handleMe(req as import("next/server").NextRequest);
}

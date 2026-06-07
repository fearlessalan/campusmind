import { handleLogin } from "@/lib/server/handlers/auth";

export async function POST(req: Request) {
  return handleLogin(req as import("next/server").NextRequest);
}

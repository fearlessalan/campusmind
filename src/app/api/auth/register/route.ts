import { handleRegister } from "@/lib/server/handlers/auth";

export async function POST(req: Request) {
  return handleRegister(req as import("next/server").NextRequest);
}

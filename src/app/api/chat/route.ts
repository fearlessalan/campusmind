import { handleChat } from "@/lib/server/handlers/chat";

export async function POST(req: Request) {
  return handleChat(req as import("next/server").NextRequest);
}

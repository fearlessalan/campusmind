import { handleGetLesson } from "@/lib/server/handlers/module";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetLesson(req as import("next/server").NextRequest, id);
}

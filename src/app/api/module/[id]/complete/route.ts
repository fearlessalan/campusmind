import { handleCompleteModule } from "@/lib/server/handlers/module";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleCompleteModule(req as import("next/server").NextRequest, id);
}

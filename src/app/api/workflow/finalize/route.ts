import { handleWorkflowFinalize } from "@/lib/server/handlers/workflow";

export async function POST(req: Request) {
  return handleWorkflowFinalize(req as import("next/server").NextRequest);
}

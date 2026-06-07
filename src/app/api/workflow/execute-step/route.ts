import { handleWorkflowExecuteStep } from "@/lib/server/handlers/workflow";

export async function POST(req: Request) {
  return handleWorkflowExecuteStep(req as import("next/server").NextRequest);
}

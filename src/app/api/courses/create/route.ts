import { handleCreateCourse } from "@/lib/server/handlers/courses";

export async function POST(req: Request) {
  return handleCreateCourse(req as import("next/server").NextRequest);
}

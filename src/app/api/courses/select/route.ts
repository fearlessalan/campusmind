import { handleSelectCourse } from "@/lib/server/handlers/courses";

export async function POST(req: Request) {
  return handleSelectCourse(req as import("next/server").NextRequest);
}

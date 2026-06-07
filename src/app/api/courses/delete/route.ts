import { handleDeleteCourse } from "@/lib/server/handlers/courses";

export async function POST(req: Request) {
  return handleDeleteCourse(req as import("next/server").NextRequest);
}

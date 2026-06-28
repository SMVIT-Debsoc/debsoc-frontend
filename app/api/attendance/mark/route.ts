import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { markAttendance } from "@/lib/server/sessions/attendance-service";
import { markAttendanceSchema } from "@/lib/server/validations/session-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = markAttendanceSchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid attendance mark payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await markAttendance(parsed.data));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Attendance mark failed", 400);
  }
}

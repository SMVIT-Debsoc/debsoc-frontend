import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { prepareAttendance } from "@/lib/server/sessions/attendance-service";
import { attendancePreparationSchema } from "@/lib/server/validations/session-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = attendancePreparationSchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid attendance prepare payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await prepareAttendance(parsed.data));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Attendance prepare failed", 400);
  }
}

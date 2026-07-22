import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { getSelfAttendance } from "@/lib/server/sessions/dashboard-service";
import { demoAttendance, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET() {
  const guard = await requireSessionUser({
    roles: ["Member", "cabinet", "President", "TechHead"],
    requireVerified: true,
  });
  if ("response" in guard) return guard.response;

  if (isDemoDataEnabled()) return ok(demoAttendance(guard.user.role === "TechHead" ? "Member" : guard.user.role, guard.user.id));

  return ok(await getSelfAttendance(guard.user.role, guard.user.id));
}

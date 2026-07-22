import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { getDashboardBootstrap } from "@/lib/server/sessions/dashboard-service";
import { demoBootstrap, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET() {
  const guard = await requireSessionUser({
    roles: ["cabinet", "President", "TechHead"],
    requireVerified: true,
  });
  if ("response" in guard) return guard.response;

  if (isDemoDataEnabled()) return ok(demoBootstrap());

  return ok(await getDashboardBootstrap());
}

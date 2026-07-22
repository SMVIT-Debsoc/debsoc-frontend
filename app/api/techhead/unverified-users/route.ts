import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { getUnverifiedUsers } from "@/lib/server/debsoc-service";
import { demoVerificationUsers, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["TechHead"] });
  if ("response" in guard) return guard.response;

  if (isDemoDataEnabled()) return ok(demoVerificationUsers().unverified);

  return ok(await getUnverifiedUsers());
}

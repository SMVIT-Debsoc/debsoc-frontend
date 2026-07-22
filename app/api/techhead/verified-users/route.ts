import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { getVerifiedUsers } from "@/lib/server/debsoc-service";
import { demoVerificationUsers, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["TechHead"] });
  if ("response" in guard) return guard.response;

  if (isDemoDataEnabled()) return ok(demoVerificationUsers().verified);

  return ok(await getVerifiedUsers());
}

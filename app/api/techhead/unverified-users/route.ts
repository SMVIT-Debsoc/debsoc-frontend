import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { getUnverifiedUsers } from "@/lib/server/debsoc-service";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["TechHead"] });
  if ("response" in guard) return guard.response;

  return ok(await getUnverifiedUsers());
}

import { requireSessionUser } from "@/lib/server/guards";
import { ok } from "@/lib/server/http";
import { getParticipantProgressSummaries } from "@/lib/server/scoring/leaderboard-service";
import { demoProgressSummaries, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET() {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  if (isDemoDataEnabled()) return ok(demoProgressSummaries());
  return ok(await getParticipantProgressSummaries());
}

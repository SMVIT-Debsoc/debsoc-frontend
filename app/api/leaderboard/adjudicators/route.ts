import { requireSessionUser } from "@/lib/server/guards";
import { ok } from "@/lib/server/http";
import { recomputeAdjudicatorLeaderboard } from "@/lib/server/scoring/leaderboard-service";
import { demoAdjudicatorLeaderboard, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET() {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President", "TechHead"] });
  if ("response" in sessionResult) return sessionResult.response;
  if (isDemoDataEnabled()) return ok(demoAdjudicatorLeaderboard);
  return ok(await recomputeAdjudicatorLeaderboard());
}

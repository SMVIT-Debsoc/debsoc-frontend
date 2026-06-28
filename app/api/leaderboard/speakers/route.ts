import { requireSessionUser } from "@/lib/server/guards";
import { ok } from "@/lib/server/http";
import { recomputeSpeakerLeaderboard } from "@/lib/server/scoring/leaderboard-service";

export async function GET() {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President", "TechHead"] });
  if ("response" in sessionResult) return sessionResult.response;
  return ok(await recomputeSpeakerLeaderboard());
}

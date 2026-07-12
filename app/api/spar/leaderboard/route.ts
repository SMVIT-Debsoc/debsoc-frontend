import { requireSessionUser } from "@/lib/server/guards";
import { error, ok } from "@/lib/server/http";
import { getSparLeaderboard } from "@/lib/server/spar/spar-service";
import { sparLeaderboardQuerySchema } from "@/lib/server/validations/spar-validation";

export async function GET(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"], requireVerified: true });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = sparLeaderboardQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return error("Invalid spar leaderboard query", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await getSparLeaderboard(sessionResult.user, parsed.data.page, parsed.data.limit));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Spar leaderboard read failed", 400);
  }
}
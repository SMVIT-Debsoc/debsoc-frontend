import { requireSessionUser } from "@/lib/server/guards";
import { ChairScoringError, submitChairAdjudicatorScore } from "@/lib/server/scoring/chair-scoring-service";
import { error, ok, parseJson } from "@/lib/server/http";
import { chairScoringSchema } from "@/lib/server/validations/scoring-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = chairScoringSchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid chair scoring payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await submitChairAdjudicatorScore({ ...parsed.data, participantId: sessionResult.user.id }));
  } catch (caught) {
    const status = caught instanceof ChairScoringError && caught.code === "SESSION_ROLE_REQUIRED" ? 403 : 400;
    return error(caught instanceof Error ? caught.message : "Chair scoring failed", status);
  }
}

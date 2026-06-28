import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { SpeakerScoringError, submitSpeakerChairRating } from "@/lib/server/scoring/speaker-scoring-service";
import { speakerScoringSchema } from "@/lib/server/validations/scoring-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = speakerScoringSchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid speaker scoring payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await submitSpeakerChairRating({ ...parsed.data, participantId: sessionResult.user.id }));
  } catch (caught) {
    const status = caught instanceof SpeakerScoringError && caught.code === "SESSION_ROLE_REQUIRED" ? 403 : 400;
    return error(caught instanceof Error ? caught.message : "Speaker scoring failed", status);
  }
}

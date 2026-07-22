import { requireSessionUser } from "@/lib/server/guards";
import { error, ok } from "@/lib/server/http";
import { getParticipantProgressProfile } from "@/lib/server/scoring/leaderboard-service";
import { participantIdParamSchema } from "@/lib/server/validations/session-validation";
import { demoProgressProfile, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET(_: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = participantIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid participant id", 400, { issues: parsedParams.error.flatten() });
  if (sessionResult.user.role === "Member" && sessionResult.user.id !== parsedParams.data.participantId) {
    return error("Forbidden: Members may only view their own progress profile.", 403);
  }
  if (isDemoDataEnabled()) return ok({ ...demoProgressProfile, participantId: parsedParams.data.participantId });
  try { return ok(await getParticipantProgressProfile(parsedParams.data.participantId)); } catch (caught) { return error(caught instanceof Error ? caught.message : "Progress profile read failed", 404); }
}

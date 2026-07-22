import { requireSessionUser } from "@/lib/server/guards";
import { error, ok } from "@/lib/server/http";
import { getSessionScoringStatus } from "@/lib/server/sessions/session-service";
import { sessionIdParamSchema } from "@/lib/server/validations/session-validation";
import { DEMO_MEMBER_ID, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President", "TechHead"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = sessionIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid session id", 400, { issues: parsedParams.error.flatten() });
  if (isDemoDataEnabled()) {
    return ok({
      sessionId: parsedParams.data.sessionId,
      scoringStatus: "partial",
      tasks: [{ participantId: DEMO_MEMBER_ID, sessionRole: "speaker", hasSubmitted: false }],
    });
  }
  try {
    return ok(await getSessionScoringStatus({ sessionId: parsedParams.data.sessionId, viewerId: sessionResult.user.id, viewerRole: sessionResult.user.role }));
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Scoring status read failed";
    return error(message, message.startsWith("Forbidden") ? 403 : 404);
  }
}

import { requireSessionUser } from "@/lib/server/guards";
import { error, ok } from "@/lib/server/http";
import { getPublishedPairing } from "@/lib/server/pairing/publish";
import { resolveParticipantNames } from "@/lib/server/pairing/participant-name-lookup";
import { pairingSessionIdParamSchema } from "@/lib/server/validations/pairing-validation";
import { demoPublishedPairing, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = pairingSessionIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid session id", 400, { issues: parsedParams.error.flatten() });
  if (isDemoDataEnabled()) return ok(demoPublishedPairing(parsedParams.data.sessionId));
  try {
    const result = await getPublishedPairing(parsedParams.data.sessionId);
    const participantNames = await resolveParticipantNames(result.publishedPairing);
    return ok({ ...result, participantNames });
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Published pairing read failed", 404);
  }
}

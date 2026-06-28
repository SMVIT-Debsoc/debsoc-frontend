import { requireSessionUser } from "@/lib/server/guards";
import { error, ok } from "@/lib/server/http";
import { getPublishedPairing } from "@/lib/server/pairing/publish";
import { pairingSessionIdParamSchema } from "@/lib/server/validations/pairing-validation";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = pairingSessionIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid session id", 400, { issues: parsedParams.error.flatten() });
  try { return ok(await getPublishedPairing(parsedParams.data.sessionId)); } catch (caught) { return error(caught instanceof Error ? caught.message : "Published pairing read failed", 404); }
}

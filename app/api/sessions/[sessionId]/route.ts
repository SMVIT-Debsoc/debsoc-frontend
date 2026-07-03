import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { cancelSession, getSessionPreparationContext, updateSessionLifecycleState } from "@/lib/server/sessions/session-service";
import { sessionIdParamSchema, updateSessionSchema } from "@/lib/server/validations/session-validation";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = sessionIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid session id", 400, { issues: parsedParams.error.flatten() });
  try { return ok(await getSessionPreparationContext(parsedParams.data.sessionId)); } catch (caught) { return error(caught instanceof Error ? caught.message : "Session read failed", 404); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = sessionIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid session id", 400, { issues: parsedParams.error.flatten() });
  const parsedBody = updateSessionSchema.safeParse(await parseJson(request));
  if (!parsedBody.success) return error("Invalid session update payload", 400, { issues: parsedBody.error.flatten() });
  try { return ok(await updateSessionLifecycleState({ sessionId: parsedParams.data.sessionId, ...parsedBody.data })); } catch (caught) { return error(caught instanceof Error ? caught.message : "Session update failed", 400); }
}


export async function DELETE(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = sessionIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid session id", 400, { issues: parsedParams.error.flatten() });
  try {
    await cancelSession(parsedParams.data.sessionId);
    return ok({ sessionId: parsedParams.data.sessionId, cancelled: true });
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Session cancel failed", 400);
  }
}

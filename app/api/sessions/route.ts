import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { createSession } from "@/lib/server/sessions/session-service";
import { createSessionSchema } from "@/lib/server/validations/session-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = createSessionSchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid session create payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await createSession({ ...parsed.data, chair: parsed.data.chair ?? sessionResult.user.name }));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Session create failed", 400);
  }
}

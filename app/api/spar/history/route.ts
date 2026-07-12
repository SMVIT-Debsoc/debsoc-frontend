import { requireSessionUser } from "@/lib/server/guards";
import { error, ok } from "@/lib/server/http";
import { getSparHistory } from "@/lib/server/spar/spar-service";
import { sparHistoryQuerySchema } from "@/lib/server/validations/spar-validation";

export async function GET(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"], requireVerified: true });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = sparHistoryQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return error("Invalid spar history query", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await getSparHistory(sessionResult.user, parsed.data));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Spar history read failed", 400);
  }
}
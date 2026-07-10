import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { submitSpar } from "@/lib/server/spar/spar-service";
import { submitSparSchema } from "@/lib/server/validations/spar-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"], requireVerified: true });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = submitSparSchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid spar submit payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await submitSpar({ ...parsed.data, sparDate: parsed.data.sparDate.toISOString() }, sessionResult.user), { status: 201 });
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Spar submission failed", 400);
  }
}
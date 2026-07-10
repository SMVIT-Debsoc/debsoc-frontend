import { requireSessionUser } from "@/lib/server/guards";
import { error, ok } from "@/lib/server/http";
import { deleteSpar } from "@/lib/server/spar/spar-service";
import { sparIdParamSchema } from "@/lib/server/validations/spar-validation";

export async function DELETE(_: Request, { params }: { params: Promise<{ sparId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"], requireVerified: true });
  if ("response" in sessionResult) return sessionResult.response;

  const parsedParams = sparIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid spar id", 400, { issues: parsedParams.error.flatten() });

  try {
    return ok(await deleteSpar(parsedParams.data.sparId, sessionResult.user));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Spar delete failed", 404);
  }
}
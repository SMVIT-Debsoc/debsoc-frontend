import { compareStoredEvalReports } from "@/lib/server/eval/regression-checker";
import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { evalCompareSchema } from "@/lib/server/validations/pairing-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["TechHead", "President"] });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = evalCompareSchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid eval compare payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await compareStoredEvalReports(parsed.data));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Eval compare failed", 404);
  }
}

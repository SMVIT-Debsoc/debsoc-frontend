import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { runPairingEval } from "@/lib/server/eval/harness";
import { evalReplaySchema } from "@/lib/server/validations/pairing-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["TechHead", "President"] });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = evalReplaySchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid eval replay payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await runPairingEval(parsed.data));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Eval replay failed", 400);
  }
}

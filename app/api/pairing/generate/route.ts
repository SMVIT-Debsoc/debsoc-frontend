import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { generatePairingProposal } from "@/lib/server/pairing/engine";
import { generatePairingSchema } from "@/lib/server/validations/pairing-validation";

export async function POST(request: Request) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;

  const parsed = generatePairingSchema.safeParse(await parseJson(request));
  if (!parsed.success) return error("Invalid pairing generate payload", 400, { issues: parsed.error.flatten() });

  try {
    return ok(await generatePairingProposal({ ...parsed.data, generatedBy: sessionResult.user.id }));
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Pairing generation failed", 400);
  }
}

import { requireSessionUser } from "@/lib/server/guards";
import { error, ok } from "@/lib/server/http";
import { getProposalView } from "@/lib/server/pairing/review";
import { proposalIdParamSchema } from "@/lib/server/validations/pairing-validation";

export async function GET(_: Request, { params }: { params: Promise<{ proposalId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = proposalIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid proposal id", 400, { issues: parsedParams.error.flatten() });
  try { return ok(await getProposalView(parsedParams.data.proposalId)); } catch (caught) { return error(caught instanceof Error ? caught.message : "Proposal read failed", 404); }
}

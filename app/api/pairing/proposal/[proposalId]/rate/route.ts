import { requireSessionUser } from "@/lib/server/guards";
import { error, ok, parseJson } from "@/lib/server/http";
import { rateProposal } from "@/lib/server/pairing/review";
import { proposalIdParamSchema, rateProposalSchema } from "@/lib/server/validations/pairing-validation";

export async function POST(request: Request, { params }: { params: Promise<{ proposalId: string }> }) {
  const sessionResult = await requireSessionUser({ roles: ["cabinet", "President"] });
  if ("response" in sessionResult) return sessionResult.response;
  const parsedParams = proposalIdParamSchema.safeParse(await params);
  if (!parsedParams.success) return error("Invalid proposal id", 400, { issues: parsedParams.error.flatten() });
  const parsedBody = rateProposalSchema.safeParse(await parseJson(request));
  if (!parsedBody.success) return error("Invalid proposal rating payload", 400, { issues: parsedBody.error.flatten() });
  try { return ok(await rateProposal({ proposalId: parsedParams.data.proposalId, reviewerId: sessionResult.user.id, ...parsedBody.data, notes: parsedBody.data.notes ?? null })); } catch (caught) { return error(caught instanceof Error ? caught.message : "Proposal rating failed", 400); }
}


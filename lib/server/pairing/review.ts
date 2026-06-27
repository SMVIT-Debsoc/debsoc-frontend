import type {
  OverrideProposalPayload,
  PairingProposalSummary,
  PairingProposalView,
  ProposalRatingPayload,
} from "../../../types/pairing.ts";
import { generatePairingProposal } from "./engine.ts";
import type { PairingProposalResult } from "./types.ts";
import { pairingRepository } from "../repositories/pairing-repository.ts";

export class PairingReviewError extends Error {
  code:
    | "PROPOSAL_NOT_FOUND"
    | "PROPOSAL_STATE_CONFLICT"
    | "PROPOSAL_ACTION_CONFLICT"
    | "REGENERATION_CONFLICT";

  constructor(
    code:
      | "PROPOSAL_NOT_FOUND"
      | "PROPOSAL_STATE_CONFLICT"
      | "PROPOSAL_ACTION_CONFLICT"
      | "REGENERATION_CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "PairingReviewError";
    this.code = code;
  }
}

export interface ProposalApprovalResult {
  proposal: PairingProposalSummary;
}

export interface ProposalOverrideResult {
  proposal: PairingProposalView;
}

export interface RegenerateProposalInput {
  proposalId: string;
  reviewerId: string;
  seed?: number;
}

export interface ProposalRatingResult {
  rating: ProposalRatingPayload;
}

interface PairingReviewRepositoryContract {
  approveProposalReviewAction(proposalId: string, reviewerId: string): Promise<PairingProposalSummary>;
  overrideProposalReviewAction(input: {
    proposalId: string;
    reviewerId: string;
    overrideType: string;
    payload: Record<string, unknown>;
    notes: string | null;
  }): Promise<PairingProposalView>;
  recordRegenerateReviewAction(proposalId: string, reviewerId: string): Promise<{ sessionId: string }>;
  upsertProposalRating(input: {
    proposalId: string;
    reviewerId: string;
    rating: number;
    issueTags: string[];
    notes: string | null;
  }): Promise<ProposalRatingPayload>;
}

function mapReviewError(error: unknown): PairingReviewError {
  if (error instanceof PairingReviewError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Unknown pairing review error.";
  if (message.includes("not found")) {
    return new PairingReviewError("PROPOSAL_NOT_FOUND", message);
  }
  if (message.includes("already published") || message.includes("no longer")) {
    return new PairingReviewError("PROPOSAL_ACTION_CONFLICT", message);
  }
  if (message.includes("approvable state")) {
    return new PairingReviewError("PROPOSAL_STATE_CONFLICT", message);
  }
  return new PairingReviewError("REGENERATION_CONFLICT", message);
}

export function createPairingReviewService(
  repository: PairingReviewRepositoryContract = pairingRepository as PairingReviewRepositoryContract,
  regenerate: typeof generatePairingProposal = generatePairingProposal,
) {
  async function approveProposal(proposalId: string, reviewerId: string): Promise<ProposalApprovalResult> {
    try {
      const proposal = await repository.approveProposalReviewAction(proposalId, reviewerId);
      return { proposal };
    } catch (error) {
      throw mapReviewError(error);
    }
  }

  async function overrideProposal(input: OverrideProposalPayload): Promise<ProposalOverrideResult> {
    try {
      const proposal = await repository.overrideProposalReviewAction({
        proposalId: input.proposalId,
        reviewerId: input.reviewerId,
        overrideType: input.overrideType,
        payload: input.payload,
        notes: input.notes,
      });
      return { proposal };
    } catch (error) {
      throw mapReviewError(error);
    }
  }

  async function regenerateProposal(input: RegenerateProposalInput): Promise<PairingProposalResult> {
    try {
      const target = await repository.recordRegenerateReviewAction(input.proposalId, input.reviewerId);
      return regenerate({
        sessionId: target.sessionId,
        generatedBy: input.reviewerId,
        seed: input.seed,
      });
    } catch (error) {
      throw mapReviewError(error);
    }
  }

  async function rateProposal(input: {
    proposalId: string;
    reviewerId: string;
    rating: number;
    issueTags: string[];
    notes: string | null;
  }): Promise<ProposalRatingResult> {
    try {
      const rating = await repository.upsertProposalRating(input);
      return { rating };
    } catch (error) {
      throw mapReviewError(error);
    }
  }

  return {
    approveProposal,
    overrideProposal,
    regenerateProposal,
    rateProposal,
  };
}

export const { approveProposal, overrideProposal, regenerateProposal, rateProposal } = createPairingReviewService();

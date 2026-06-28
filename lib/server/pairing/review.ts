import type {
  OverrideProposalPayload,
  PairingProposalSummary,
  PairingProposalView,
  ProposalRatingPayload,
} from "../../../types/pairing.ts";
import { publishSessionRealtimeEvent } from "../realtime/event-publisher.ts";
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
  getPairingProposalView?(proposalId: string): Promise<PairingProposalView | null>;
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
  publishEvent: typeof publishSessionRealtimeEvent = publishSessionRealtimeEvent,
) {
  async function getProposalView(proposalId: string): Promise<PairingProposalView> {
    const proposal = await repository.getPairingProposalView?.(proposalId);
    if (!proposal) {
      throw new PairingReviewError("PROPOSAL_NOT_FOUND", `Proposal ${proposalId} not found.`);
    }
    return proposal;
  }

  async function approveProposal(proposalId: string, reviewerId: string): Promise<ProposalApprovalResult> {
    try {
      const proposal = await repository.approveProposalReviewAction(proposalId, reviewerId);
      await publishEvent(proposal.sessionId, {
        eventId: `pairing.proposal.approved:${proposal.proposalId}:${proposal.approvedAt ?? proposal.generatedAt}`,
        eventType: "pairing.proposal.approved",
        occurredAt: proposal.approvedAt ?? proposal.generatedAt,
        sessionId: proposal.sessionId,
        proposalId: proposal.proposalId,
        visibility: "ADMIN_ONLY",
        refetchHints: ["session_detail"],
        entityVersion: proposal.approvedAt ?? proposal.generatedAt,
      });
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
      await publishEvent(proposal.summary.sessionId, {
        eventId: `pairing.proposal.overridden:${proposal.summary.proposalId}:${proposal.summary.approvedAt ?? proposal.summary.generatedAt}`,
        eventType: "pairing.proposal.overridden",
        occurredAt: proposal.summary.approvedAt ?? proposal.summary.generatedAt,
        sessionId: proposal.summary.sessionId,
        proposalId: proposal.summary.proposalId,
        visibility: "ADMIN_ONLY",
        refetchHints: ["session_detail"],
        entityVersion: proposal.summary.approvedAt ?? proposal.summary.generatedAt,
      });
      return { proposal };
    } catch (error) {
      throw mapReviewError(error);
    }
  }

  async function regenerateProposal(input: RegenerateProposalInput): Promise<PairingProposalResult> {
    try {
      const target = await repository.recordRegenerateReviewAction(input.proposalId, input.reviewerId);
      const result = await regenerate({
        sessionId: target.sessionId,
        generatedBy: input.reviewerId,
        seed: input.seed,
      });
      if (result.ok) {
        await publishEvent(target.sessionId, {
          eventId: `pairing.proposal.regenerated:${result.proposal.summary.proposalId}:${result.proposal.summary.generatedAt}`,
          eventType: "pairing.proposal.regenerated",
          occurredAt: result.proposal.summary.generatedAt,
          sessionId: target.sessionId,
          proposalId: result.proposal.summary.proposalId,
          visibility: "ADMIN_ONLY",
          refetchHints: ["session_detail"],
          entityVersion: result.proposal.summary.generatedAt,
        });
      }
      return result;
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
      await publishEvent(`proposal:${rating.proposalId}`, {
        eventId: `pairing.proposal.rated:${rating.proposalId}:${rating.reviewerId}:${Date.now()}`,
        eventType: "pairing.proposal.rated",
        occurredAt: new Date().toISOString(),
        sessionId: `proposal:${rating.proposalId}`,
        proposalId: rating.proposalId,
        visibility: "ADMIN_ONLY",
        refetchHints: ["session_detail"],
        entityVersion: rating.proposalId,
      });
      return { rating };
    } catch (error) {
      throw mapReviewError(error);
    }
  }

  return {
    getProposalView,
    approveProposal,
    overrideProposal,
    regenerateProposal,
    rateProposal,
  };
}

export const { getProposalView, approveProposal, overrideProposal, regenerateProposal, rateProposal } = createPairingReviewService();




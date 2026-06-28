import type { PublishPairingResponse, GetPublishedPairingResponse, PublishedPairingView } from "../../../types/pairing.ts";
import { publishSessionRealtimeEvent } from "../realtime/event-publisher.ts";
import { pairingRepository } from "../repositories/pairing-repository.ts";

export class PairingPublishError extends Error {
  code:
    | "PUBLISH_REQUIRES_APPROVAL"
    | "PUBLISH_CONFLICT"
    | "PUBLISHED_PAIRING_NOT_FOUND";

  constructor(
    code:
      | "PUBLISH_REQUIRES_APPROVAL"
      | "PUBLISH_CONFLICT"
      | "PUBLISHED_PAIRING_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "PairingPublishError";
    this.code = code;
  }
}

export interface PublishPairingResult extends PublishPairingResponse {}

interface PairingPublishRepositoryContract {
  publishProposalTransaction(input: { sessionId: string }): Promise<PublishedPairingView>;
  getPublishedPairing(sessionId: string): Promise<PublishedPairingView | null>;
}

function mapPublishError(error: unknown): PairingPublishError {
  if (error instanceof PairingPublishError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Unknown pairing publish error.";
  if (message.includes("No approved proposal")) {
    return new PairingPublishError("PUBLISH_REQUIRES_APPROVAL", message);
  }
  if (message.includes("materialized") || message.includes("already published")) {
    return new PairingPublishError("PUBLISH_CONFLICT", message);
  }
  return new PairingPublishError("PUBLISH_CONFLICT", message);
}

export function createPairingPublishService(
  repository: PairingPublishRepositoryContract = pairingRepository as PairingPublishRepositoryContract,
  publishEvent: typeof publishSessionRealtimeEvent = publishSessionRealtimeEvent,
) {
  async function publishApprovedProposal(sessionId: string): Promise<PublishPairingResult> {
    try {
      const publishedPairing = await repository.publishProposalTransaction({ sessionId });
      try {
        await publishEvent(sessionId, {
          eventId: `pairing.proposal.published:${publishedPairing.proposalId}:${publishedPairing.publishedAt}`,
          eventType: "pairing.proposal.published",
          occurredAt: publishedPairing.publishedAt,
          sessionId,
          proposalId: publishedPairing.proposalId,
          visibility: "MEMBER_SAFE",
          refetchHints: ["published_pairing", "session_detail"],
          entityVersion: publishedPairing.publishedAt,
        });
      } catch (error) {
        console.error("Realtime publish fan-out failed after commit", error);
      }
      return { publishedPairing };
    } catch (error) {
      throw mapPublishError(error);
    }
  }

  async function getPublishedPairing(sessionId: string): Promise<GetPublishedPairingResponse> {
    const publishedPairing = await repository.getPublishedPairing(sessionId);
    if (!publishedPairing) {
      throw new PairingPublishError(
        "PUBLISHED_PAIRING_NOT_FOUND",
        `No published pairing found for session ${sessionId}.`,
      );
    }

    return { publishedPairing };
  }

  return {
    publishApprovedProposal,
    getPublishedPairing,
  };
}

export const { publishApprovedProposal, getPublishedPairing } = createPairingPublishService();

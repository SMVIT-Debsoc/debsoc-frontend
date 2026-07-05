import type { PublishPairingResponse, GetPublishedPairingResponse, PublishedPairingView } from "../../../types/pairing.ts";
import { publishDashboardRealtimeEvent, publishSessionRealtimeEvent } from "../realtime/event-publisher.ts";
import { pairingRepository } from "../repositories/pairing-repository.ts";
import { getOrLoad, invalidateTags } from "../cache/cache.ts";
import { cacheKeys, CACHE_TAGS, CACHE_TTL } from "../cache/keys.ts";

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
  publishDashboardEvent: typeof publishDashboardRealtimeEvent = publishDashboardRealtimeEvent,
) {
  async function publishApprovedProposal(sessionId: string): Promise<PublishPairingResult> {
    try {
      const publishedPairing = await repository.publishProposalTransaction({ sessionId });
      // Invalidate before notifying clients so their event-driven refetch reads
      // fresh data rather than repopulating the cache with a stale value.
      await invalidateTags([CACHE_TAGS.sessions, CACHE_TAGS.progress]);
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
        await publishDashboardEvent({
          eventId: `dashboard.changed:publish:${sessionId}:${publishedPairing.publishedAt}`,
          eventType: "dashboard.changed",
          occurredAt: publishedPairing.publishedAt,
          sessionId: null,
          proposalId: null,
          visibility: "MEMBER_SAFE",
          refetchHints: ["dashboard"],
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

const publishService = createPairingPublishService();

export const { publishApprovedProposal } = publishService;

// Published pairing is the member-facing source of truth and changes only when
// a proposal is (re)published or the session lifecycle changes - both of which
// invalidate the `sessions` tag. Cache it so member dashboards read from Redis.
export const getPublishedPairing: typeof publishService.getPublishedPairing = (sessionId) =>
  getOrLoad(
    cacheKeys.publishedPairing(sessionId),
    { tags: [CACHE_TAGS.sessions], ...CACHE_TTL.published },
    () => publishService.getPublishedPairing(sessionId),
  );
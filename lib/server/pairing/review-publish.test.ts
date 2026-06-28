import test from "node:test";
import assert from "node:assert/strict";

import { createPairingPublishService, PairingPublishError } from "./publish.ts";
import { createPairingReviewService, PairingReviewError } from "./review.ts";

test("publishApprovedProposal rejects publish-before-approval with a machine-readable code", async () => {
  const service = createPairingPublishService({
    publishProposalTransaction: async () => {
      throw new Error("No approved proposal found for session session-1.");
    },
    getPublishedPairing: async () => null,
  });

  await assert.rejects(
    service.publishApprovedProposal("session-1"),
    (error: unknown) => error instanceof PairingPublishError && error.code === "PUBLISH_REQUIRES_APPROVAL",
  );
});

test("getPublishedPairing returns a member-safe read model without admin review context", async () => {
  const service = createPairingPublishService({
    publishProposalTransaction: async () => {
      throw new Error("not used");
    },
    getPublishedPairing: async () => ({
      sessionId: "session-1",
      proposalId: "proposal-1",
      publishedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      motionType: "IR",
      motionText: "THW test published reads",
      rooms: [],
      unassignedParticipants: [],
    }),
  });

  const result = await service.getPublishedPairing("session-1");

  assert.equal("reviewState" in result.publishedPairing, false);
  assert.equal(result.publishedPairing.proposalId, "proposal-1");
});

test("overrideProposal preserves the original proposal and records override intent", async () => {
  let receivedPayload: Record<string, unknown> | null = null;

  const service = createPairingReviewService({
    approveProposalReviewAction: async () => {
      throw new Error("not used");
    },
    overrideProposalReviewAction: async (input) => {
      receivedPayload = input.payload;
      return {
        summary: {
          proposalId: input.proposalId,
          sessionId: "session-1",
          version: 1,
          status: "APPROVED",
          engineVersion: "pairing-engine-v1",
          ruleVersion: "pairing-rules-v1",
          topBandRank: 1,
          proposalScore: 0.9,
          scoreBreakdown: {
            roomBalanceScore: 0.9,
            adjudicatorAverageScore: 0.8,
            chairScore: 0.8,
            teamQualityAggregate: 0.7,
            experienceDistributionAggregate: 0.6,
            totalProposalScore: 0.9,
          },
          generatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
          generatedBy: "cabinet-1",
          approvedAt: new Date("2026-01-01T00:01:00.000Z").toISOString(),
          publishedAt: null,
          isPublishedOfficially: false,
        },
        rooms: [],
        unassignedParticipants: [],
        reviewState: {
          isApproved: true,
          isPublished: false,
          lastAction: "OVERRIDE",
        },
      };
    },
    recordRegenerateReviewAction: async () => ({ sessionId: "session-1" }),
    upsertProposalRating: async () => ({
      proposalId: "proposal-1",
      reviewerId: "cabinet-1",
      rating: 4,
      issueTags: [],
      notes: null,
    }),
  });

  const result = await service.overrideProposal({
    proposalId: "proposal-1",
    reviewerId: "cabinet-1",
    overrideType: "manual_assignment",
    payload: { keepOriginal: true, movedRoomIndex: 2 },
    notes: "Keep original engine output visible and track manual intent.",
  });

  assert.deepEqual(receivedPayload, { keepOriginal: true, movedRoomIndex: 2 });
  assert.equal(result.proposal.summary.proposalId, "proposal-1");
  assert.equal(result.proposal.reviewState.lastAction, "OVERRIDE");
});

test("approveProposal maps stale published actions to a conflict code", async () => {
  const service = createPairingReviewService({
    approveProposalReviewAction: async () => {
      throw new Error("Proposal proposal-1 can no longer be approved because the session is already published.");
    },
    overrideProposalReviewAction: async () => {
      throw new Error("not used");
    },
    recordRegenerateReviewAction: async () => ({ sessionId: "session-1" }),
    upsertProposalRating: async () => ({
      proposalId: "proposal-1",
      reviewerId: "cabinet-1",
      rating: 4,
      issueTags: [],
      notes: null,
    }),
  });

  await assert.rejects(
    service.approveProposal("proposal-1", "cabinet-1"),
    (error: unknown) => error instanceof PairingReviewError && error.code === "PROPOSAL_ACTION_CONFLICT",
  );
});

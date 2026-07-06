import test from "node:test";
import assert from "node:assert/strict";

import { createChairScoringService, ChairScoringError } from "./chair-scoring-service.ts";
import { createLeaderboardService } from "./leaderboard-service.ts";
import { createMetricUpdateService } from "./metric-update-service.ts";
import { createSpeakerScoringService, SpeakerScoringError } from "./speaker-scoring-service.ts";

test("speaker scoring enforces session role gating", async () => {
  const service = createSpeakerScoringService({
    async getPublishedScoringContext() {
      return {
        proposalId: "proposal-1",
        publicationStatus: "PUBLISHED",
        roles: [{ participantId: "member-1", role: "adjudicator", isChair: false }],
        rooms: [],
      };
    },
    async getParticipantTypes() {
      return new Map();
    },
    async getChairFeedbackBySpeaker() {
      return null;
    },
    async createChairFeedbackRecord() {
      return { id: "feedback-1" };
    },
    async getExistingTeamDynamicsRatings() {
      return [];
    },
    async createTeamDynamicsRatings() {
      return { count: 0 };
    },
  } as never);

  await assert.rejects(
    service.submitSpeakerChairRating({
      sessionId: "session-1",
      participantId: "member-1",
      chairScore: 8,
    }),
    (error: unknown) => error instanceof SpeakerScoringError && error.code === "SESSION_ROLE_REQUIRED",
  );
});

test("duplicate speaker submission is idempotent", async () => {
  let writes = 0;
  const service = createSpeakerScoringService({
    async getPublishedScoringContext() {
      return {
        proposalId: "proposal-1",
        publicationStatus: "PUBLISHED",
        roles: [{ participantId: "member-1", role: "speaker", isChair: false }],
        rooms: [
          {
            speakers: [{ participantId: "member-1" }, { participantId: "member-2" }],
            adjudicators: [{ participantId: "chair-1", isChair: true }],
          },
        ],
      };
    },
    async getParticipantTypes() {
      return new Map([
        ["member-1", "member"],
        ["member-2", "member"],
        ["chair-1", "member"],
      ]);
    },
    async getChairFeedbackBySpeaker() {
      return {
        chairMemberId: "chair-1",
        chairCabinetId: null,
        chairPresidentId: null,
        rating: 8,
        notes: null,
      };
    },
    async createChairFeedbackRecord() {
      writes += 1;
      return { id: "feedback-1" };
    },
    async getExistingTeamDynamicsRatings() {
      return [];
    },
    async createTeamDynamicsRatings() {
      writes += 1;
      return { count: 1 };
    },
  } as never);

  const result = await service.submitSpeakerChairRating({
    sessionId: "session-1",
    participantId: "member-1",
    chairScore: 8,
  });

  assert.equal(result.accepted, true);
  assert.equal(writes, 0);
});

test("chair submission is idempotent across adjudicator and speaker score sections", async () => {
  const service = createChairScoringService({
    async getPublishedScoringContext() {
      return {
        proposalId: "proposal-1",
        publicationStatus: "PUBLISHED",
        motionType: "IR",
        roles: [{ participantId: "chair-1", role: "adjudicator", isChair: true }],
        rooms: [
          {
            speakers: [
              { participantId: "speaker-1", teamAssignmentId: "team-og-1", bpPosition: "OG", speakingRole: "PM" },
              { participantId: "speaker-2", teamAssignmentId: "team-og-1", bpPosition: "OG", speakingRole: "DPM" },
            ],
            adjudicators: [
              { participantId: "chair-1", isChair: true },
              { participantId: "adj-1", isChair: false },
            ],
          },
        ],
      };
    },
    async getParticipantTypes() {
      return new Map([
        ["chair-1", "member"],
        ["adj-1", "member"],
        ["speaker-1", "member"],
        ["speaker-2", "member"],
      ]);
    },
    async getExistingAdjudicatorScoreRecords() {
      return [
        {
          adjudicatorMemberId: "adj-1",
          adjudicatorCabinetId: null,
          adjudicatorPresidentId: null,
          rating: 7,
          notes: null,
        },
      ];
    },
    async createAdjudicatorScoreRecords() {
      throw new Error("should not write duplicate adjudicator scores");
    },
    async getExistingSpeakerScoreRecords() {
      return [
        {
          sessionId: "session-1",
          memberId: "speaker-1",
          cabinetId: null,
          presidentId: null,
          teamAssignmentId: "team-og-1",
          bpPosition: "OG",
          speakingRole: "PM",
          rawScore: 75,
          teamResultPoints: 3,
        },
        {
          memberId: "speaker-2",
          cabinetId: null,
          presidentId: null,
          teamAssignmentId: "team-og-1",
          bpPosition: "OG",
          speakingRole: "DPM",
          rawScore: 74,
          teamResultPoints: 3,
        },
      ];
    },
    async createSpeakerScoreRecords() {
      throw new Error("should not write duplicate speaker scores");
    },
  } as never);

  const result = await service.submitChairAdjudicatorScore({
    sessionId: "session-1",
    participantId: "chair-1",
    adjudicatorScores: [{ adjudicatorMemberId: "adj-1", rating: 7 }],
    speakerScores: [
      { memberId: "speaker-1", rawScore: 75, bpPosition: "OG", speakingRole: "PM", teamResultPoints: 3 },
      { memberId: "speaker-2", rawScore: 74, bpPosition: "OG", speakingRole: "DPM", teamResultPoints: 3 },
    ],
  });

  assert.equal(result.accepted, true);
});

test("leaderboards recompute from raw records", async () => {
  const service = createLeaderboardService({
    async getSpeakerLeaderboardRawData() {
      return {
        leaderboard: [
          { participantId: "speaker-1", name: "Alice", score: 150, rank: 1, sessionsCount: 2 },
          { participantId: "speaker-2", name: "Bob", score: 74, rank: 2, sessionsCount: 1 },
        ],
        roundsCount: 2,
      };
    },
    async getAdjudicatorLeaderboardRawData() {
      return [
        { participantId: "adj-1", name: "Casey", score: 8, rank: 1, sessionsCount: 2, adjudicatedCount: 2, chairedCount: 1 },
      ];
    },
  });

  const result = await service.recomputeSpeakerLeaderboard();
  assert.equal(result.leaderboard[0]?.score, 150);
  assert.equal(result.leaderboard[0]?.rank, 1);
});

test("metric update recomputes snapshots from historical speaker evidence", async () => {
  const updates: Array<{ metricKey: string; contextKey: string | null; confidence: number; observationCount: number }> = [];
  const service = createMetricUpdateService({
    async getSpeakerScoreRecordsBySession() {
      return [
        {
          sessionId: "session-1",
          memberId: "speaker-1",
          cabinetId: null,
          presidentId: null,
          teamAssignmentId: "team-og-1",
          bpPosition: "OG",
          speakingRole: "PM",
          rawScore: 75,
          teamResultPoints: 3,
          session: { motionType: "IR", motiontype: "IR" },
        },
      ];
    },
    async getSpeakerScoreRecordsForParticipants() {
      return [
        {
          sessionId: "session-1",
          memberId: "speaker-1",
          cabinetId: null,
          presidentId: null,
          teamAssignmentId: "team-og-1",
          bpPosition: "OG",
          speakingRole: "PM",
          rawScore: 75,
          teamResultPoints: 3,
          session: { motionType: "IR", motiontype: "IR" },
        },
        {
          sessionId: "session-0",
          memberId: "speaker-1",
          cabinetId: null,
          presidentId: null,
          teamAssignmentId: "team-oo-0",
          bpPosition: "OO",
          speakingRole: "LO",
          rawScore: 72,
          teamResultPoints: 2,
          session: { motionType: "IR", motiontype: "IR" },
        },
      ];
    },
    async getChairFeedbackBySession() {
      return [];
    },
    async getAdjudicatorScoreRecordsBySession() {
      return [];
    },
    async getAdjudicatorScoreRecordsForAdjudicators() {
      return [];
    },
    async getTeamDynamicsRatingsBySession() {
      return [];
    },
    async getTeamDynamicsRatingsForParticipants() {
      return [];
    },
    async getChairFeedbackForChairs() {
      return [];
    },
    async getParticipantTypes() {
      return new Map([["speaker-1", "member"]]);
    },
    async upsertMemberMetricSnapshot(input: { metricKey: string; contextKey: string | null; confidence: number; observationCount: number }) {
      updates.push({
        metricKey: input.metricKey,
        contextKey: input.contextKey,
        confidence: input.confidence,
        observationCount: input.observationCount,
      });
      return {};
    },
    async upsertPairMetricSnapshot() {
      return {};
    },
  } as never);

  await service.updateLearnedMetricsFromSession("session-1");

  const totalScoreUpdate = updates
    .filter((update) => update.metricKey === "speaker_total_score")
    .sort((left, right) => right.observationCount - left.observationCount)[0];
  const strengthUpdate = updates.find((update) => update.metricKey === "speaker_strength");
  assert.ok(totalScoreUpdate);
  assert.ok(strengthUpdate);
  assert.equal(totalScoreUpdate?.observationCount, 2);
  assert.ok((totalScoreUpdate?.confidence ?? 0) > 0);
  assert.ok((strengthUpdate?.confidence ?? 0) > 0);
});

test("chair scoring rejects non-chair session participants", async () => {
  const service = createChairScoringService({
    async getPublishedScoringContext() {
      return {
        proposalId: "proposal-1",
        publicationStatus: "PUBLISHED",
        motionType: "IR",
        roles: [{ participantId: "adj-1", role: "adjudicator", isChair: false }],
        rooms: [],
      };
    },
  } as never);

  await assert.rejects(
    service.submitChairAdjudicatorScore({
      sessionId: "session-1",
      participantId: "adj-1",
      adjudicatorScores: [],
      speakerScores: [],
    }),
    (error: unknown) => error instanceof ChairScoringError && error.code === "SESSION_ROLE_REQUIRED",
  );
});


import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
  AdjudicatorLeaderboardEntry,
  LeaderboardEntry,
  ParticipantProgressProfile,
  ParticipantProgressSummary,
} from "../../../types/scoring.ts";
import type { MemberId } from "../../../types/pairing.ts";
import { resolveParticipantId } from "./metrics-repository.ts";

type ScoringRepositoryClient = PrismaClient;

export function createScoringRepository(client: ScoringRepositoryClient = prisma) {
  async function createSpeakerScoreRecords(
    sessionId: string,
    proposalId: string,
    records: Array<{
      participantId: MemberId;
      participantType: "member" | "cabinet" | "president";
      bpPosition: string;
      speakingRole: string;
      rawScore: number;
      teamResultPoints: number;
      scoredByParticipantId: MemberId;
      scoredByParticipantType: "member" | "cabinet" | "president";
    }>,
  ) {
    if (records.length === 0) {
      return { count: 0 };
    }

    return client.speakerScoreRecord.createMany({
      data: records.map((record) => ({
        sessionId,
        proposalId,
        bpPosition: record.bpPosition,
        speakingRole: record.speakingRole,
        rawScore: record.rawScore,
        teamResultPoints: record.teamResultPoints,
        memberId: record.participantType === "member" ? record.participantId : null,
        cabinetId: record.participantType === "cabinet" ? record.participantId : null,
        presidentId: record.participantType === "president" ? record.participantId : null,
        scoredByMemberId: record.scoredByParticipantType === "member" ? record.scoredByParticipantId : null,
        scoredByCabinetId:
          record.scoredByParticipantType === "cabinet" ? record.scoredByParticipantId : null,
        scoredByPresidentId:
          record.scoredByParticipantType === "president" ? record.scoredByParticipantId : null,
      })),
    });
  }

  async function createChairFeedbackRecord(input: {
    sessionId: string;
    proposalId: string;
    speakerParticipantId: MemberId;
    speakerParticipantType: "member" | "cabinet" | "president";
    chairParticipantId: MemberId;
    chairParticipantType: "member" | "cabinet" | "president";
    rating: number;
    notes?: string | null;
  }) {
    return client.chairFeedbackRecord.create({
      data: {
        sessionId: input.sessionId,
        proposalId: input.proposalId,
        speakerMemberId: input.speakerParticipantType === "member" ? input.speakerParticipantId : null,
        speakerCabinetId:
          input.speakerParticipantType === "cabinet" ? input.speakerParticipantId : null,
        speakerPresidentId:
          input.speakerParticipantType === "president" ? input.speakerParticipantId : null,
        chairMemberId: input.chairParticipantType === "member" ? input.chairParticipantId : null,
        chairCabinetId: input.chairParticipantType === "cabinet" ? input.chairParticipantId : null,
        chairPresidentId:
          input.chairParticipantType === "president" ? input.chairParticipantId : null,
        rating: input.rating,
        notes: input.notes ?? null,
      },
      select: {
        id: true,
      },
    });
  }

  async function createAdjudicatorScoreRecords(input: {
    sessionId: string;
    proposalId: string;
    chairParticipantId: MemberId;
    chairParticipantType: "member" | "cabinet" | "president";
    adjudicatorScores: Array<{
      participantId: MemberId;
      participantType: "member" | "cabinet" | "president";
      rating: number;
      notes?: string | null;
    }>;
  }) {
    if (input.adjudicatorScores.length === 0) {
      return { count: 0 };
    }

    return client.adjudicatorScoreRecord.createMany({
      data: input.adjudicatorScores.map((score) => ({
        sessionId: input.sessionId,
        proposalId: input.proposalId,
        chairMemberId: input.chairParticipantType === "member" ? input.chairParticipantId : null,
        chairCabinetId: input.chairParticipantType === "cabinet" ? input.chairParticipantId : null,
        chairPresidentId:
          input.chairParticipantType === "president" ? input.chairParticipantId : null,
        adjudicatorMemberId: score.participantType === "member" ? score.participantId : null,
        adjudicatorCabinetId: score.participantType === "cabinet" ? score.participantId : null,
        adjudicatorPresidentId:
          score.participantType === "president" ? score.participantId : null,
        rating: score.rating,
        notes: score.notes ?? null,
      })),
    });
  }

  async function getSpeakerLeaderboardRawData(): Promise<LeaderboardEntry[]> {
    const rows = await client.speakerScoreRecord.findMany({
      select: {
        memberId: true,
        cabinetId: true,
        presidentId: true,
        rawScore: true,
        member: { select: { name: true } },
        cabinet: { select: { name: true } },
        president: { select: { name: true } },
      },
    });

    const aggregate = new Map<MemberId, { name: string; score: number; sessionsCount: number }>();

    for (const row of rows) {
      const participantId = resolveParticipantId(row);
      if (!participantId) {
        continue;
      }

      const current = aggregate.get(participantId) ?? {
        name: row.member?.name ?? row.cabinet?.name ?? row.president?.name ?? "Unknown Participant",
        score: 0,
        sessionsCount: 0,
      };
      current.score += row.rawScore;
      current.sessionsCount += 1;
      aggregate.set(participantId, current);
    }

    return [...aggregate.entries()]
      .map(([participantId, entry]) => ({ participantId, ...entry }))
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({
        participantId: entry.participantId,
        name: entry.name,
        score: entry.score,
        sessionsCount: entry.sessionsCount,
        rank: index + 1,
      }));
  }

  async function getAdjudicatorLeaderboardRawData(): Promise<AdjudicatorLeaderboardEntry[]> {
    const [adjudicatorRows, chairRows] = await Promise.all([
      client.adjudicatorScoreRecord.findMany({
        select: {
          adjudicatorMemberId: true,
          adjudicatorCabinetId: true,
          adjudicatorPresidentId: true,
          rating: true,
          adjudicatorMember: { select: { name: true } },
          adjudicatorCabinet: { select: { name: true } },
          adjudicatorPresident: { select: { name: true } },
        },
      }),
      client.chairFeedbackRecord.findMany({
        select: {
          chairMemberId: true,
          chairCabinetId: true,
          chairPresidentId: true,
        },
      }),
    ]);

    const aggregate = new Map<
      MemberId,
      { name: string; scoreTotal: number; adjudicatedCount: number; chairedCount: number }
    >();

    for (const row of adjudicatorRows) {
      const participantId = resolveParticipantId({
        memberId: row.adjudicatorMemberId,
        cabinetId: row.adjudicatorCabinetId,
        presidentId: row.adjudicatorPresidentId,
      });
      if (!participantId) {
        continue;
      }

      const current = aggregate.get(participantId) ?? {
        name:
          row.adjudicatorMember?.name ??
          row.adjudicatorCabinet?.name ??
          row.adjudicatorPresident?.name ??
          "Unknown Participant",
        scoreTotal: 0,
        adjudicatedCount: 0,
        chairedCount: 0,
      };
      current.scoreTotal += row.rating;
      current.adjudicatedCount += 1;
      aggregate.set(participantId, current);
    }

    for (const row of chairRows) {
      const participantId = resolveParticipantId({
        memberId: row.chairMemberId,
        cabinetId: row.chairCabinetId,
        presidentId: row.chairPresidentId,
      });
      if (!participantId) {
        continue;
      }

      const current = aggregate.get(participantId) ?? {
        name: "Unknown Participant",
        scoreTotal: 0,
        adjudicatedCount: 0,
        chairedCount: 0,
      };
      current.chairedCount += 1;
      aggregate.set(participantId, current);
    }

    return [...aggregate.entries()]
      .map(([participantId, entry]) => ({
        participantId,
        name: entry.name,
        score: entry.adjudicatedCount === 0 ? 0 : entry.scoreTotal / entry.adjudicatedCount,
        sessionsCount: entry.adjudicatedCount,
        adjudicatedCount: entry.adjudicatedCount,
        chairedCount: entry.chairedCount,
      }))
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }

  async function getParticipantProgressProfile(participantId: MemberId): Promise<ParticipantProgressProfile> {
    const rawMetrics = await client.memberMetricSnapshot.findMany({
      where: {
        OR: [{ memberId: participantId }, { cabinetId: participantId }, { presidentId: participantId }],
      },
      select: {
        metricKey: true,
        contextKey: true,
        value: true,
        observationCount: true,
        confidence: true,
      },
      orderBy: [{ metricKey: "asc" }, { contextKey: "asc" }],
    });

    return {
      participantId,
      rawMetrics,
      verdict: {
        strengths: [],
        weaknesses: [],
        gaps: [],
        roleAptitude: [],
        compatibility: [],
      },
    };
  }

  async function getParticipantProgressSummary(participantId: MemberId): Promise<ParticipantProgressSummary> {
    const metrics: Array<{ metricKey: string; value: number; confidence: number; observationCount: number }> = await client.memberMetricSnapshot.findMany({
      where: {
        OR: [{ memberId: participantId }, { cabinetId: participantId }, { presidentId: participantId }],
      },
      select: {
        metricKey: true,
        value: true,
        confidence: true,
        observationCount: true,
      },
    });

    const byMetric = new Map(metrics.map((metric: (typeof metrics)[number]) => [metric.metricKey, metric]));
    const speakerStrengthConfidence = byMetric.get("speaker_strength")?.confidence ?? 0;

    return {
      participantId,
      speakerTotalScore: byMetric.get("speaker_total_score")?.value ?? 0,
      speakerStrength: byMetric.get("speaker_strength")?.value ?? 0,
      confidence: speakerStrengthConfidence,
      sessionsSpoken: byMetric.get("speaker_total_score")?.observationCount ?? 0,
      sessionsAdjudicated: byMetric.get("adjudicator_average_score")?.observationCount ?? 0,
      sessionsChaired: byMetric.get("chair_score")?.observationCount ?? 0,
      dataMaturity: speakerStrengthConfidence >= 0.8 ? "HIGH" : speakerStrengthConfidence >= 0.4 ? "MEDIUM" : "LOW",
    };
  }

  return {
    createSpeakerScoreRecords,
    createChairFeedbackRecord,
    createAdjudicatorScoreRecords,
    getSpeakerLeaderboardRawData,
    getAdjudicatorLeaderboardRawData,
    getParticipantProgressProfile,
    getParticipantProgressSummary,
  };
}

export const scoringRepository = createScoringRepository();
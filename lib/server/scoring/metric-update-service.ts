import { scoringRepository } from "../repositories/scoring-repository.ts";

type ParticipantType = "member" | "cabinet" | "president";

type SpeakerScoreRow = {
  sessionId: string;
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
  teamAssignmentId: string | null;
  bpPosition: string;
  speakingRole: string;
  rawScore: number;
  teamResultPoints: number;
  session: { motionType: string | null; motiontype: string };
};

type ChairFeedbackRow = {
  chairMemberId: string | null;
  chairCabinetId: string | null;
  chairPresidentId: string | null;
  rating: number;
};

type AdjudicatorScoreRow = {
  adjudicatorMemberId: string | null;
  adjudicatorCabinetId: string | null;
  adjudicatorPresidentId: string | null;
  rating: number;
};

type TeamDynamicsRow = {
  sessionId: string;
  raterMemberId: string | null;
  raterCabinetId: string | null;
  raterPresidentId: string | null;
  teammateMemberId: string | null;
  teammateCabinetId: string | null;
  teammatePresidentId: string | null;
  rating: number;
};

interface MetricRepositoryContract {
  getSpeakerScoreRecordsBySession(sessionId: string): Promise<SpeakerScoreRow[]>;
  getSpeakerScoreRecordsForParticipants(participantIds: string[]): Promise<SpeakerScoreRow[]>;
  getChairFeedbackBySession(sessionId: string): Promise<ChairFeedbackRow[]>;
  getChairFeedbackForChairs(participantIds: string[]): Promise<ChairFeedbackRow[]>;
  getAdjudicatorScoreRecordsBySession(sessionId: string): Promise<AdjudicatorScoreRow[]>;
  getAdjudicatorScoreRecordsForAdjudicators(participantIds: string[]): Promise<AdjudicatorScoreRow[]>;
  getTeamDynamicsRatingsBySession(sessionId: string): Promise<TeamDynamicsRow[]>;
  getTeamDynamicsRatingsForParticipants(participantIds: string[]): Promise<TeamDynamicsRow[]>;
  getParticipantTypes(participantIds: string[]): Promise<Map<string, ParticipantType>>;
  upsertMemberMetricSnapshot(input: {
    participantId: string;
    participantType: ParticipantType;
    metricKey: string;
    contextKey: string | null;
    value: number;
    observationCount: number;
    confidence: number;
  }): Promise<unknown>;
  upsertPairMetricSnapshot(input: {
    memberAId: string;
    memberAType: ParticipantType;
    memberBId: string;
    memberBType: ParticipantType;
    metricKey: string;
    contextKey: string | null;
    value: number;
    observationCount: number;
    confidence: number;
  }): Promise<unknown>;
}

function resolveParticipantId(ref: { memberId?: string | null; cabinetId?: string | null; presidentId?: string | null; chairMemberId?: string | null; chairCabinetId?: string | null; chairPresidentId?: string | null; adjudicatorMemberId?: string | null; adjudicatorCabinetId?: string | null; adjudicatorPresidentId?: string | null; raterMemberId?: string | null; raterCabinetId?: string | null; raterPresidentId?: string | null; teammateMemberId?: string | null; teammateCabinetId?: string | null; teammatePresidentId?: string | null }) {
  return (
    ref.memberId ??
    ref.cabinetId ??
    ref.presidentId ??
    ref.chairMemberId ??
    ref.chairCabinetId ??
    ref.chairPresidentId ??
    ref.adjudicatorMemberId ??
    ref.adjudicatorCabinetId ??
    ref.adjudicatorPresidentId ??
    ref.raterMemberId ??
    ref.raterCabinetId ??
    ref.raterPresidentId ??
    ref.teammateMemberId ??
    ref.teammateCabinetId ??
    ref.teammatePresidentId ??
    ""
  );
}

function computeConfidence(observationCount: number, targetCount: number) {
  if (targetCount <= 0) {
    return 1;
  }
  return Math.min(observationCount / targetCount, 1);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeSpeakerTotal(total: number, sessionCount: number) {
  if (sessionCount === 0) {
    return 0;
  }
  return Math.min(total / (sessionCount * 80), 1);
}

function buildMotionType(row: SpeakerScoreRow) {
  return row.session.motionType ?? row.session.motiontype;
}

function participantIdsFromSpeakerRows(rows: SpeakerScoreRow[]) {
  return [...new Set(rows.map((row) => resolveParticipantId(row)).filter(Boolean))];
}

function participantIdsFromRoleRows(chairFeedback: ChairFeedbackRow[], adjudicatorScores: AdjudicatorScoreRow[]) {
  return [
    ...new Set([
      ...chairFeedback.map((row) => resolveParticipantId(row)).filter(Boolean),
      ...adjudicatorScores.map((row) => resolveParticipantId(row)).filter(Boolean),
    ]),
  ];
}

export function createMetricUpdateService(
  repository: MetricRepositoryContract = scoringRepository as MetricRepositoryContract,
) {
  async function updateLearnedMetricsFromSession(sessionId: string) {
    const sessionSpeakerScores = await repository.getSpeakerScoreRecordsBySession(sessionId);
    const participantIds = participantIdsFromSpeakerRows(sessionSpeakerScores);
    const speakerScores = participantIds.length > 0
      ? await repository.getSpeakerScoreRecordsForParticipants(participantIds)
      : [];
    const participantTypes = await repository.getParticipantTypes(participantIds);

    const grouped = new Map<string, SpeakerScoreRow[]>();
    for (const row of speakerScores) {
      const participantId = resolveParticipantId(row);
      if (!participantId) {
        continue;
      }
      grouped.set(participantId, [...(grouped.get(participantId) ?? []), row]);
    }

    for (const [participantId, rows] of grouped.entries()) {
      const participantType = participantTypes.get(participantId) ?? "member";
      const totalScore = rows.reduce((sum, row) => sum + row.rawScore, 0);
      const motionGroups = new Map<string, number[]>();
      const roleGroups = new Map<string, number[]>();
      const motionRoleGroups = new Map<string, number[]>();

      for (const row of rows) {
        const motionType = buildMotionType(row);
        const role = row.speakingRole;
        motionGroups.set(motionType, [...(motionGroups.get(motionType) ?? []), row.rawScore]);
        roleGroups.set(role, [...(roleGroups.get(role) ?? []), row.rawScore]);
        motionRoleGroups.set(`${motionType}:${role}`, [...(motionRoleGroups.get(`${motionType}:${role}`) ?? []), row.rawScore]);
      }

      const sessionCount = rows.length;
      const meanScore = average(rows.map((row) => row.rawScore));
      const variance = average(rows.map((row) => (row.rawScore - meanScore) ** 2));
      const normalizedVariance = Math.min(variance / (80 ** 2), 1);
      const consistencyScore = Math.max(0, 1 - normalizedVariance);
      const confidenceScore = computeConfidence(sessionCount, 6);
      const speakerStrength =
        0.7 * normalizeSpeakerTotal(totalScore, sessionCount) +
        0.2 * consistencyScore +
        0.1 * confidenceScore;

      await repository.upsertMemberMetricSnapshot({
        participantId,
        participantType,
        metricKey: "speaker_total_score",
        contextKey: null,
        value: totalScore,
        observationCount: sessionCount,
        confidence: computeConfidence(sessionCount, 4),
      });
      await repository.upsertMemberMetricSnapshot({
        participantId,
        participantType,
        metricKey: "speaker_strength",
        contextKey: null,
        value: speakerStrength,
        observationCount: sessionCount,
        confidence: confidenceScore,
      });

      for (const [motionType, values] of motionGroups.entries()) {
        await repository.upsertMemberMetricSnapshot({
          participantId,
          participantType,
          metricKey: "speaker_motion_type_score",
          contextKey: motionType,
          value: average(values),
          observationCount: values.length,
          confidence: computeConfidence(values.length, 4),
        });
      }
      for (const [role, values] of roleGroups.entries()) {
        await repository.upsertMemberMetricSnapshot({
          participantId,
          participantType,
          metricKey: "role_score",
          contextKey: role,
          value: average(values),
          observationCount: values.length,
          confidence: computeConfidence(values.length, 4),
        });
      }
      for (const [motionRole, values] of motionRoleGroups.entries()) {
        await repository.upsertMemberMetricSnapshot({
          participantId,
          participantType,
          metricKey: "motion_type_x_role_score",
          contextKey: motionRole,
          value: average(values),
          observationCount: values.length,
          confidence: computeConfidence(values.length, 6),
        });
      }
    }
  }

  async function updatePairMetricSnapshotsFromSession(sessionId: string) {
    const sessionSpeakerScores = await repository.getSpeakerScoreRecordsBySession(sessionId);
    const participantIds = participantIdsFromSpeakerRows(sessionSpeakerScores);
    const [speakerScores, teamDynamicsRatings] = participantIds.length > 0
      ? await Promise.all([
        repository.getSpeakerScoreRecordsForParticipants(participantIds),
        repository.getTeamDynamicsRatingsForParticipants(participantIds),
      ])
      : [[], []];

    const scoresByPair = new Map<string, { a: string; b: string; typeA: ParticipantType; typeB: ParticipantType; motionType: string; resultPoints: number[]; dynamicsRatings: number[] }>();
    const participantTypes = await repository.getParticipantTypes(participantIds);

    const bySessionBench = new Map<string, SpeakerScoreRow[]>();
    for (const row of speakerScores) {
      const key = row.teamAssignmentId ?? `${row.sessionId}:${row.bpPosition}`;
      bySessionBench.set(key, [...(bySessionBench.get(key) ?? []), row]);
    }

    for (const rows of bySessionBench.values()) {
      if (rows.length < 2) {
        continue;
      }
      const first = rows[0];
      const second = rows[1];
      const firstId = resolveParticipantId(first);
      const secondId = resolveParticipantId(second);
      if (!firstId || !secondId) {
        continue;
      }
      const [a, b] = [firstId, secondId].sort();
      const pairKey = `${a}::${b}`;
      const current = scoresByPair.get(pairKey) ?? {
        a,
        b,
        typeA: participantTypes.get(a) ?? "member",
        typeB: participantTypes.get(b) ?? "member",
        motionType: buildMotionType(first),
        resultPoints: [],
        dynamicsRatings: [],
      };
      current.resultPoints.push(first.teamResultPoints, second.teamResultPoints);
      scoresByPair.set(pairKey, current);
    }

    for (const rating of teamDynamicsRatings) {
      const firstId = resolveParticipantId({
        memberId: rating.raterMemberId,
        cabinetId: rating.raterCabinetId,
        presidentId: rating.raterPresidentId,
      });
      const secondId = resolveParticipantId({
        memberId: rating.teammateMemberId,
        cabinetId: rating.teammateCabinetId,
        presidentId: rating.teammatePresidentId,
      });
      if (!firstId || !secondId) {
        continue;
      }
      const [a, b] = [firstId, secondId].sort();
      const pairKey = `${a}::${b}`;
      const current = scoresByPair.get(pairKey);
      if (current) {
        current.dynamicsRatings.push(rating.rating);
      }
    }

    for (const entry of scoresByPair.values()) {
      const resultObservationCount = Math.max(entry.resultPoints.length / 2, 1);
      const resultAverage = average(entry.resultPoints);
      const dynamicsAverage = entry.dynamicsRatings.length > 0 ? average(entry.dynamicsRatings) / 10 : resultAverage / 3;
      const overall = 0.8 * (resultAverage / 3) + 0.2 * dynamicsAverage;
      const observationCount = resultObservationCount + entry.dynamicsRatings.length;
      await repository.upsertPairMetricSnapshot({
        memberAId: entry.a,
        memberAType: entry.typeA,
        memberBId: entry.b,
        memberBType: entry.typeB,
        metricKey: "partner_dynamics_overall",
        contextKey: null,
        value: overall,
        observationCount,
        confidence: computeConfidence(observationCount, 4),
      });
      await repository.upsertPairMetricSnapshot({
        memberAId: entry.a,
        memberAType: entry.typeA,
        memberBId: entry.b,
        memberBType: entry.typeB,
        metricKey: "partner_dynamics_by_motion_type",
        contextKey: entry.motionType,
        value: overall,
        observationCount,
        confidence: computeConfidence(observationCount, 6),
      });
    }
  }

  async function updateRolePerformanceFromSession(sessionId: string) {
    const [sessionChairFeedback, sessionAdjudicatorScores] = await Promise.all([
      repository.getChairFeedbackBySession(sessionId),
      repository.getAdjudicatorScoreRecordsBySession(sessionId),
    ]);

    const participantIds = participantIdsFromRoleRows(sessionChairFeedback, sessionAdjudicatorScores);
    const [chairFeedback, adjudicatorScores] = participantIds.length > 0
      ? await Promise.all([
        repository.getChairFeedbackForChairs(participantIds),
        repository.getAdjudicatorScoreRecordsForAdjudicators(participantIds),
      ])
      : [[], []];
    // Resolve ids by explicit role fields, never by column order. Both record
    // types carry several *MemberId/*CabinetId/*PresidentId columns, so a
    // positional `resolveParticipantId(row)` can pick the wrong person (e.g. the
    // chair instead of the adjudicator), which then mis-types the participant and
    // corrupts the snapshot write. chair_score keys on the chair (it feeds
    // "sessions chaired"); adjudicator score keys on the adjudicator.
    const chairIdOf = (row: {
      chairMemberId?: string | null;
      chairCabinetId?: string | null;
      chairPresidentId?: string | null;
    }) =>
      resolveParticipantId({
        memberId: row.chairMemberId,
        cabinetId: row.chairCabinetId,
        presidentId: row.chairPresidentId,
      });
    const adjudicatorIdOf = (row: {
      adjudicatorMemberId?: string | null;
      adjudicatorCabinetId?: string | null;
      adjudicatorPresidentId?: string | null;
    }) =>
      resolveParticipantId({
        memberId: row.adjudicatorMemberId,
        cabinetId: row.adjudicatorCabinetId,
        presidentId: row.adjudicatorPresidentId,
      });

    const relevantParticipantIds = [
      ...new Set([
        ...chairFeedback.map(chairIdOf).filter(Boolean),
        ...adjudicatorScores.map(adjudicatorIdOf).filter(Boolean),
      ]),
    ];
    const participantTypes = await repository.getParticipantTypes(relevantParticipantIds);

    const chairGroups = new Map<string, number[]>();
    for (const row of chairFeedback) {
      const participantId = chairIdOf(row);
      if (!participantId) {
        continue;
      }
      chairGroups.set(participantId, [...(chairGroups.get(participantId) ?? []), row.rating]);
    }

    const adjudicatorGroups = new Map<string, number[]>();
    for (const row of adjudicatorScores) {
      const participantId = adjudicatorIdOf(row);
      if (!participantId) {
        continue;
      }
      adjudicatorGroups.set(participantId, [...(adjudicatorGroups.get(participantId) ?? []), row.rating]);
    }

    for (const [participantId, ratings] of chairGroups.entries()) {
      await repository.upsertMemberMetricSnapshot({
        participantId,
        participantType: participantTypes.get(participantId) ?? "member",
        metricKey: "chair_score",
        contextKey: null,
        value: average(ratings),
        observationCount: ratings.length,
        confidence: computeConfidence(ratings.length, 4),
      });
    }

    for (const [participantId, ratings] of adjudicatorGroups.entries()) {
      await repository.upsertMemberMetricSnapshot({
        participantId,
        participantType: participantTypes.get(participantId) ?? "member",
        metricKey: "adjudicator_average_score",
        contextKey: null,
        value: average(ratings),
        observationCount: ratings.length,
        confidence: computeConfidence(ratings.length, 4),
      });
    }
  }

  return {
    updateLearnedMetricsFromSession,
    updatePairMetricSnapshotsFromSession,
    updateRolePerformanceFromSession,
  };
}

export const {
  updateLearnedMetricsFromSession,
  updatePairMetricSnapshotsFromSession,
  updateRolePerformanceFromSession,
} = createMetricUpdateService();


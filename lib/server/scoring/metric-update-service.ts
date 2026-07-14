import { scoringRepository } from "../repositories/scoring-repository.ts";
import { mapApRoleToBpRole } from "../../../types/spar.ts";

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
  sessionId: string;
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

type SparScoreRow = {
  sparRecordId: string;
  sparDate: Date;
  motionType: string;
  debateFormat: string;
  bpPosition: string | null;
  apSide: string | null;
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
  speakingRole: string;
  speakerScore: number;
  teamResultPoints: number;
};

type SparRecordWithScores = {
  id: string;
  motionType: string;
  debateFormat: string;
  bpPosition: string | null;
  apSide: string | null;
  teamResultPoints: number;
  isIronMan: boolean;
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
  teammateMemberId: string | null;
  teammateCabinetId: string | null;
  teammatePresidentId: string | null;
  sparTeammates: Array<{ memberId: string | null; cabinetId: string | null; presidentId: string | null }>;
  sparSpeakerScores: Array<{ speakingRole: string; speakerScore: number }>;
};

type SparPairRow = {
  motionType: string;
  debateFormat: string;
  teamResultPoints: number;
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
  teammateMemberId: string | null;
  teammateCabinetId: string | null;
  teammatePresidentId: string | null;
  sparTeammates: Array<{ memberId: string | null; cabinetId: string | null; presidentId: string | null }>;
};

const SPAR_SPEAKER_METRIC_KEYS = ["speaker_total_score", "speaker_strength", "speaker_motion_type_score", "role_score", "motion_type_x_role_score"] as const;
const SPAR_PAIR_METRIC_KEYS = ["partner_dynamics_overall", "partner_dynamics_by_motion_type"] as const;
const BP_SPAR_WEIGHT = 0.6;
const AP_SPAR_WEIGHT = 0.5;
const AP_ROLE_MAPPING_WEIGHT = 0.35;

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
  getSparSpeakerScoresForParticipants(participantIds: string[]): Promise<SparScoreRow[]>;
  getSparRecordForMetricUpdate(sparRecordId: string): Promise<SparRecordWithScores | null>;
  getSparRecordsByTeammate(participantIdA: string, participantIdB: string): Promise<SparPairRow[]>;
  getChairFeedbackBySession(sessionId: string): Promise<ChairFeedbackRow[]>;
  getChairFeedbackForChairs(participantIds: string[]): Promise<ChairFeedbackRow[]>;
  getAdjudicatorScoreRecordsBySession(sessionId: string): Promise<AdjudicatorScoreRow[]>;
  getAdjudicatorScoreRecordsForAdjudicators(participantIds: string[]): Promise<AdjudicatorScoreRow[]>;
  getTeamDynamicsRatingsBySession(sessionId: string): Promise<TeamDynamicsRow[]>;
  getTeamDynamicsRatingsForParticipants(participantIds: string[]): Promise<TeamDynamicsRow[]>;
  getParticipantTypes(participantIds: string[]): Promise<Map<string, ParticipantType>>;
  deleteMemberMetricSnapshots(input: { participantId: string; participantType: ParticipantType; metricKeys: readonly string[] }): Promise<unknown>;
  deletePairMetricSnapshots(input: { memberAId: string; memberAType: ParticipantType; memberBId: string; memberBType: ParticipantType; metricKeys: readonly string[] }): Promise<unknown>;
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
      // docs/09 Fo4: consistency_score = 1 / (1 + normalized_standard_deviation),
      // with the raw-score scale (80) as the normalization base.
      const normalizedStandardDeviation = Math.sqrt(variance) / 80;
      const consistencyScore = 1 / (1 + normalizedStandardDeviation);
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
    const speakerScores = participantIds.length > 0
      ? await repository.getSpeakerScoreRecordsForParticipants(participantIds)
      : [];

    // docs/09 Fo6/Fo7: partner dynamics is the plain average of BP result
    // points earned together (3/2/1/0), overall and per motion type. Pair
    // dynamics ratings are NOT blended in — that aggregation is still OPEN.
    const scoresByPair = new Map<string, { a: string; b: string; typeA: ParticipantType; typeB: ParticipantType; resultPoints: number[]; resultPointsByMotionType: Map<string, number[]> }>();
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
        resultPoints: [],
        resultPointsByMotionType: new Map<string, number[]>(),
      };
      // One debate together contributes one result-points observation.
      current.resultPoints.push(first.teamResultPoints);
      const motionType = buildMotionType(first);
      current.resultPointsByMotionType.set(motionType, [
        ...(current.resultPointsByMotionType.get(motionType) ?? []),
        first.teamResultPoints,
      ]);
      scoresByPair.set(pairKey, current);
    }

    for (const entry of scoresByPair.values()) {
      const observationCount = entry.resultPoints.length;
      await repository.upsertPairMetricSnapshot({
        memberAId: entry.a,
        memberAType: entry.typeA,
        memberBId: entry.b,
        memberBType: entry.typeB,
        metricKey: "partner_dynamics_overall",
        contextKey: null,
        value: average(entry.resultPoints),
        observationCount,
        confidence: computeConfidence(observationCount, 4),
      });
      for (const [motionType, points] of entry.resultPointsByMotionType.entries()) {
        await repository.upsertPairMetricSnapshot({
          memberAId: entry.a,
          memberAType: entry.typeA,
          memberBId: entry.b,
          memberBType: entry.typeB,
          metricKey: "partner_dynamics_by_motion_type",
          contextKey: motionType,
          value: average(points),
          observationCount: points.length,
          confidence: computeConfidence(points.length, 6),
        });
      }
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

    // docs/09 Fo13: two-stage mean — average speaker ratings within each
    // session first, then average the per-session ratings, so a session with
    // more raters cannot dominate. Observation count = sessions chaired.
    const chairSessionGroups = new Map<string, Map<string, number[]>>();
    for (const row of chairFeedback) {
      const participantId = chairIdOf(row);
      if (!participantId) {
        continue;
      }
      const sessions = chairSessionGroups.get(participantId) ?? new Map<string, number[]>();
      sessions.set(row.sessionId, [...(sessions.get(row.sessionId) ?? []), row.rating]);
      chairSessionGroups.set(participantId, sessions);
    }
    const chairGroups = new Map<string, number[]>();
    for (const [participantId, sessions] of chairSessionGroups.entries()) {
      chairGroups.set(participantId, [...sessions.values()].map(average));
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

  async function updateLearnedMetricsForParticipant(participantId: string) {
    const [sessionScores, sparScores, participantTypes] = await Promise.all([
      repository.getSpeakerScoreRecordsForParticipants([participantId]),
      repository.getSparSpeakerScoresForParticipants([participantId]),
      repository.getParticipantTypes([participantId]),
    ]);
    const participantType = participantTypes.get(participantId) ?? "member";

    await repository.deleteMemberMetricSnapshots({
      participantId,
      participantType,
      metricKeys: SPAR_SPEAKER_METRIC_KEYS,
    });

    const allScores = [
      ...sessionScores.map((row) => ({
        motionType: buildMotionType(row),
        speakingRole: row.speakingRole,
        score: row.rawScore,
        generalWeight: 1,
        roleWeight: 1,
      })),
      ...sparScores.map((row) => {
        const isAp = row.debateFormat === "AP";
        return {
          motionType: row.motionType,
          speakingRole: isAp ? mapApRoleToBpRole(row.speakingRole as never) : row.speakingRole,
          score: row.speakerScore,
          generalWeight: isAp ? AP_SPAR_WEIGHT : BP_SPAR_WEIGHT,
          roleWeight: isAp ? AP_ROLE_MAPPING_WEIGHT : BP_SPAR_WEIGHT,
        };
      }),
    ];
    const weightedObservationCount = allScores.reduce((sum, row) => sum + row.generalWeight, 0);
    if (weightedObservationCount === 0) return;

    const storedObservationCount = Math.max(1, Math.round(weightedObservationCount));
    const weightedTotal = allScores.reduce((sum, row) => sum + row.score * row.generalWeight, 0);
    const weightedMean = weightedTotal / weightedObservationCount;
    const variance = allScores.reduce((sum, row) => sum + row.generalWeight * (row.score - weightedMean) ** 2, 0) / weightedObservationCount;
    const consistencyScore = 1 / (1 + Math.sqrt(variance) / 80);
    const confidenceScore = computeConfidence(weightedObservationCount, 6);
    const speakerStrength =
      0.7 * normalizeSpeakerTotal(weightedTotal, weightedObservationCount) +
      0.2 * consistencyScore +
      0.1 * confidenceScore;

    await repository.upsertMemberMetricSnapshot({
      participantId,
      participantType,
      metricKey: "speaker_total_score",
      contextKey: null,
      value: weightedTotal,
      observationCount: storedObservationCount,
      confidence: computeConfidence(weightedObservationCount, 4),
    });
    await repository.upsertMemberMetricSnapshot({
      participantId,
      participantType,
      metricKey: "speaker_strength",
      contextKey: null,
      value: speakerStrength,
      observationCount: storedObservationCount,
      confidence: confidenceScore,
    });

    const grouped = new Map<string, Array<{ score: number; weight: number }>>();
    const add = (metricKey: string, contextKey: string, score: number, weight: number) => {
      const key = `${metricKey}||${contextKey}`;
      grouped.set(key, [...(grouped.get(key) ?? []), { score, weight }]);
    };
    for (const row of allScores) {
      add("speaker_motion_type_score", row.motionType, row.score, row.generalWeight);
      add("role_score", row.speakingRole, row.score, row.roleWeight);
      add("motion_type_x_role_score", `${row.motionType}:${row.speakingRole}`, row.score, row.roleWeight);
    }

    for (const [key, values] of grouped.entries()) {
      const [metricKey, contextKey] = key.split("||");
      const weightTotal = values.reduce((sum, row) => sum + row.weight, 0);
      await repository.upsertMemberMetricSnapshot({
        participantId,
        participantType,
        metricKey,
        contextKey,
        value: values.reduce((sum, row) => sum + row.score * row.weight, 0) / weightTotal,
        observationCount: Math.max(1, Math.round(weightTotal)),
        confidence: computeConfidence(weightTotal, metricKey === "motion_type_x_role_score" ? 6 : 4),
      });
    }
  }

  async function updateLearnedMetricsFromSpar(sparRecordId: string) {
    const sparRecord = await repository.getSparRecordForMetricUpdate(sparRecordId);
    if (!sparRecord) return;

    const participantId = resolveParticipantId(sparRecord);
    if (!participantId) return;

    await updateLearnedMetricsForParticipant(participantId);
  }

  async function updatePairMetricForParticipants(firstParticipantId: string, secondParticipantId: string) {
    const [a, b] = [firstParticipantId, secondParticipantId].sort();
    const [pairRows, participantTypes] = await Promise.all([
      repository.getSparRecordsByTeammate(a, b),
      repository.getParticipantTypes([a, b]),
    ]);
    const memberAType = participantTypes.get(a) ?? "member";
    const memberBType = participantTypes.get(b) ?? "member";

    await repository.deletePairMetricSnapshots({
      memberAId: a,
      memberAType,
      memberBId: b,
      memberBType,
      metricKeys: SPAR_PAIR_METRIC_KEYS,
    });

    const weightedRows = pairRows.map((row) => {
      const weight = row.debateFormat === "AP" ? AP_SPAR_WEIGHT : BP_SPAR_WEIGHT;
      return { motionType: row.motionType, points: row.teamResultPoints * weight, weight };
    });
    const observationWeight = weightedRows.reduce((sum, row) => sum + row.weight, 0);
    if (weightedRows.length === 0 || observationWeight === 0) return;

    await repository.upsertPairMetricSnapshot({
      memberAId: a,
      memberAType,
      memberBId: b,
      memberBType,
      metricKey: "partner_dynamics_overall",
      contextKey: null,
      value: weightedRows.reduce((sum, row) => sum + row.points, 0) / observationWeight,
      observationCount: Math.max(1, Math.round(observationWeight)),
      confidence: computeConfidence(observationWeight, 4),
    });

    const byMotionType = new Map<string, Array<{ points: number; weight: number }>>();
    for (const row of weightedRows) {
      byMotionType.set(row.motionType, [...(byMotionType.get(row.motionType) ?? []), { points: row.points, weight: row.weight }]);
    }
    for (const [motionType, points] of byMotionType.entries()) {
      const weight = points.reduce((sum, row) => sum + row.weight, 0);
      await repository.upsertPairMetricSnapshot({
        memberAId: a,
        memberAType,
        memberBId: b,
        memberBType,
        metricKey: "partner_dynamics_by_motion_type",
        contextKey: motionType,
        value: points.reduce((sum, row) => sum + row.points, 0) / weight,
        observationCount: Math.max(1, Math.round(weight)),
        confidence: computeConfidence(weight, 6),
      });
    }
  }

  async function updatePairMetricFromSpar(sparRecordId: string) {
    const sparRecord = await repository.getSparRecordForMetricUpdate(sparRecordId);
    if (!sparRecord || sparRecord.isIronMan) return;

    const submitterId = resolveParticipantId(sparRecord);
    const teammateIds = [
      resolveParticipantId({ memberId: sparRecord.teammateMemberId, cabinetId: sparRecord.teammateCabinetId, presidentId: sparRecord.teammatePresidentId }),
      ...sparRecord.sparTeammates.map((teammate) => resolveParticipantId(teammate)),
    ].filter((id): id is string => Boolean(id));
    if (!submitterId || teammateIds.length === 0) return;

    for (const teammateId of [...new Set(teammateIds)]) {
      await updatePairMetricForParticipants(submitterId, teammateId);
    }
  }

  return {
    updateLearnedMetricsFromSession,
    updatePairMetricSnapshotsFromSession,
    updateRolePerformanceFromSession,
    updateLearnedMetricsForParticipant,
    updateLearnedMetricsFromSpar,
    updatePairMetricForParticipants,
    updatePairMetricFromSpar,
  };
}

export const {
  updateLearnedMetricsFromSession,
  updatePairMetricSnapshotsFromSession,
  updateRolePerformanceFromSession,
  updateLearnedMetricsForParticipant,
  updateLearnedMetricsFromSpar,
  updatePairMetricForParticipants,
  updatePairMetricFromSpar,
} = createMetricUpdateService();


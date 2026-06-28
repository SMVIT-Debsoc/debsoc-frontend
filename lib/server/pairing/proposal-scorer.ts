import type { BenchPosition, MemberMetricSnapshot, MotionType, PairMetricSnapshot, SpeakingRole } from "../../../types/pairing.ts";
import { buildPairKeyFromIds } from "../repositories/metrics-repository.ts";
import { applyObjectiveMultiplier, getObjectiveMultipliers } from "./objectives.ts";
import { resolveMetricWithFallback } from "./fallback.ts";
import type {
  PairingCandidate,
  PreparedScoringContext,
  RoomCandidate,
  ScoredPairingCandidate,
  SessionSpeaker,
  TeamCandidate,
} from "./types.ts";

const MAX_NORMALIZED_VARIANCE = 0.25;
const MAX_ACADEMIC_YEAR = 5;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);
  return average(values.map((value) => (value - mean) ** 2));
}

function normalizeVariance(values: number[]): number {
  return clampScore(variance(values) / MAX_NORMALIZED_VARIANCE);
}

function buildContextKey(metricKey: string, contextKey: string | null | undefined): string {
  return `${metricKey}:${contextKey ?? ""}`;
}

function getSnapshot(
  snapshotsByKey: Map<string, MemberMetricSnapshot> | Map<string, PairMetricSnapshot> | undefined,
  metricKey: string,
  contextKey?: string | null,
) {
  if (!snapshotsByKey) {
    return null;
  }

  if (contextKey) {
    const contextual = snapshotsByKey.get(buildContextKey(metricKey, contextKey));
    if (contextual) {
      return contextual;
    }
  }

  return snapshotsByKey.get(buildContextKey(metricKey, null)) ?? null;
}

function getEffectiveWeight(context: PreparedScoringContext, metricKey: string): number {
  return context.metricWeightsByKey.get(metricKey) ?? 0;
}

function getObjectiveAdjustedWeight(context: PreparedScoringContext, metricKey: string): number {
  const baseWeight = getEffectiveWeight(context, metricKey);
  const multiplier = getObjectiveMultipliers(context.session.pairingObjective)[metricKey] ?? 1;
  return applyObjectiveMultiplier(baseWeight, multiplier);
}

function getParticipant(participantId: string, context: PreparedScoringContext): SessionSpeaker {
  const participant = context.participants.find(
    (entry): entry is SessionSpeaker => entry.participantId === participantId && entry.sessionRole === "speaker",
  );

  if (!participant) {
    throw new Error(`Speaker ${participantId} not found in generation context.`);
  }

  return participant;
}

function getMemberSnapshotMap(participantId: string, context: PreparedScoringContext) {
  return context.memberMetricSnapshotsByParticipantId.get(participantId);
}

function getPairSnapshotMap(firstParticipantId: string, secondParticipantId: string, context: PreparedScoringContext) {
  return context.pairMetricSnapshotsByPairKey.get(buildPairKeyFromIds(firstParticipantId, secondParticipantId));
}

function getDirectMemberMetric(
  participantId: string,
  metricKey: string,
  context: PreparedScoringContext,
  contextKey?: string | null,
): number {
  const snapshot = getSnapshot(getMemberSnapshotMap(participantId, context), metricKey, contextKey);
  return snapshot?.value ?? 0;
}

function getResolvedMemberMetric(
  participantId: string,
  metricKey: string,
  context: PreparedScoringContext,
  options?: {
    contextKey?: string | null;
    fallbackKey?: string;
    fallbackContextKey?: string | null;
    targetObservationCount?: number;
  },
): number {
  const specific = getSnapshot(getMemberSnapshotMap(participantId, context), metricKey, options?.contextKey);
  if (!options?.fallbackKey) {
    return specific?.value ?? 0;
  }

  const fallback = getSnapshot(
    getMemberSnapshotMap(participantId, context),
    options.fallbackKey,
    options.fallbackContextKey,
  );

  return resolveMetricWithFallback({
    observationCount: specific?.observationCount ?? 0,
    targetCount: options.targetObservationCount ?? 1,
    specificMetric: specific?.value ?? 0,
    fallbackMetric: fallback?.value ?? 0,
  });
}

function getResolvedPairMetric(
  firstParticipantId: string,
  secondParticipantId: string,
  metricKey: string,
  context: PreparedScoringContext,
  options?: {
    contextKey?: string | null;
    fallbackKey?: string;
    fallbackContextKey?: string | null;
    targetObservationCount?: number;
  },
): number {
  const snapshotsByKey = getPairSnapshotMap(firstParticipantId, secondParticipantId, context);
  const specific = getSnapshot(snapshotsByKey, metricKey, options?.contextKey);
  if (!options?.fallbackKey) {
    return specific?.value ?? 0;
  }

  const fallback = getSnapshot(snapshotsByKey, options.fallbackKey, options.fallbackContextKey);
  return resolveMetricWithFallback({
    observationCount: specific?.observationCount ?? 0,
    targetCount: options.targetObservationCount ?? 1,
    specificMetric: specific?.value ?? 0,
    fallbackMetric: fallback?.value ?? 0,
  });
}

function getMotionTypeScore(participantId: string, motionType: MotionType, context: PreparedScoringContext): number {
  return getResolvedMemberMetric(participantId, "speaker_motion_type_score", context, {
    contextKey: motionType,
    fallbackKey: "speaker_total_score",
    targetObservationCount: 5,
  });
}

function getRoleScore(participantId: string, role: SpeakingRole, context: PreparedScoringContext): number {
  return getResolvedMemberMetric(participantId, "role_score", context, {
    contextKey: role,
    fallbackKey: "speaker_total_score",
    targetObservationCount: 5,
  });
}

function getMotionRoleScore(
  participantId: string,
  motionType: MotionType,
  role: SpeakingRole,
  context: PreparedScoringContext,
): number {
  const specific = getSnapshot(
    getMemberSnapshotMap(participantId, context),
    "motion_type_x_role_score",
    `${motionType}:${role}`,
  );
  const fallbackRole = getRoleScore(participantId, role, context);
  const fallbackMotion = getMotionTypeScore(participantId, motionType, context);
  const broadFallback = getDirectMemberMetric(participantId, "speaker_total_score", context);
  const chainedFallback = average([fallbackRole, fallbackMotion, broadFallback]);

  return resolveMetricWithFallback({
    observationCount: specific?.observationCount ?? 0,
    targetCount: 5,
    specificMetric: specific?.value ?? 0,
    fallbackMetric: chainedFallback,
  });
}

function getExperienceIndex(participantId: string, context: PreparedScoringContext): number {
  const participant = getParticipant(participantId, context);
  if (participant.academicYear === null) {
    return 0;
  }

  return clampScore(participant.academicYear / MAX_ACADEMIC_YEAR);
}

function getSpeakerStrength(participantId: string, context: PreparedScoringContext): number {
  return getResolvedMemberMetric(participantId, "speaker_strength", context, {
    fallbackKey: "speaker_total_score",
    targetObservationCount: 5,
  });
}

function getSpeakerMetricScore(
  participantId: string,
  role: SpeakingRole,
  benchPosition: BenchPosition,
  context: PreparedScoringContext,
): number {
  const motionType = context.session.motionType;
  const metricValues = [
    ["academic_year", getExperienceIndex(participantId, context)],
    ["speaker_total_score", getDirectMemberMetric(participantId, "speaker_total_score", context)],
    ["speaker_motion_type_score", getMotionTypeScore(participantId, motionType, context)],
    ["speaker_strength", getSpeakerStrength(participantId, context)],
    ["bp_position_history", getDirectMemberMetric(participantId, "bp_position_history", context, benchPosition)],
    [
      "internal_speaking_role_history",
      getDirectMemberMetric(participantId, "internal_speaking_role_history", context, role),
    ],
    ["role_score", getRoleScore(participantId, role, context)],
    ["motion_type_x_role_score", getMotionRoleScore(participantId, motionType, role, context)],
  ] as const;

  return metricValues.reduce((sum, [metricKey, metricValue]) => {
    const adjustedWeight = getObjectiveAdjustedWeight(context, metricKey);
    return sum + adjustedWeight * metricValue;
  }, 0);
}

function getPairMetricScore(team: TeamCandidate, context: PreparedScoringContext): number {
  const [firstSpeaker, secondSpeaker] = team.speakers;
  if (!firstSpeaker || !secondSpeaker) {
    return 0;
  }

  const motionType = context.session.motionType;
  const pairMetrics = [
    [
      "partner_dynamics_overall",
      getResolvedPairMetric(firstSpeaker.participantId, secondSpeaker.participantId, "partner_dynamics_overall", context),
    ],
    [
      "partner_dynamics_by_motion_type",
      getResolvedPairMetric(firstSpeaker.participantId, secondSpeaker.participantId, "partner_dynamics_by_motion_type", context, {
        contextKey: motionType,
        fallbackKey: "partner_dynamics_overall",
        targetObservationCount: 4,
      }),
    ],
    [
      "repeat_partner_penalty",
      getResolvedPairMetric(firstSpeaker.participantId, secondSpeaker.participantId, "repeat_partner_penalty", context),
    ],
  ] as const;

  return pairMetrics.reduce((sum, [metricKey, metricValue]) => {
    const adjustedWeight = getObjectiveAdjustedWeight(context, metricKey);
    return sum + adjustedWeight * metricValue;
  }, 0);
}

function getTeamStrength(team: TeamCandidate, context: PreparedScoringContext): number {
  return average(team.speakers.map((speaker) => getSpeakerStrength(speaker.participantId, context)));
}

function getRoomBalanceScore(candidate: PairingCandidate, context: PreparedScoringContext): number {
  if (candidate.rooms.length <= 1) {
    return 1;
  }

  const roomStrengths = candidate.rooms.map((room) => average(
    room.teams.flatMap((team) => team.speakers.map((speaker) => getSpeakerStrength(speaker.participantId, context))),
  ));
  const roomExperiences = candidate.rooms.map((room) => average(
    room.teams.flatMap((team) => team.speakers.map((speaker) => getExperienceIndex(speaker.participantId, context))),
  ));

  return clampScore(1 - (0.75 * normalizeVariance(roomStrengths) + 0.25 * normalizeVariance(roomExperiences)));
}

function getExperienceDistributionAggregate(candidate: PairingCandidate, context: PreparedScoringContext): number {
  if (candidate.rooms.length <= 1) {
    return 1;
  }

  const roomExperiences = candidate.rooms.map((room) => average(
    room.teams.flatMap((team) => team.speakers.map((speaker) => getExperienceIndex(speaker.participantId, context))),
  ));

  return clampScore(1 - normalizeVariance(roomExperiences));
}

function getAdjudicatorAverageScore(candidate: PairingCandidate, context: PreparedScoringContext): number {
  return average(
    candidate.rooms.flatMap((room) =>
      room.adjudicators.map((adjudicator) => context.adjudicatorMetricsById.get(adjudicator.participantId)?.adjudicatorAverageScore ?? 0),
    ),
  );
}

function getChairScore(candidate: PairingCandidate, context: PreparedScoringContext): number {
  return average(
    candidate.rooms.flatMap((room) =>
      room.adjudicators
        .filter((adjudicator) => adjudicator.isChair)
        .map((chair) => context.adjudicatorMetricsById.get(chair.participantId)?.chairScore ?? 0),
    ),
  );
}

function scoreRoom(room: RoomCandidate, context: PreparedScoringContext) {
  const teamScores = room.teams.map((team) => scoreTeam(team, context));
  const roomDifficultyScore = average(room.teams.map((team) => getTeamStrength(team, context)));

  return {
    roomScore: average(teamScores),
    roomDifficultyScore,
    teamScores,
  };
}

export function scoreTeam(team: TeamCandidate, context: PreparedScoringContext): number {
  const speakerScore = average(
    team.speakers.map((speaker) => getSpeakerMetricScore(speaker.participantId, speaker.speakingRole, team.bpPosition, context)),
  );
  const pairScore = getPairMetricScore(team, context);

  return speakerScore + pairScore;
}

export function scoreProposal(candidate: PairingCandidate, context: PreparedScoringContext): ScoredPairingCandidate {
  const scoredRooms = candidate.rooms.map((room) => {
    const roomSummary = scoreRoom(room, context);
    return {
      ...room,
      roomScore: roomSummary.roomScore,
      roomDifficultyScore: roomSummary.roomDifficultyScore,
      teams: room.teams.map((team, index) => ({
        ...team,
        teamScore: roomSummary.teamScores[index] ?? 0,
      })),
    };
  });

  const scoredCandidate: PairingCandidate = {
    rooms: scoredRooms,
    unassignedParticipants: candidate.unassignedParticipants,
  };

  const roomBalanceScore = getRoomBalanceScore(scoredCandidate, context);
  const adjudicatorAverageScore = getAdjudicatorAverageScore(scoredCandidate, context);
  const chairScore = getChairScore(scoredCandidate, context);
  const teamQualityAggregate = average(
    scoredRooms.flatMap((room) => room.teams.map((team) => team.teamScore ?? 0)),
  );
  const experienceDistributionAggregate = getExperienceDistributionAggregate(scoredCandidate, context);

  const proposalScore =
    getEffectiveWeight(context, "room_balance_score") * (getObjectiveMultipliers(context.session.pairingObjective).room_balance_score ?? 1) * roomBalanceScore +
    getEffectiveWeight(context, "adjudicator_average_score") * adjudicatorAverageScore +
    getEffectiveWeight(context, "chair_score") * (getObjectiveMultipliers(context.session.pairingObjective).chair_score ?? 1) * chairScore +
    getEffectiveWeight(context, "team_quality_aggregate") * teamQualityAggregate +
    getEffectiveWeight(context, "experience_distribution_aggregate") * experienceDistributionAggregate;

  return {
    ...scoredCandidate,
    proposalScore,
    scoreBreakdown: {
      roomBalanceScore,
      adjudicatorAverageScore,
      chairScore,
      teamQualityAggregate,
      experienceDistributionAggregate,
      totalProposalScore: proposalScore,
    },
  };
}

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/server/prisma.ts";

const DEMO_PASSWORD = "demo1234";
const LEFTOVER_REASON = "Not enough speakers to fill another full BP room";
const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

type ParticipantSeedReference = {
  kind: "member" | "cabinet" | "president";
  id: string;
};

type NumericBucket = {
  sum: number;
  count: number;
};

const ref = (p: ParticipantSeedReference) => ({
  memberId: p.kind === "member" ? p.id : null,
  cabinetId: p.kind === "cabinet" ? p.id : null,
  presidentId: p.kind === "president" ? p.id : null,
});

const bucket = <K>(map: Map<K, NumericBucket>, key: K, value: number) => {
  const current = map.get(key) ?? { sum: 0, count: 0 };
  current.sum += value;
  current.count += 1;
  map.set(key, current);
};

const nested = <K, L>(map: Map<K, Map<L, NumericBucket>>, outerKey: K, innerKey: L, value: number) => {
  const current = map.get(outerKey) ?? new Map<L, NumericBucket>();
  bucket(current, innerKey, value);
  map.set(outerKey, current);
};

const pairKey = (a: string, b: string) => [a, b].sort().join("|");
const safeDelete = async (op: () => Promise<unknown>) => {
  try {
    await op();
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code !== "P2021") {
      throw error;
    }
  }
};
const average = (bucketValue: NumericBucket | undefined | null) =>
  bucketValue && bucketValue.count ? Number((bucketValue.sum / bucketValue.count).toFixed(2)) : 0;
const score = (value: number) => Number(value.toFixed(2));

async function clearDemoData() {
  await safeDelete(() => prisma.pairingMetricAdjustment.deleteMany());
  await safeDelete(() => prisma.pairingMetricDefinition.deleteMany());
  await safeDelete(() => prisma.pairMetricSnapshot.deleteMany());
  await safeDelete(() => prisma.memberMetricSnapshot.deleteMany());
  await safeDelete(() => prisma.teamDynamicsRating.deleteMany());
  await safeDelete(() => prisma.adjudicatorScoreRecord.deleteMany());
  await safeDelete(() => prisma.chairFeedbackRecord.deleteMany());
  await safeDelete(() => prisma.speakerScoreRecord.deleteMany());
  await safeDelete(() => prisma.proposalRating.deleteMany());
  await safeDelete(() => prisma.proposalReviewLog.deleteMany());
  await safeDelete(() => prisma.unassignedParticipant.deleteMany());
  await safeDelete(() => prisma.teamSpeakerAssignment.deleteMany());
  await safeDelete(() => prisma.roomAdjudicatorAssignment.deleteMany());
  await safeDelete(() => prisma.debateTeamAssignment.deleteMany());
  await safeDelete(() => prisma.debateRoomAssignment.deleteMany());
  await safeDelete(() => prisma.pairingProposal.deleteMany());
  await safeDelete(() => prisma.attendance.deleteMany());
  await safeDelete(() => prisma.sessionRoleAssignment.deleteMany());
  await safeDelete(() => prisma.debateSession.deleteMany());
  await safeDelete(() => prisma.account.deleteMany());
  await safeDelete(() => prisma.session.deleteMany());
  await safeDelete(() => prisma.user.deleteMany());
  await safeDelete(() => prisma.verificationToken.deleteMany());
  await safeDelete(() => prisma.member.deleteMany());
  await safeDelete(() => prisma.cabinet.deleteMany());
  await safeDelete(() => prisma.president.deleteMany());
  await safeDelete(() => prisma.techHead.deleteMany());
}

async function createRoles() {
  const techHead = await prisma.techHead.create({ data: { name: "DebSoc Tech Head", email: "techhead@debsoc.dev", password: hash } });
  const president = await prisma.president.create({
    data: {
      name: "Mohammed Owais",
      email: "mohammed.owais@debsoc.dev",
      password: hash,
      isVerified: true,
      verifiedByTechHeadId: techHead.id,
    },
  });
  const localCabinet = await prisma.cabinet.create({
    data: {
      name: "Local Cabinet",
      position: "Pairing Lead",
      email: "local.cabinet@debsoc.dev",
      password: hash,
      isVerified: true,
      verifiedByTechHeadId: techHead.id,
    },
  });
  const strategyCabinet = await prisma.cabinet.create({
    data: {
      name: "Strategy Cabinet",
      position: "Chief Adjudicator",
      email: "strategy.cabinet@debsoc.dev",
      password: hash,
      isVerified: true,
      verifiedByTechHeadId: techHead.id,
    },
  });

  const memberSeeds = [
    ["Mobasshir Khan", "mobasshirkhan9931@gmail.com"],
    ["Aaradhya Manjunath", "aaradhyamanjunath.1346@gmail.com"],
    ["Alisha Ashraf", "alishaashraf767@gmail.com"],
    ["Ananya Singh", "ananyasingh12046@gmail.com"],
    ["Anika Gupta", "anika2k99@gmail.com"],
    ["Anirudh Gupta", "anigupta477@gmail.com"],
    ["Ayush Kumar", "ayushkumar85385@gmail.com"],
    ["Divyansh Raj", "rdivyansh009@gmail.com"],
    ["Garima Shandilya", "gpsshandilya27@gmail.com"],
    ["Gaurav Ins", "vishwashgaurawcpr181@gmail.com"],
    ["Hardhik Bhatia", "hardhikbhatia0@gmail.com"],
    ["Ishan Singh", "singhishan1103@gmail.com"],
    ["Ishan Trivedi", "ishtrivedi18@gmail.com"],
    ["Kaavya Sharma", "kaavaps2101@gmail.com"],
    ["Kripa Chhajer", "kripachhajer26@gmail.com"],
  ];

  const members = [];
  for (const [name, email] of memberSeeds) {
    const member = await prisma.member.create({ data: { name, email, password: hash, isVerified: true, verifiedByTechHeadId: techHead.id } });
    members.push({ id: member.id, kind: "member", name: member.name, email: member.email });
  }

  const rolesByName = new Map([
    [techHead.name, { id: techHead.id, kind: "member", name: techHead.name, email: techHead.email }],
    [president.name, { id: president.id, kind: "president", name: president.name, email: president.email }],
    [localCabinet.name, { id: localCabinet.id, kind: "cabinet", name: localCabinet.name, email: localCabinet.email }],
    [strategyCabinet.name, { id: strategyCabinet.id, kind: "cabinet", name: strategyCabinet.name, email: strategyCabinet.email }],
    ...members.map((member) => [member.name, member]),
  ]);

  return { techHead, president, localCabinet, strategyCabinet, members, rolesByName };
}

const requiredRole = (rolesByName, name) => {
  const role = rolesByName.get(name);
  if (!role) throw new Error(`Missing role: ${name}`);
  return role;
};

const sessionSpecs = [
  {
    sessionDate: new Date("2026-06-21T09:00:00.000Z"),
    motiontype: "Policy",
    motionType: "Policy",
    motionText: "This House would introduce a universal civic participation grant.",
    pairingObjective: "COMPETITIVE",
    chairName: "Local Cabinet",
    status: "APPROVED",
    pairingStatus: "APPROVED",
    publicationStatus: "DRAFT",
    scoringStatus: "PENDING",
    proposalStatus: "APPROVED",
    topBandRank: 2,
    proposalScore: 0.81,
    roomBalanceScore: 0.88,
    adjudicatorAverageScore: 0.78,
    chairScore: 0.82,
    teamQualityAggregate: 0.79,
    experienceDistributionAggregate: 0.74,
    roomDifficultyScore: 0.41,
    generatedBy: "Local Cabinet",
    approvedBy: "Mohammed Owais",
    publishedBy: "Local Cabinet",
    reviewNotes: "Strong shape for a first demo proposal.",
    rating: 8,
    speakers: [
      ["Mobasshir Khan", "OG", "PM", 84, 3],
      ["Alisha Ashraf", "OG", "DPM", 82, 3],
      ["Ananya Singh", "OO", "LO", 79, 2],
      ["Anika Gupta", "OO", "DLO", 77, 2],
      ["Anirudh Gupta", "CG", "MG", 80, 1],
      ["Ayush Kumar", "CG", "GW", 78, 1],
      ["Divyansh Raj", "CO", "MO", 81, 0],
      ["Garima Shandilya", "CO", "OW", 76, 0],
    ],
    adjudicators: [
      ["Local Cabinet", true, 0.92, 8.4],
      ["Hardhik Bhatia", false, 0.8, 8.1],
      ["Ishan Singh", false, 0.83, 8.3],
    ],
    leftovers: ["Gaurav Ins", "Ishan Trivedi", "Kaavya Sharma", "Kripa Chhajer"],
  },
  {
    sessionDate: new Date("2026-07-01T09:00:00.000Z"),
    motiontype: "IR",
    motionType: "IR",
    motionText: "This House would prioritize local cooperative housing policy.",
    pairingObjective: "BALANCED",
    chairName: "Mohammed Owais",
    status: "PUBLISHED",
    pairingStatus: "PUBLISHED",
    publicationStatus: "PUBLISHED",
    scoringStatus: "COMPLETE",
    proposalStatus: "PUBLISHED",
    topBandRank: 1,
    proposalScore: 0.88,
    roomBalanceScore: 0.91,
    adjudicatorAverageScore: 0.86,
    chairScore: 0.84,
    teamQualityAggregate: 0.83,
    experienceDistributionAggregate: 0.77,
    roomDifficultyScore: 0.38,
    generatedBy: "Local Cabinet",
    approvedBy: "Mohammed Owais",
    publishedBy: "Mohammed Owais",
    reviewNotes: "Published demo session with fuller attendance and score data.",
    rating: 9,
    speakers: [
      ["Mobasshir Khan", "OG", "PM", 86, 3],
      ["Alisha Ashraf", "OG", "DPM", 85, 3],
      ["Ananya Singh", "OO", "LO", 80, 2],
      ["Anika Gupta", "OO", "DLO", 79, 2],
      ["Anirudh Gupta", "CG", "MG", 82, 1],
      ["Ayush Kumar", "CG", "GW", 81, 1],
      ["Divyansh Raj", "CO", "MO", 83, 0],
      ["Garima Shandilya", "CO", "OW", 79, 0],
    ],
    adjudicators: [
      ["Mohammed Owais", true, 0.95, 8.8],
      ["Strategy Cabinet", false, 0.81, 8.1],
      ["Ishan Trivedi", false, 0.79, 7.9],
    ],
    leftovers: ["Gaurav Ins", "Hardhik Bhatia", "Kaavya Sharma", "Kripa Chhajer"],
  },
];
async function main() {
  await clearDemoData();
  const roles = await createRoles();
  const state = {
    speakerTotals: new Map(),
    speakerStrengths: new Map(),
    motionTypeScores: new Map(),
    roleScores: new Map(),
    pairMetrics: new Map(),
    pairParticipants: new Map(),
    adjudicatorAverageScores: new Map(),
    chairScores: new Map(),
  };

  await prisma.pairingMetricDefinition.createMany({
    data: [
      ["academic_year", "Academic Year", "Experience signal used to vary team balance.", "profile", 0.05, "historical_profile"],
      ["speaker_total_score", "Speaker Total Score", "Cumulative raw speaker score across sessions.", "speaker", 0.22, "historical_performance"],
      ["speaker_motion_type_score", "Speaker Motion Type Score", "Speaker performance for a motion category.", "speaker", 0.16, "historical_performance"],
      ["speaker_strength", "Speaker Strength", "Normalized speaker strength from recent sessions.", "speaker", 0.18, "historical_performance"],
      ["role_score", "Role Score", "Role-specific performance signal.", "role", 0.14, "historical_performance"],
      ["adjudicator_average_score", "Adjudicator Average Score", "Average adjudicator rating across scored rounds.", "adjudicator", 0.2, "historical_performance"],
      ["chair_score", "Chair Score", "Chair quality rating from adjudicator feedback.", "chair", 0.19, "historical_performance"],
      ["partner_dynamics_overall", "Partner Dynamics Overall", "Overall teammate compatibility.", "pair", 0.12, "pair_history"],
      ["partner_dynamics_by_motion_type", "Partner Dynamics By Motion Type", "Teammate compatibility within a motion category.", "pair", 0.1, "pair_history"],
    ].map(([key, name, description, category, baseWeight, scope]) => ({
      key,
      name,
      description,
      category,
      baseWeight,
      isEnabled: true,
      isHardRule: false,
      isSoftRule: true,
      scope,
      fallbackConfigJson: { fallback: 0.5 },
    })),
  });

  for (const spec of sessionSpecs) {
    const chair = requiredRole(roles.rolesByName, spec.chairName);
    const generatedBy = requiredRole(roles.rolesByName, spec.generatedBy);
    const approvedBy = requiredRole(roles.rolesByName, spec.approvedBy);
    const publishedBy = requiredRole(roles.rolesByName, spec.publishedBy);
    const speakers = spec.speakers.map(([name, bpPosition, speakingRole, rawScore, teamResultPoints]) => ({
      participant: requiredRole(roles.rolesByName, name),
      bpPosition,
      speakingRole,
      rawScore,
      teamResultPoints,
    }));
    const adjudicators = spec.adjudicators.map(([name, isChair, chairAssignmentScore, rating]) => ({
      participant: requiredRole(roles.rolesByName, name),
      isChair,
      chairAssignmentScore,
      rating,
    }));
    const leftovers = spec.leftovers.map((name) => requiredRole(roles.rolesByName, name));

    const session = await prisma.debateSession.create({
      data: {
        sessionDate: spec.sessionDate,
        motiontype: spec.motiontype,
        Chair: chair.name,
        motionType: spec.motionType,
        motionText: spec.motionText,
        pairingObjective: spec.pairingObjective,
        status: spec.status,
        pairingStatus: spec.pairingStatus,
        publicationStatus: spec.publicationStatus,
        scoringStatus: spec.scoringStatus,
      },
    });

    const proposal = await prisma.pairingProposal.create({
      data: {
        sessionId: session.id,
        proposalVersion: spec.topBandRank,
        status: spec.proposalStatus,
        engineVersion: "demo-engine-v1",
        ruleVersion: "demo-rule-v1",
        topBandRank: spec.topBandRank,
        proposalScore: spec.proposalScore,
        scoreBreakdownJson: {
          roomBalanceScore: spec.roomBalanceScore,
          adjudicatorAverageScore: spec.adjudicatorAverageScore,
          chairScore: spec.chairScore,
          teamQualityAggregate: spec.teamQualityAggregate,
          experienceDistributionAggregate: spec.experienceDistributionAggregate,
          totalProposalScore: spec.proposalScore,
        },
        generatedAt: spec.sessionDate,
        generatedBy: generatedBy.name,
        approvedAt: spec.status === "APPROVED" || spec.status === "PUBLISHED" ? spec.sessionDate : null,
        publishedAt: spec.status === "PUBLISHED" ? spec.sessionDate : null,
        isPublishedOfficially: spec.status === "PUBLISHED",
        roomAssignments: {
          create: [
            {
              roomIndex: 1,
              roomScore: spec.proposalScore,
              roomBalanceScore: spec.roomBalanceScore,
              roomDifficultyScore: spec.roomDifficultyScore,
              teamAssignments: {
                create: [
                  { bpPosition: "OG", teamScore: score((speakers[0].rawScore + speakers[1].rawScore) / 2), speakerAssignments: { create: [{ ...ref(speakers[0].participant), speakingRole: speakers[0].speakingRole, speakerOrder: 1 }, { ...ref(speakers[1].participant), speakingRole: speakers[1].speakingRole, speakerOrder: 2 }] } },
                  { bpPosition: "OO", teamScore: score((speakers[2].rawScore + speakers[3].rawScore) / 2), speakerAssignments: { create: [{ ...ref(speakers[2].participant), speakingRole: speakers[2].speakingRole, speakerOrder: 1 }, { ...ref(speakers[3].participant), speakingRole: speakers[3].speakingRole, speakerOrder: 2 }] } },
                  { bpPosition: "CG", teamScore: score((speakers[4].rawScore + speakers[5].rawScore) / 2), speakerAssignments: { create: [{ ...ref(speakers[4].participant), speakingRole: speakers[4].speakingRole, speakerOrder: 1 }, { ...ref(speakers[5].participant), speakingRole: speakers[5].speakingRole, speakerOrder: 2 }] } },
                  { bpPosition: "CO", teamScore: score((speakers[6].rawScore + speakers[7].rawScore) / 2), speakerAssignments: { create: [{ ...ref(speakers[6].participant), speakingRole: speakers[6].speakingRole, speakerOrder: 1 }, { ...ref(speakers[7].participant), speakingRole: speakers[7].speakingRole, speakerOrder: 2 }] } },
                ],
              },
              adjudicatorAssignments: {
                create: adjudicators.map((adjudicator) => ({ ...ref(adjudicator.participant), isChair: adjudicator.isChair, chairAssignmentScore: adjudicator.chairAssignmentScore })),
              },
            },
          ],
        },
      },
    });

    await prisma.debateSession.update({ where: { id: session.id }, data: { acceptedProposalId: proposal.id, publishedProposalId: spec.status === "PUBLISHED" ? proposal.id : null, publishedAt: spec.status === "PUBLISHED" ? spec.sessionDate : null } });

    await prisma.proposalReviewLog.createMany({
      data: [
        { proposalId: proposal.id, reviewerId: generatedBy.id, action: "GENERATED", notes: "Seeded demo proposal generated for UI testing.", createdAt: spec.sessionDate },
        { proposalId: proposal.id, reviewerId: approvedBy.id, action: "APPROVED", notes: spec.reviewNotes, createdAt: new Date(spec.sessionDate.getTime() + 15 * 60 * 1000) },
        ...(spec.status === "PUBLISHED" ? [{ proposalId: proposal.id, reviewerId: publishedBy.id, action: "PUBLISHED", notes: "Demo proposal published for member-visible views.", createdAt: new Date(spec.sessionDate.getTime() + 30 * 60 * 1000) }] : []),
      ],
    });

    await prisma.proposalRating.create({ data: { proposalId: proposal.id, reviewerId: approvedBy.id, rating: spec.rating, issueTagsJson: spec.status === "PUBLISHED" ? ["balanced", "publish-ready"] : ["balanced", "approved"], notes: spec.reviewNotes, createdAt: new Date(spec.sessionDate.getTime() + 20 * 60 * 1000) } });

    await prisma.attendance.createMany({
      data: [
        ...speakers.map((speaker) => ({ sessionId: session.id, ...ref(speaker.participant), status: "present", isPresent: true, isFinalized: true, wasAssigned: true, wasUnassigned: false, unassignedReason: null, speakerScore: speaker.rawScore, pairingCode: `${spec.motiontype}-${speaker.bpPosition}`, debatedAlone: false })),
        ...adjudicators.map((adjudicator) => ({ sessionId: session.id, ...ref(adjudicator.participant), status: "present", isPresent: true, isFinalized: true, wasAssigned: true, wasUnassigned: false, unassignedReason: null, speakerScore: null, pairingCode: `${spec.motiontype}-ADJ`, debatedAlone: false })),
        ...leftovers.map((participant) => ({ sessionId: session.id, ...ref(participant), status: "absent", isPresent: false, isFinalized: true, wasAssigned: false, wasUnassigned: true, unassignedReason: LEFTOVER_REASON, speakerScore: null, pairingCode: null, debatedAlone: false })),
      ],
    });

    await prisma.sessionRoleAssignment.createMany({
      data: [
        ...speakers.map((speaker) => ({ sessionId: session.id, ...ref(speaker.participant), role: "speaker", isChair: false, roleAssignedAt: spec.sessionDate })),
        ...adjudicators.map((adjudicator) => ({ sessionId: session.id, ...ref(adjudicator.participant), role: "adjudicator", isChair: adjudicator.isChair, roleAssignedAt: spec.sessionDate })),
      ],
    });

    await prisma.speakerScoreRecord.createMany({
      data: speakers.map((speaker) => ({
        sessionId: session.id,
        proposalId: proposal.id,
        ...ref(speaker.participant),
        bpPosition: speaker.bpPosition,
        speakingRole: speaker.speakingRole,
        rawScore: speaker.rawScore,
        teamResultPoints: speaker.teamResultPoints,
        scoredByMemberId: chair.kind === "member" ? chair.id : null,
        scoredByCabinetId: chair.kind === "cabinet" ? chair.id : null,
        scoredByPresidentId: chair.kind === "president" ? chair.id : null,
      })),
    });

    await prisma.chairFeedbackRecord.createMany({
      data: speakers.map((speaker) => ({
        sessionId: session.id,
        proposalId: proposal.id,
        ...ref(speaker.participant),
        chairMemberId: chair.kind === "member" ? chair.id : null,
        chairCabinetId: chair.kind === "cabinet" ? chair.id : null,
        chairPresidentId: chair.kind === "president" ? chair.id : null,
        rating: Math.max(6, Math.min(10, Math.round(speaker.rawScore / 10))),
        notes: `${speaker.participant.name} delivered a solid ${speaker.speakingRole} round.`,
      })),
    });

    await prisma.adjudicatorScoreRecord.createMany({
      data: adjudicators.filter((a) => !a.isChair).map((adjudicator) => ({
        sessionId: session.id,
        proposalId: proposal.id,
        chairMemberId: chair.kind === "member" ? chair.id : null,
        chairCabinetId: chair.kind === "cabinet" ? chair.id : null,
        chairPresidentId: chair.kind === "president" ? chair.id : null,
        adjudicatorMemberId: adjudicator.participant.kind === "member" ? adjudicator.participant.id : null,
        adjudicatorCabinetId: adjudicator.participant.kind === "cabinet" ? adjudicator.participant.id : null,
        adjudicatorPresidentId: adjudicator.participant.kind === "president" ? adjudicator.participant.id : null,
        rating: adjudicator.rating ?? 8,
        notes: `${adjudicator.participant.name} provided adjudication support for the demo room.`,
      })),
    });

    await prisma.unassignedParticipant.createMany({
      data: leftovers.map((participant) => ({ proposalId: proposal.id, ...ref(participant), reason: LEFTOVER_REASON })),
    });

    for (const speaker of speakers) {
      bucket(state.speakerTotals, speaker.participant.id, speaker.rawScore);
      bucket(state.speakerStrengths, speaker.participant.id, speaker.rawScore / 100);
      nested(state.motionTypeScores, speaker.participant.id, spec.motiontype, speaker.rawScore);
      nested(state.roleScores, speaker.participant.id, speaker.speakingRole, speaker.rawScore);
    }

    for (let index = 0; index < speakers.length; index += 2) {
      const first = speakers[index];
      const second = speakers[index + 1];
      const key = pairKey(first.participant.id, second.participant.id);
      const compatibility = score(0.72 + (1 - Math.abs(first.rawScore - second.rawScore) / 100) * 0.18);
      state.pairParticipants.set(key, { first: first.participant, second: second.participant });
      nested(state.pairMetrics, key, spec.motiontype, compatibility);
      nested(state.pairMetrics, key, `${spec.motiontype}:overall`, score(compatibility + 0.02));
    }

    for (const adjudicator of adjudicators) {
      if (adjudicator.isChair) {
        bucket(state.chairScores, adjudicator.participant.id, adjudicator.rating ?? 8.5);
      } else {
        bucket(state.adjudicatorAverageScores, adjudicator.participant.id, adjudicator.rating ?? 8);
      }
      nested(state.roleScores, adjudicator.participant.id, adjudicator.isChair ? "chair" : "adjudicator", adjudicator.rating ?? 8);
    }
  }

  const memberMetricRows = [];
  for (const [participantId, bucketValue] of state.speakerTotals.entries()) {
    memberMetricRows.push({ participantId, metricKey: "speaker_total_score", contextKey: null, value: score(bucketValue.sum), observationCount: bucketValue.count, confidence: score(Math.min(0.98, 0.62 + bucketValue.count * 0.15)) });
  }
  for (const [participantId, bucketValue] of state.speakerStrengths.entries()) {
    memberMetricRows.push({ participantId, metricKey: "speaker_strength", contextKey: null, value: average(bucketValue), observationCount: bucketValue.count, confidence: score(Math.min(0.98, 0.58 + bucketValue.count * 0.14)) });
  }
  for (const [participantId, motionMap] of state.motionTypeScores.entries()) {
    for (const [motionType, bucketValue] of motionMap.entries()) {
      memberMetricRows.push({ participantId, metricKey: "speaker_motion_type_score", contextKey: motionType, value: average(bucketValue), observationCount: bucketValue.count, confidence: score(Math.min(0.98, 0.56 + bucketValue.count * 0.16)) });
    }
  }
  for (const [participantId, roleMap] of state.roleScores.entries()) {
    for (const [roleKey, bucketValue] of roleMap.entries()) {
      memberMetricRows.push({ participantId, metricKey: "role_score", contextKey: roleKey, value: average(bucketValue), observationCount: bucketValue.count, confidence: score(Math.min(0.98, 0.54 + bucketValue.count * 0.16)) });
    }
  }
  for (const [participantId, bucketValue] of state.adjudicatorAverageScores.entries()) {
    memberMetricRows.push({ participantId, metricKey: "adjudicator_average_score", contextKey: null, value: average(bucketValue), observationCount: bucketValue.count, confidence: score(Math.min(0.98, 0.66 + bucketValue.count * 0.12)) });
  }
  for (const [participantId, bucketValue] of state.chairScores.entries()) {
    memberMetricRows.push({ participantId, metricKey: "chair_score", contextKey: null, value: average(bucketValue), observationCount: bucketValue.count, confidence: score(Math.min(0.98, 0.68 + bucketValue.count * 0.12)) });
  }

  await prisma.memberMetricSnapshot.createMany({
    data: memberMetricRows.map((row) => ({
      memberId: roles.members.find((member) => member.id === row.participantId) ? row.participantId : null,
      cabinetId: [roles.localCabinet, roles.strategyCabinet].some((entry) => entry.id === row.participantId) ? row.participantId : null,
      presidentId: [roles.president].some((entry) => entry.id === row.participantId) ? row.participantId : null,
      metricKey: row.metricKey,
      contextKey: row.contextKey,
      value: row.value,
      observationCount: row.observationCount,
      confidence: row.confidence,
    })),
  });

  const pairMetricRows = [];
  for (const [key, motionMap] of state.pairMetrics.entries()) {
    const participants = state.pairParticipants.get(key);
    if (!participants) continue;
    for (const [contextKey, bucketValue] of motionMap.entries()) {
      pairMetricRows.push({
        first: participants.first,
        second: participants.second,
        metricKey: contextKey.endsWith(":overall") ? "partner_dynamics_overall" : "partner_dynamics_by_motion_type",
        contextKey: contextKey.endsWith(":overall") ? contextKey.replace(":overall", "") : contextKey,
        value: average(bucketValue),
        observationCount: bucketValue.count,
        confidence: score(Math.min(0.98, 0.6 + bucketValue.count * 0.12)),
      });
    }
  }

  await prisma.pairMetricSnapshot.createMany({
    data: pairMetricRows.map((row) => ({
      memberAId: row.first.kind === "member" ? row.first.id : null,
      cabinetAId: row.first.kind === "cabinet" ? row.first.id : null,
      presidentAId: row.first.kind === "president" ? row.first.id : null,
      memberBId: row.second.kind === "member" ? row.second.id : null,
      cabinetBId: row.second.kind === "cabinet" ? row.second.id : null,
      presidentBId: row.second.kind === "president" ? row.second.id : null,
      metricKey: row.metricKey,
      contextKey: row.contextKey,
      value: row.value,
      observationCount: row.observationCount,
      confidence: row.confidence,
    })),
  });

  console.log(`Seeded demo database with ${sessionSpecs.length} sessions and ${roles.members.length} members.`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}







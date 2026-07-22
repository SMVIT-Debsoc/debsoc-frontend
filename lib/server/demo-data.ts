import type {
  AdjudicatorLeaderboardResponse,
  ParticipantProgressProfile,
  SpeakerLeaderboardResponse,
} from "@/types/scoring";
import type { PublishedPairingView } from "@/types/pairing";
import type { SparHistoryResponse, SparLeaderboardResponse } from "@/types/spar";

/** Opt-in local fixtures. This is intentionally impossible to enable outside development. */
export function isDemoDataEnabled() {
  return process.env.NODE_ENV === "development" && process.env.DEV_DEMO_DATA === "true";
}

export const DEMO_MEMBER_ID = "demo-member";

export function demoAttendance(role: "Member" | "cabinet" | "President" = "Member", userId = DEMO_MEMBER_ID) {
  const identity = role === "Member" ? { memberId: userId, cabinetId: null, presidentId: null } : role === "cabinet" ? { memberId: null, cabinetId: userId, presidentId: null } : { memberId: null, cabinetId: null, presidentId: userId };
  return {
    attendance: [
      {
        id: "demo-attendance-1",
        ...identity,
        status: "Present",
        speakerScore: 78,
        pairingCode: "DEMO-R1",
        debatedAlone: false,
        pairedWith: ["Aarav Sharma"],
        assignmentLabel: "PM (OG)",
        session: {
          id: "demo-session-1",
          sessionDate: "2026-07-18T00:00:00.000Z",
          motiontype: "IR",
          motionType: "IR",
          Chair: "Mira Iyer",
        },
      },
      {
        id: "demo-attendance-2",
        ...identity,
        status: "Present",
        speakerScore: 82,
        pairingCode: "DEMO-R2",
        debatedAlone: false,
        pairedWith: ["Kabir Nair"],
        assignmentLabel: "DPM (CG)",
        session: {
          id: "demo-session-2",
          sessionDate: "2026-07-11T00:00:00.000Z",
          motiontype: "Policy",
          motionType: "Policy",
          Chair: "Riya Das",
        },
      },
    ],
    publishedSessions: [
      {
        id: "demo-session-1",
        sessionDate: "2026-07-18T00:00:00.000Z",
        motiontype: "IR",
        motionText: "This House would regulate algorithmic recommendations.",
        Chair: "Mira Iyer",
        assignedChairLabel: "Mira Iyer",
        pairingStatus: "published",
        publicationStatus: "Published",
        scoringStatus: "complete",
      },
      {
        id: "demo-session-2",
        sessionDate: "2026-07-11T00:00:00.000Z",
        motiontype: "Policy",
        motionText: "This House would introduce a four-day school week.",
        Chair: "Riya Das",
        assignedChairLabel: "Riya Das",
        pairingStatus: "published",
        publicationStatus: "Published",
        scoringStatus: "partial",
      },
    ],
  };
}

export function demoBootstrap() {
  return {
    members: demoParticipants().members,
    cabinet: [{ id: "demo-cabinet", name: "Demo Cabinet", email: "cabinet@example.test", position: "Secretary", isVerified: true }],
    presidents: [{ id: "demo-president", name: "Demo President", email: "president@example.test", isVerified: true }],
    sessions: [
      {
        id: "demo-session-1",
        sessionDate: "2026-07-18T00:00:00.000Z",
        motiontype: "IR",
        motionType: "IR",
        motionText: "This House would regulate algorithmic recommendations.",
        pairingStatus: "published",
        publicationStatus: "Published",
        scoringStatus: "complete",
        Chair: "Mira Iyer",
        attendance: [],
        acceptedProposal: null,
        publishedProposal: null,
      },
    ],
  };
}

export function demoProgressSummaries() {
  return {
    participants: [
      demoProgressProfile.summary,
      { ...demoProgressProfile.summary, participantId: "demo-speaker-1", speakerTotalScore: 176.8, speakerStrength: 0.88, confidence: 0.9, sessionsSpoken: 12, dataMaturity: "HIGH" as const },
    ],
  };
}

export const demoSpeakerLeaderboard: SpeakerLeaderboardResponse = {
  leaderboard: [
    { participantId: "demo-speaker-1", name: "Aarav Sharma", score: 88.4, rank: 1, sessionsCount: 12 },
    { participantId: DEMO_MEMBER_ID, name: "Demo Member", score: 80.2, rank: 2, sessionsCount: 8 },
    { participantId: "demo-speaker-2", name: "Kabir Nair", score: 76.8, rank: 3, sessionsCount: 10 },
  ],
  roundsCount: 12,
};

export const demoAdjudicatorLeaderboard: AdjudicatorLeaderboardResponse = {
  leaderboard: [
    { participantId: "demo-adj-1", name: "Mira Iyer", score: 91.1, rank: 1, sessionsCount: 9, chairedCount: 5, adjudicatedCount: 4 },
    { participantId: DEMO_MEMBER_ID, name: "Demo Member", score: 84.6, rank: 2, sessionsCount: 6, chairedCount: 3, adjudicatedCount: 3 },
    { participantId: "demo-adj-2", name: "Riya Das", score: 79.4, rank: 3, sessionsCount: 7, chairedCount: 2, adjudicatedCount: 5 },
  ],
};

export const demoProgressProfile: ParticipantProgressProfile = {
  participantId: DEMO_MEMBER_ID,
  attendance: { presentCount: 2, totalCount: 2, attendancePercentage: 100 },
  summary: {
    participantId: DEMO_MEMBER_ID,
    speakerTotalScore: 160.4,
    speakerStrength: 0.8,
    confidence: 0.82,
    sessionsSpoken: 8,
    sessionsAdjudicated: 6,
    sessionsChaired: 3,
    scoredSpeakerSessions: 8,
    dataMaturity: "MEDIUM",
  },
  motionTypeScores: [
    { motionType: "IR", score: 82, observationCount: 4, confidence: 0.8 },
    { motionType: "Policy", score: 78, observationCount: 3, confidence: 0.72 },
  ],
  roleScores: [{ role: "PM", score: 84, observationCount: 3, confidence: 0.8 }],
  compatibilityProfiles: [{ participantId: "demo-speaker-1", name: "Aarav Sharma", score: 0.86, observationCount: 2, confidence: 0.65 }],
  rawMetrics: [],
  verdict: {
    strengths: ["Strong opening speeches", "Reliable attendance"],
    weaknesses: ["Closing-role consistency is still developing"],
    gaps: ["More data needed on technical motions"],
    roleAptitude: ["Good as PM"],
    compatibility: ["Pairs well with Aarav Sharma"],
  },
};

export const demoSparLeaderboard: SparLeaderboardResponse = {
  rankings: [
    { rank: 1, userId: "demo-speaker-1", userRole: "Member", userName: "Aarav Sharma", totalSpars: 14, currentStreak: 5 },
    { rank: 2, userId: DEMO_MEMBER_ID, userRole: "Member", userName: "Demo Member", totalSpars: 8, currentStreak: 3 },
    { rank: 3, userId: "demo-speaker-2", userRole: "Member", userName: "Kabir Nair", totalSpars: 7, currentStreak: 2 },
  ],
  myRank: { rank: 2, totalSpars: 8, currentStreak: 3 },
  totalParticipants: 3,
  pagination: { page: 1, limit: 10, totalPages: 1 },
};

export const demoSparHistory: SparHistoryResponse = {
  records: [
    {
      id: "demo-spar-1",
      sparDate: "2026-07-19T00:00:00.000Z",
      motionType: "IR",
      motionText: "This House would regulate algorithmic recommendations.",
      debateFormat: "BP",
      bpPosition: "OG",
      apSide: null,
      isIronMan: false,
      teamRank: 1,
      teamResultPoints: 3,
      teammateId: "demo-speaker-1",
      teammateRole: "Member",
      teammates: [{ id: "demo-spar-team-1", participantId: "demo-speaker-1", participantRole: "Member" }],
      speakerScores: [{ id: "demo-score-1", speakingRole: "PM", speakerScore: 82 }],
      createdAt: "2026-07-19T10:00:00.000Z",
      updatedAt: "2026-07-19T10:00:00.000Z",
    },
  ],
  pagination: { page: 1, limit: 10, totalPages: 1, totalRecords: 1 },
};

export function demoParticipants() {
  return {
    members: [
      { id: DEMO_MEMBER_ID, name: "Demo Member", email: "demo@example.test", isVerified: true },
      { id: "demo-speaker-1", name: "Aarav Sharma", email: "aarav@example.test", isVerified: true },
      { id: "demo-speaker-2", name: "Kabir Nair", email: "kabir@example.test", isVerified: true },
    ],
    cabinet: [],
    presidents: [],
  };
}

export function demoVerificationUsers() {
  const pending = [
    { id: "demo-pending-member", name: "Nisha Rao", email: "nisha@example.test", createdAt: "2026-07-20T10:00:00.000Z" },
    { id: "demo-pending-cabinet", name: "Arjun Mehta", email: "arjun@example.test", position: "Events Secretary", createdAt: "2026-07-19T10:00:00.000Z" },
  ];
  const verified = [
    { id: DEMO_MEMBER_ID, name: "Demo Member", email: "demo@example.test", createdAt: "2026-07-01T10:00:00.000Z" },
    { id: "demo-verified-president", name: "Mira Iyer", email: "mira@example.test", createdAt: "2026-06-25T10:00:00.000Z" },
  ];
  return {
    unverified: { unverifiedPresidents: [], unverifiedCabinet: [pending[1]], unverifiedMembers: [pending[0]] },
    verified: { verifiedPresidents: [verified[1]], verifiedCabinet: [], verifiedMembers: [verified[0]] },
  };
}

export function demoPublishedPairing(sessionId: string): { publishedPairing: PublishedPairingView; participantNames: Record<string, string> } {
  return {
    publishedPairing: {
      sessionId,
      proposalId: `demo-proposal-${sessionId}`,
      publishedAt: "2026-07-18T09:00:00.000Z",
      motionType: "IR",
      motionText: "This House would regulate algorithmic recommendations.",
      rooms: [{
        roomIndex: 1,
        roomScore: 0.82,
        roomBalanceScore: 0.84,
        roomDifficultyScore: 0.7,
        teams: [{ bpPosition: "OG", teamScore: 0.82, speakers: [
          { participantId: "demo-member", speakingRole: "PM" },
          { participantId: "demo-speaker-1", speakingRole: "DPM" },
        ] }],
        adjudicators: [{ participantId: "demo-adj-1", isChair: true, chairAssignmentScore: 0.9 }],
      }],
      unassignedParticipants: [],
    },
    participantNames: { [DEMO_MEMBER_ID]: "Demo Member", "demo-speaker-1": "Aarav Sharma", "demo-adj-1": "Mira Iyer" },
  };
}

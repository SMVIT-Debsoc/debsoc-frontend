// Mock fixtures for the pairing dashboard UI.
// Backend (docs/01..15) is not implemented yet — the UI renders against this
// data only. Replace with real fetches once the API routes (docs/14) exist.

export type AccountType = "Member" | "Cabinet" | "President";
export type SessionRole = "Speaker" | "Adjudicator" | "Chair";
export type BenchPos = "OG" | "OO" | "CG" | "CO";
export type SpeakingRole = "PM" | "DPM" | "LO" | "DLO" | "MG" | "GW" | "MO" | "OW";
export type Objective = "DEVELOPMENT" | "BALANCED" | "COMPETITIVE";
export type LifecycleState =
  | "Preparation"
  | "Generated"
  | "Approved"
  | "Published"
  | "Active"
  | "Completed"
  | "Scored";

export type Participant = {
  id: string;
  name: string;
  account: AccountType;
  yearOfStudy: number;
};

export const participants: Participant[] = [
  { id: "p01", name: "A. Sharma", account: "Member", yearOfStudy: 3 },
  { id: "p02", name: "R. Iyer", account: "Member", yearOfStudy: 2 },
  { id: "p03", name: "K. Nair", account: "Member", yearOfStudy: 1 },
  { id: "p04", name: "S. Rao", account: "Cabinet", yearOfStudy: 3 },
  { id: "p05", name: "M. Khan", account: "Cabinet", yearOfStudy: 2 },
  { id: "p06", name: "P. Das", account: "Member", yearOfStudy: 4 },
  { id: "p07", name: "V. Mehta", account: "President", yearOfStudy: 4 },
  { id: "p08", name: "L. Joshi", account: "Member", yearOfStudy: 2 },
  { id: "p09", name: "N. Bose", account: "Member", yearOfStudy: 3 },
  { id: "p10", name: "T. Singh", account: "Member", yearOfStudy: 1 },
  { id: "p11", name: "H. Patel", account: "Member", yearOfStudy: 2 },
  { id: "p12", name: "D. Chawla", account: "Member", yearOfStudy: 3 },
  { id: "p13", name: "G. Roy", account: "Member", yearOfStudy: 2 },
  { id: "p14", name: "U. Reddy", account: "Cabinet", yearOfStudy: 4 },
  { id: "p15", name: "I. Banerjee", account: "Member", yearOfStudy: 1 },
  { id: "p16", name: "F. Ali", account: "Member", yearOfStudy: 2 },
  { id: "p17", name: "B. Kapoor", account: "Member", yearOfStudy: 3 },
  { id: "p18", name: "C. Verma", account: "Member", yearOfStudy: 2 },
  { id: "p19", name: "Q. Shah", account: "Member", yearOfStudy: 1 },
  { id: "p20", name: "X. Menon", account: "Member", yearOfStudy: 3 },
  { id: "p21", name: "J. Pillai", account: "Member", yearOfStudy: 2 },
  { id: "p22", name: "O. Saha", account: "Member", yearOfStudy: 4 },
  { id: "p23", name: "Y. Dutta", account: "Member", yearOfStudy: 1 },
  { id: "p24", name: "E. Krishnan", account: "Member", yearOfStudy: 2 },
  { id: "p25", name: "Z. Hussain", account: "Cabinet", yearOfStudy: 3 },
  { id: "p26", name: "W. Naidu", account: "Member", yearOfStudy: 2 },
  { id: "p27", name: "AA. Sen", account: "Member", yearOfStudy: 3 },
  { id: "p28", name: "BB. Kumar", account: "Member", yearOfStudy: 1 },
  { id: "p29", name: "CC. Ahmed", account: "Member", yearOfStudy: 4 },
];

export const findParticipant = (id: string) =>
  participants.find((p) => p.id === id);

export type AttendanceEntry = {
  participantId: string;
  present: boolean;
  role: SessionRole | null; // null = not present / not assigned
};

export const initialAttendance: AttendanceEntry[] = participants.map(
  (p, i) => ({
    participantId: p.id,
    present: i < 23, // first 23 are present
    role:
      i < 23
        ? i < 16
          ? "Speaker"
          : "Adjudicator"
        : null,
  })
);

export type Speaker = {
  participantId: string;
  bench: BenchPos;
  role: SpeakingRole;
};

export type Team = {
  bench: BenchPos;
  speakers: Speaker[];
  score: number;
};

export type RoomAdjudicator = {
  participantId: string;
  isChair: boolean;
  chairAssignmentScore?: number;
};

export type Room = {
  index: number;
  teams: Team[];
  adjudicators: RoomAdjudicator[];
  roomScore: number;
  balanceScore: number;
  difficulty: number;
};

export type Proposal = {
  id: string;
  version: number;
  topBandRank: number;
  topBandSize: number;
  topBandProbability: number;
  objective: Objective;
  proposalScore: number;
  rooms: Room[];
  reserves: string[]; // adjudicator participant ids in reserve
  unassigned: { participantId: string; reason: string }[];
  status: "Generated" | "Approved" | "Overridden";
};

export const sampleProposal: Proposal = {
  id: "prop-3",
  version: 3,
  topBandRank: 2,
  topBandSize: 5,
  topBandProbability: 0.24,
  objective: "BALANCED",
  proposalScore: 0.81,
  status: "Generated",
  rooms: [
    {
      index: 1,
      teams: [
        {
          bench: "OG",
          score: 0.84,
          speakers: [
            { participantId: "p01", bench: "OG", role: "PM" },
            { participantId: "p02", bench: "OG", role: "DPM" },
          ],
        },
        {
          bench: "OO",
          score: 0.79,
          speakers: [
            { participantId: "p03", bench: "OO", role: "LO" },
            { participantId: "p04", bench: "OO", role: "DLO" },
          ],
        },
        {
          bench: "CG",
          score: 0.83,
          speakers: [
            { participantId: "p06", bench: "CG", role: "MG" },
            { participantId: "p08", bench: "CG", role: "GW" },
          ],
        },
        {
          bench: "CO",
          score: 0.76,
          speakers: [
            { participantId: "p09", bench: "CO", role: "MO" },
            { participantId: "p11", bench: "CO", role: "OW" },
          ],
        },
      ],
      adjudicators: [
        { participantId: "p07", isChair: true, chairAssignmentScore: 0.84 },
        { participantId: "p17", isChair: false },
        { participantId: "p18", isChair: false },
      ],
      roomScore: 0.83,
      balanceScore: 0.88,
      difficulty: 0.78,
    },
    {
      index: 2,
      teams: [
        {
          bench: "OG",
          score: 0.71,
          speakers: [
            { participantId: "p12", bench: "OG", role: "PM" },
            { participantId: "p13", bench: "OG", role: "DPM" },
          ],
        },
        {
          bench: "OO",
          score: 0.74,
          speakers: [
            { participantId: "p15", bench: "OO", role: "LO" },
            { participantId: "p16", bench: "OO", role: "DLO" },
          ],
        },
        {
          bench: "CG",
          score: 0.78,
          speakers: [
            { participantId: "p20", bench: "CG", role: "MG" },
            { participantId: "p21", bench: "CG", role: "GW" },
          ],
        },
        {
          bench: "CO",
          score: 0.72,
          speakers: [
            { participantId: "p24", bench: "CO", role: "MO" },
            { participantId: "p26", bench: "CO", role: "OW" },
          ],
        },
      ],
      adjudicators: [
        { participantId: "p14", isChair: true, chairAssignmentScore: 0.77 },
        { participantId: "p27", isChair: false },
      ],
      roomScore: 0.74,
      balanceScore: 0.79,
      difficulty: 0.62,
    },
  ],
  reserves: [],
  unassigned: [
    { participantId: "p22", reason: "Surplus speakers" },
    { participantId: "p23", reason: "Surplus speakers" },
    { participantId: "p28", reason: "Surplus speakers" },
    { participantId: "p29", reason: "Surplus speakers" },
    { participantId: "p10", reason: "Surplus speakers" },
    { participantId: "p19", reason: "Surplus speakers" },
    { participantId: "p25", reason: "Surplus adjudicator" },
  ],
};

export type SessionRow = {
  id: string;
  date: string;
  motionType: string;
  state: LifecycleState;
};

export const sessions: SessionRow[] = [
  { id: "s-27jun", date: "27 Jun 2026", motionType: "IR", state: "Generated" },
  { id: "s-20jun", date: "20 Jun 2026", motionType: "Policy", state: "Scored" },
  { id: "s-13jun", date: "13 Jun 2026", motionType: "Moral", state: "Scored" },
  { id: "s-06jun", date: "06 Jun 2026", motionType: "IR", state: "Scored" },
];

// ── Per-person progress profile (verdict layer) ─────────────────────────
export type ProgressProfile = {
  participantId: string;
  speakerTotal: number; // cumulative sum
  speakerStrength: number; // 0..1
  strengthConfidence: 0 | 1 | 2 | 3 | 4 | 5; // 0..5 dots
  sessionsSpoken: number;
  sessionsAdjudicated: number;
  sessionsChaired: number;
  perMotionTotal: { motion: string; total: number; lowData?: boolean }[];
  roleScores: { role: SpeakingRole; score: number; lowData?: boolean }[];
  partnerGood: string[];
  partnerFriction: { name: string; note: string }[];
  trend: "rising" | "flat" | "falling";
  verdict: string[];
};

export const progressByParticipant: Record<string, ProgressProfile> = {
  p01: {
    participantId: "p01",
    speakerTotal: 842,
    speakerStrength: 0.78,
    strengthConfidence: 4,
    sessionsSpoken: 12,
    sessionsAdjudicated: 1,
    sessionsChaired: 0,
    perMotionTotal: [
      { motion: "IR", total: 312 },
      { motion: "Policy", total: 280 },
      { motion: "Moral", total: 250 },
      { motion: "Feminism", total: 40, lowData: true },
      { motion: "Finance", total: 15, lowData: true },
    ],
    roleScores: [
      { role: "PM", score: 0.81 },
      { role: "DPM", score: 0.77 },
      { role: "LO", score: 0.66 },
      { role: "MO", score: 0.52, lowData: true },
      { role: "OW", score: 0.5, lowData: true },
    ],
    partnerGood: ["R. Iyer"],
    partnerFriction: [
      { name: "S. Rao", note: "weaker results in Policy" },
      { name: "K. Nair", note: "few sessions together" },
    ],
    trend: "rising",
    verdict: [
      "Strong in IR; weak in Feminism",
      "Few debates on Finance — needs more data there",
      "Good as PM / DPM; weaker as Whip",
      "Pairs well with R. Iyer; friction with S. Rao on Policy",
      "Trend: rising over last 6 sessions",
    ],
  },
  p03: {
    participantId: "p03",
    speakerTotal: 210,
    speakerStrength: 0.61,
    strengthConfidence: 2,
    sessionsSpoken: 3,
    sessionsAdjudicated: 0,
    sessionsChaired: 0,
    perMotionTotal: [
      { motion: "IR", total: 120 },
      { motion: "Policy", total: 90, lowData: true },
    ],
    roleScores: [
      { role: "LO", score: 0.62, lowData: true },
      { role: "PM", score: 0.58, lowData: true },
    ],
    partnerGood: [],
    partnerFriction: [],
    trend: "flat",
    verdict: [
      "Limited data so far — verdict will sharpen with more sessions",
      "Early signal: comfortable as LO",
    ],
  },
  p07: {
    participantId: "p07",
    speakerTotal: 1240,
    speakerStrength: 0.86,
    strengthConfidence: 5,
    sessionsSpoken: 9,
    sessionsAdjudicated: 6,
    sessionsChaired: 4,
    perMotionTotal: [
      { motion: "IR", total: 480 },
      { motion: "Policy", total: 420 },
      { motion: "Moral", total: 340 },
    ],
    roleScores: [
      { role: "PM", score: 0.86 },
      { role: "OW", score: 0.83 },
      { role: "MG", score: 0.79 },
    ],
    partnerGood: ["A. Sharma", "R. Iyer"],
    partnerFriction: [],
    trend: "flat",
    verdict: [
      "Consistent across motion types",
      "Strong chair record (4 sessions)",
      "Reliable as PM and OW",
    ],
  },
};

export const defaultProgress = (p: Participant): ProgressProfile => ({
  participantId: p.id,
  speakerTotal: 0,
  speakerStrength: 0,
  strengthConfidence: 0,
  sessionsSpoken: 0,
  sessionsAdjudicated: 0,
  sessionsChaired: 0,
  perMotionTotal: [],
  roleScores: [],
  partnerGood: [],
  partnerFriction: [],
  trend: "flat",
  verdict: ["No sessions yet — no verdict to show."],
});

// ── Leaderboards ─────────────────────────────────────────────────────────
export type SpeakerLeaderRow = {
  participantId: string;
  total: number;
  motionTotals: Record<string, number>;
};

export const speakerLeaderboard: SpeakerLeaderRow[] = [
  { participantId: "p07", total: 1240, motionTotals: { IR: 480, Policy: 420, Moral: 340 } },
  { participantId: "p01", total: 842, motionTotals: { IR: 312, Policy: 280, Moral: 250 } },
  { participantId: "p06", total: 760, motionTotals: { IR: 290, Policy: 230, Moral: 240 } },
  { participantId: "p02", total: 590, motionTotals: { IR: 210, Policy: 200, Moral: 180 } },
  { participantId: "p04", total: 540, motionTotals: { IR: 180, Policy: 200, Moral: 160 } },
  { participantId: "p05", total: 480, motionTotals: { IR: 160, Policy: 170, Moral: 150 } },
  { participantId: "p09", total: 420, motionTotals: { IR: 150, Policy: 130, Moral: 140 } },
  { participantId: "p11", total: 360, motionTotals: { IR: 130, Policy: 110, Moral: 120 } },
  { participantId: "p03", total: 210, motionTotals: { IR: 120, Policy: 90 } },
];

export type AdjLeaderRow = {
  participantId: string;
  average: number;
  sessionsAdjudicated: number;
  sessionsChaired: number;
};

export const adjudicatorLeaderboard: AdjLeaderRow[] = [
  { participantId: "p07", average: 8.6, sessionsAdjudicated: 6, sessionsChaired: 4 },
  { participantId: "p14", average: 8.2, sessionsAdjudicated: 5, sessionsChaired: 2 },
  { participantId: "p04", average: 7.9, sessionsAdjudicated: 4, sessionsChaired: 1 },
  { participantId: "p25", average: 7.4, sessionsAdjudicated: 3, sessionsChaired: 0 },
  { participantId: "p17", average: 7.1, sessionsAdjudicated: 2, sessionsChaired: 0 },
];

// ── Scoring tasks (post-session) ─────────────────────────────────────────
export type ScoringTask = {
  sessionId: string;
  date: string;
  motionType: string;
  sessionRole: SessionRole;
  // For speakers: their assigned chair (target of rating)
  assignedChairId?: string;
  // For chairs: room they chaired
  roomIndex?: number;
  roomSpeakers?: { participantId: string; bench: BenchPos; role: SpeakingRole }[];
  roomAdjudicators?: string[]; // panel ids
  submitted: boolean;
};

export const myScoringTasks: ScoringTask[] = [
  {
    sessionId: "s-27jun",
    date: "27 Jun 2026",
    motionType: "IR",
    sessionRole: "Speaker",
    assignedChairId: "p07",
    submitted: false,
  },
  {
    sessionId: "s-20jun",
    date: "20 Jun 2026",
    motionType: "Policy",
    sessionRole: "Chair",
    roomIndex: 2,
    roomSpeakers: [
      { participantId: "p12", bench: "OG", role: "PM" },
      { participantId: "p13", bench: "OG", role: "DPM" },
      { participantId: "p15", bench: "OO", role: "LO" },
      { participantId: "p16", bench: "OO", role: "DLO" },
      { participantId: "p20", bench: "CG", role: "MG" },
      { participantId: "p21", bench: "CG", role: "GW" },
      { participantId: "p24", bench: "CO", role: "MO" },
      { participantId: "p26", bench: "CO", role: "OW" },
    ],
    roomAdjudicators: ["p27"],
    submitted: false,
  },
  {
    sessionId: "s-13jun",
    date: "13 Jun 2026",
    motionType: "Moral",
    sessionRole: "Adjudicator",
    submitted: true,
  },
];

// ── My pairing (participant self-view of a published session) ────────────
export type MyPairingView = {
  sessionId: string;
  date: string;
  motionType: string;
  motion: string;
  sessionRole: SessionRole;
  roomIndex?: number;
  bench?: BenchPos;
  speakingRole?: SpeakingRole;
  teammate?: string;
  chair?: string;
  state: LifecycleState;
};

export const myPairing: MyPairingView = {
  sessionId: "s-20jun",
  date: "20 Jun 2026",
  motionType: "Policy",
  motion: "This House would tax large language model providers per query.",
  sessionRole: "Speaker",
  roomIndex: 1,
  bench: "OG",
  speakingRole: "PM",
  teammate: "R. Iyer",
  chair: "V. Mehta",
  state: "Published",
};

// ── Scoring status (admin oversight) ────────────────────────────────────
export type ScoringStatus = {
  sessionId: string;
  speakerFormsExpected: number;
  speakerFormsSubmitted: number;
  chairFormsExpected: number;
  chairFormsSubmitted: number;
  pendingSpeakerIds: string[];
  pendingChairIds: string[];
  status: "Pending" | "Open" | "Partial" | "Complete";
};

export const scoringStatus: ScoringStatus = {
  sessionId: "s-27jun",
  speakerFormsExpected: 16,
  speakerFormsSubmitted: 14,
  chairFormsExpected: 2,
  chairFormsSubmitted: 2,
  pendingSpeakerIds: ["p09", "p11"],
  pendingChairIds: [],
  status: "Partial",
};

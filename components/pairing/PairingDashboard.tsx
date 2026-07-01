"use client";

import React, { useEffect, useState } from "react";
import AdminPairingDashboard from "./AdminPairingDashboard";
import ParticipantPairingDashboard from "./ParticipantPairingDashboard";
import type {
  AttendanceHistoryItem,
  LeaderboardRow,
  Participant,
  ProgressSummary,
  SessionRow,
} from "./types";

type PairingDashboardProps = {
  role: string;
  userName: string;
  embedded?: boolean;
};


type PairingDataState = {
  participants: Participant[];
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  leaderboard: LeaderboardRow[];
  progressSummaries: ProgressSummary[];
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;
  leaderboardScope: "all" | "bi-monthly";
};

const INITIAL_STATE: PairingDataState = {
  participants: [],
  sessions: [],
  attendanceHistory: [],
  leaderboard: [],
  progressSummaries: [],
  loading: true,
  loadingLeaderboard: true,
  error: null,
  leaderboardError: null,
  leaderboardScope: "all",
};

export default function PairingDashboard({
  role,
  userName,
  embedded = false,
}: PairingDashboardProps) {
  const [state, setState] = useState<PairingDataState>(INITIAL_STATE);
  const isAdminView =
    role === "cabinet" || role === "President" || role === "TechHead";

  useEffect(() => {
    let cancelled = false;

    async function loadPrimaryData() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const data = await fetchPrimaryData(role);
        if (cancelled) return;
        setState((current) => ({
          ...current,
          ...data,
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load pairing data.",
        }));
      }
    }

    loadPrimaryData();

    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setState((current) => ({
        ...current,
        loadingLeaderboard: true,
        leaderboardError: null,
      }));

      try {
        const leaderboard = await fetchLeaderboard(state.leaderboardScope);
        if (cancelled) return;
        setState((current) => ({
          ...current,
          leaderboard,
          loadingLeaderboard: false,
          leaderboardError: null,
        }));
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          leaderboard: [],
          loadingLeaderboard: false,
          leaderboardError:
            error instanceof Error ? error.message : "Failed to load leaderboard.",
        }));
      }
    }

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [state.leaderboardScope]);

  if (!embedded) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
        <div className="sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-3 text-white lg:hidden">
          <div className="flex items-center gap-2 font-semibold">
            <span>Pairing</span>
          </div>
        </div>

        <aside className="hidden w-64 bg-slate-900 p-5 text-slate-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="mb-8 text-white font-semibold tracking-wide">Pairing</div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {isAdminView ? (
            <AdminPairingDashboard
              role={role}
              userName={userName}
              participants={state.participants}
              sessions={state.sessions}
              onSessionsChange={(sessions) =>
                setState((current) => ({ ...current, sessions }))
              }
              attendanceHistory={state.attendanceHistory}
              leaderboard={state.leaderboard}
              progressSummaries={state.progressSummaries}
              leaderboardScope={state.leaderboardScope}
              loading={state.loading}
              loadingLeaderboard={state.loadingLeaderboard}
              error={state.error}
              leaderboardError={state.leaderboardError}
              onLeaderboardScopeChange={(scope) =>
                setState((current) => ({ ...current, leaderboardScope: scope }))
              }
              embedded
            />
          ) : (
            <ParticipantPairingDashboard
              role={role}
              sessions={state.sessions}
              attendanceHistory={state.attendanceHistory}
              leaderboard={state.leaderboard}
              leaderboardScope={state.leaderboardScope}
              loading={state.loading}
              loadingLeaderboard={state.loadingLeaderboard}
              error={state.error}
              leaderboardError={state.leaderboardError}
              onLeaderboardScopeChange={(scope) =>
                setState((current) => ({ ...current, leaderboardScope: scope }))
              }
            />
          )}
        </main>
      </div>
    );
  }

  if (isAdminView) {
    return (
      <AdminPairingDashboard
        role={role}
        userName={userName}
        participants={state.participants}
        sessions={state.sessions}
        onSessionsChange={(sessions) =>
          setState((current) => ({ ...current, sessions }))
        }
        attendanceHistory={state.attendanceHistory}
        leaderboard={state.leaderboard}
        progressSummaries={state.progressSummaries}
        leaderboardScope={state.leaderboardScope}
        loading={state.loading}
        loadingLeaderboard={state.loadingLeaderboard}
        error={state.error}
        leaderboardError={state.leaderboardError}
        onLeaderboardScopeChange={(scope) =>
          setState((current) => ({ ...current, leaderboardScope: scope }))
        }
        embedded={embedded}
      />
    );
  }

  return (
    <ParticipantPairingDashboard
      role={role}
      sessions={state.sessions}
      attendanceHistory={state.attendanceHistory}
      leaderboard={state.leaderboard}
      leaderboardScope={state.leaderboardScope}
      loading={state.loading}
      loadingLeaderboard={state.loadingLeaderboard}
      error={state.error}
      leaderboardError={state.leaderboardError}
      onLeaderboardScopeChange={(scope) =>
        setState((current) => ({ ...current, leaderboardScope: scope }))
      }
    />
  );
}

async function fetchPrimaryData(role: string) {
  if (role === "cabinet" || role === "President" || role === "TechHead") {
    const [bootstrap, attendance, progress] = await Promise.all([
      fetchJson<{
        members: ApiMember[];
        cabinet: ApiCabinet[];
        presidents?: ApiPresident[];
        sessions: ApiAdminSession[];
      }>("/api/pairing/bootstrap"),
      fetchJson<{ attendance: ApiAttendanceHistory[] }>("/api/pairing/attendance/self"),
      role === "TechHead"
        ? Promise.resolve({ participants: [] as ApiProgressSummary[] })
        : fetchJson<{ participants: ApiProgressSummary[] }>("/api/progress/members"),
    ]);

    return {
      participants: normalizeParticipants(bootstrap),
      sessions: bootstrap.sessions.map(normalizeAdminSession),
      attendanceHistory: (attendance.attendance ?? []).map(normalizeAttendanceHistory),
      progressSummaries: (progress.participants ?? []).map(normalizeProgressSummary),
    };
  }

  const attendance = await fetchJson<{ attendance: ApiAttendanceHistory[] }>(
    "/api/pairing/attendance/self",
  );
  const attendanceHistory = (attendance.attendance ?? []).map(normalizeAttendanceHistory);

  return {
    participants: [],
    sessions: deriveSessionsFromAttendance(attendanceHistory),
    attendanceHistory,
    progressSummaries: [],
  };
}

async function fetchLeaderboard(scope: "all" | "bi-monthly") {
  const suffix = scope === "bi-monthly" ? "?type=bi-monthly" : "";
  const data = await fetchJson<{ leaderboard: ApiSpeakerLeaderboardEntry[] }>(
    `/api/leaderboard/speakers${suffix}`,
  );
  return (data.leaderboard ?? []).map((entry) => ({
    id: entry.participantId,
    name: entry.name,
    type: "Participant",
    score: entry.score,
    sessions: entry.sessionsCount,
    rank: entry.rank,
  }));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = `Request failed for ${url}`;
    throw new Error(await readApiError(response, fallback));
  }

  return (await response.json()) as T;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string };
    if (data.message && data.message.trim()) {
      return data.message;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function normalizeParticipants(roster: {
  members: ApiMember[];
  cabinet: ApiCabinet[];
  presidents?: ApiPresident[];
}): Participant[] {
  return [
    ...(roster.members ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      account: "Member" as const,
      isVerified: member.isVerified,
    })),
    ...(roster.cabinet ?? []).map((cabinet) => ({
      id: cabinet.id,
      name: cabinet.name,
      email: cabinet.email,
      account: "Cabinet" as const,
      position: cabinet.position,
      isVerified: cabinet.isVerified,
    })),
    ...((roster.presidents ?? []).map((president) => ({
      id: president.id,
      name: president.name,
      email: president.email,
      account: "President" as const,
      isVerified: president.isVerified,
    })) ?? []),
  ].sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeAdminSession(session: ApiAdminSession): SessionRow {
  return {
    id: session.id,
    date: formatDate(session.sessionDate),
    motionType: session.motionType ?? session.motiontype,
    chair: session.Chair,
    assignedChairLabel: deriveAssignedChairLabel(session),
    participantAssignmentLabels: deriveParticipantAssignmentLabels(session),
    state: deriveLifecycleState(session),
    attendance: session.attendance ?? [],
  };
}

function normalizeAttendanceHistory(item: ApiAttendanceHistory): AttendanceHistoryItem {
  return {
    id: item.id,
    participantId: item.memberId ?? item.cabinetId ?? item.presidentId ?? undefined,
    status: item.status,
    speakerScore: item.speakerScore ?? null,
    pairingCode: item.pairingCode ?? null,
    debatedAlone: Boolean(item.debatedAlone),
    pairedWith: item.pairedWith ?? [],
    session: {
      id: item.session.id,
      sessionDate: formatDate(item.session.sessionDate),
      motiontype: item.session.motiontype,
      Chair: item.session.Chair,
    },
  };
}

function deriveAssignedChairLabel(session: ApiAdminSession) {
  const proposal = session.publishedProposal ?? session.acceptedProposal;
  const chairNames = proposal?.roomAssignments
    .flatMap((room) => room.adjudicatorAssignments)
    .filter((adjudicator) => adjudicator.isChair)
    .map((adjudicator) => adjudicator.member?.name ?? adjudicator.cabinet?.name ?? adjudicator.president?.name ?? null)
    .filter((name): name is string => Boolean(name)) ?? [];

  if (chairNames.length === 0) {
    return session.Chair;
  }

  return chairNames.join(", ");
}

function deriveParticipantAssignmentLabels(session: ApiAdminSession) {
  const proposal = session.publishedProposal ?? session.acceptedProposal;
  const labels: Record<string, string> = {};

  proposal?.roomAssignments.forEach((room) => {
    room.teamAssignments.forEach((team) => {
      team.speakerAssignments.forEach((speaker) => {
        const participantId = speaker.member?.id ?? speaker.cabinet?.id ?? speaker.president?.id;
        if (!participantId) {
          return;
        }

        labels[participantId] = speaker.speakingRole;
      });
    });

    room.adjudicatorAssignments.forEach((adjudicator) => {
      const participantId = adjudicator.member?.id ?? adjudicator.cabinet?.id ?? adjudicator.president?.id;
      if (!participantId) {
        return;
      }

      labels[participantId] = adjudicator.isChair ? "Chair" : "Panel";
    });
  });

  return labels;
}

function deriveSessionsFromAttendance(attendanceHistory: AttendanceHistoryItem[]): SessionRow[] {
  return attendanceHistory.map((item) => ({
    id: item.session.id,
    date: item.session.sessionDate,
    motionType: item.session.motiontype,
    chair: item.session.Chair,
    state: item.speakerScore !== null ? "Scored" : "Published",
  }));
}

function deriveLifecycleState(session: {
  pairingStatus?: string | null;
  publicationStatus?: string | null;
  scoringStatus?: string | null;
  attendance?: Array<{
    status: string;
    pairingCode?: string | null;
    debatedAlone?: boolean;
    speakerScore?: number | null;
  }>;
}): SessionRow["state"] {
  const pairingStatus = session.pairingStatus?.toUpperCase();
  const publicationStatus = session.publicationStatus?.toUpperCase();
  const scoringStatus = session.scoringStatus?.toLowerCase();

  if (scoringStatus === "complete") {
    return "Scored";
  }

  if (publicationStatus === "PUBLISHED" || pairingStatus === "PUBLISHED") {
    return "Published";
  }

  if (pairingStatus === "APPROVED") {
    return "Approved";
  }

  if (pairingStatus === "GENERATED") {
    return "Generated";
  }

  const attendance = session.attendance ?? [];
  const present = attendance.filter((entry) => entry.status === "Present");
  if (present.some((entry) => entry.speakerScore !== null && entry.speakerScore !== undefined)) {
    return "Scored";
  }
  return "Preparation";
}

function normalizeProgressSummary(summary: ApiProgressSummary): ProgressSummary {
  return {
    participantId: summary.participantId,
    speakerTotalScore: summary.speakerTotalScore,
    speakerStrength: summary.speakerStrength,
    confidence: summary.confidence,
    sessionsSpoken: summary.sessionsSpoken,
    sessionsAdjudicated: summary.sessionsAdjudicated,
    sessionsChaired: summary.sessionsChaired,
    dataMaturity: summary.dataMaturity,
  };
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type ApiMember = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
};

type ApiCabinet = {
  id: string;
  name: string;
  email: string;
  position: string;
  isVerified: boolean;
};

type ApiPresident = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
};

type ApiAdminSession = {
  id: string;
  sessionDate: string;
  motiontype: string;
  motionType?: string | null;
  motionText?: string | null;
  pairingObjective?: string | null;
  pairingStatus?: string | null;
  publicationStatus?: string | null;
  scoringStatus?: string | null;
  Chair: string;
  attendance?: Array<{
    id: string;
    status: string;
    pairingCode?: string | null;
    debatedAlone?: boolean;
    speakerScore?: number | null;
    member?: { id: string; name: string } | null;
    cabinet?: { id: string; name: string } | null;
    president?: { id: string; name: string } | null;
  }>;
  acceptedProposal?: {
    roomAssignments: Array<{
      teamAssignments: Array<{
        bpPosition: string;
        speakerAssignments: Array<{
          speakingRole: string;
          member?: { id: string; name: string } | null;
          cabinet?: { id: string; name: string } | null;
          president?: { id: string; name: string } | null;
        }>;
      }>;
      adjudicatorAssignments: Array<{
        isChair: boolean;
        member?: { id: string; name: string } | null;
        cabinet?: { id: string; name: string } | null;
        president?: { id: string; name: string } | null;
      }>;
    }>;
  } | null;
  publishedProposal?: {
    roomAssignments: Array<{
      teamAssignments: Array<{
        bpPosition: string;
        speakerAssignments: Array<{
          speakingRole: string;
          member?: { id: string; name: string } | null;
          cabinet?: { id: string; name: string } | null;
          president?: { id: string; name: string } | null;
        }>;
      }>;
      adjudicatorAssignments: Array<{
        isChair: boolean;
        member?: { id: string; name: string } | null;
        cabinet?: { id: string; name: string } | null;
        president?: { id: string; name: string } | null;
      }>;
    }>;
  } | null;
};

type ApiAttendanceHistory = {
  id: string;
  memberId?: string | null;
  cabinetId?: string | null;
  presidentId?: string | null;
  status: string;
  speakerScore: number | null;
  pairingCode: string | null;
  debatedAlone: boolean;
  pairedWith?: string[];
  session: {
    id: string;
    sessionDate: string | Date;
    motiontype: string;
    Chair: string;
  };
};

type ApiProgressSummary = {
  participantId: string;
  speakerTotalScore: number;
  speakerStrength: number;
  confidence: number;
  sessionsSpoken: number;
  sessionsAdjudicated: number;
  sessionsChaired: number;
  dataMaturity: "LOW" | "MEDIUM" | "HIGH";
};

type ApiSpeakerLeaderboardEntry = {
  participantId: string;
  name: string;
  score: number;
  rank: number;
  sessionsCount: number;
};

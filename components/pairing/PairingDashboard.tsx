"use client";

import React, { useEffect, useState } from "react";
import AdminPairingDashboard from "./AdminPairingDashboard";
import ParticipantPairingDashboard from "./ParticipantPairingDashboard";
import type {
  AttendanceHistoryItem,
  LeaderboardRow,
  Participant,
  SessionRow,
} from "./types";

type PairingDashboardProps = {
  role: string;
  userName: string;
};

type PairingDataState = {
  participants: Participant[];
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  leaderboard: LeaderboardRow[];
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
  loading: true,
  loadingLeaderboard: true,
  error: null,
  leaderboardError: null,
  leaderboardScope: "all",
};

export default function PairingDashboard({
  role,
  userName,
}: PairingDashboardProps) {
  const [state, setState] = useState<PairingDataState>(INITIAL_STATE);
  const isAdmin = role === "cabinet" || role === "President" || role === "TechHead";

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

  if (isAdmin) {
    return (
      <AdminPairingDashboard
        role={role}
        userName={userName}
        participants={state.participants}
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
    const [bootstrap, attendance] = await Promise.all([
      fetchJson<{
        members: ApiMember[];
        cabinet: ApiCabinet[];
        presidents?: ApiPresident[];
        sessions: ApiAdminSession[];
      }>("/api/pairing/bootstrap"),
      fetchJson<{ attendance: ApiAttendanceHistory[] }>("/api/pairing/attendance/self"),
    ]);

    return {
      participants: normalizeParticipants(bootstrap),
      sessions: bootstrap.sessions.map(normalizeAdminSession),
      attendanceHistory: (attendance.attendance ?? []).map(normalizeAttendanceHistory),
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
  };
}

async function fetchLeaderboard(scope: "all" | "bi-monthly") {
  const suffix = scope === "bi-monthly" ? "?type=bi-monthly" : "";
  const data = await fetchJson<{ leaderboard: LeaderboardRow[] }>(
    `/api/leaderboard${suffix}`,
  );
  return data.leaderboard ?? [];
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
    motionType: session.motiontype,
    chair: session.Chair,
    state: deriveLifecycleState(
      (session.attendance ?? []).map((entry) => ({
        status: entry.status,
        pairingCode: entry.pairingCode,
        debatedAlone: entry.debatedAlone,
        speakerScore: entry.speakerScore ?? null,
      })),
    ),
    attendance: session.attendance ?? [],
  };
}

function normalizeAttendanceHistory(item: ApiAttendanceHistory): AttendanceHistoryItem {
  return {
    id: item.id,
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

function deriveSessionsFromAttendance(attendanceHistory: AttendanceHistoryItem[]): SessionRow[] {
  return attendanceHistory.map((item) => ({
    id: item.session.id,
    date: item.session.sessionDate,
    motionType: item.session.motiontype,
    chair: item.session.Chair,
    state: item.speakerScore !== null ? "Scored" : "Published",
  }));
}

function deriveLifecycleState(
  attendance: Array<{
    status: string;
    pairingCode?: string | null;
    debatedAlone?: boolean;
    speakerScore?: number | null;
  }>,
): SessionRow["state"] {
  const present = attendance.filter((entry) => entry.status === "Present");

  if (present.length === 0) {
    return "Preparation";
  }

  if (present.some((entry) => entry.speakerScore !== null && entry.speakerScore !== undefined)) {
    return "Scored";
  }

  if (
    present.some(
      (entry) =>
        Boolean(entry.debatedAlone) ||
        Boolean(entry.pairingCode && entry.pairingCode.trim().length > 0),
    )
  ) {
    return "Published";
  }

  return "Preparation";
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
  Chair: string;
  attendance?: Array<{
    id: string;
    status: string;
    pairingCode?: string | null;
    debatedAlone?: boolean;
    speakerScore?: number | null;
    member?: { id: string; name: string } | null;
    cabinet?: { id: string; name: string } | null;
  }>;
};

type ApiAttendanceHistory = {
  id: string;
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

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, SectionHeader, StateBadge } from "./ui";
import type { AttendanceHistoryItem, SessionRow } from "./types";
import type { PublishedPairingView } from "@/types/pairing";

type MyPairingProps = {
  role: string;
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
};

type PublishedPairingResponse = {
  publishedPairing: PublishedPairingView;
};

type ParticipantRoomView = {
  roomIndex: number;
  assignmentLabel: string;
  teamLabel: string | null;
  teammates: string[];
  chair: string | null;
  panel: string[];
  teams: Array<{
    bpPosition: string;
    speakers: Array<{ name: string; speakingRole: string }>;
  }>;
};

function isPublishedLike(session: SessionRow) {
  return session.state === "Published" || session.state === "Scored" || session.state === "Completed";
}

function participantNameMap(session: SessionRow) {
  return Object.fromEntries(
    (session.attendance ?? []).flatMap((entry) => {
      const participantId = entry.member?.id ?? entry.cabinet?.id ?? entry.president?.id ?? null;
      const name = entry.member?.name ?? entry.cabinet?.name ?? entry.president?.name ?? null;
      return participantId && name ? [[participantId, name]] : [];
    }),
  ) as Record<string, string>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed for ${url}`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) {
        message = data.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export default function MyPairing({ role, sessions, attendanceHistory }: MyPairingProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionViews, setSessionViews] = useState<Array<{
    session: SessionRow;
    publishedPairing: PublishedPairingView;
    room: ParticipantRoomView | null;
  }>>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const currentParticipantId = attendanceHistory.find((item) => item.participantId)?.participantId ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadPairings() {
      setLoading(true);
      setError(null);

      if (!currentParticipantId) {
        setSessionViews([]);
        setLoading(false);
        return;
      }

      try {
        const candidateSessions = sessions.filter(isPublishedLike);
        const loaded = await Promise.all(
          candidateSessions.map(async (session) => {
            const response = await fetchJson<PublishedPairingResponse>(`/api/pairing/published/${session.id}`);
            const publishedPairing = response.publishedPairing;
            const names = participantNameMap(session);
            const room = buildParticipantRoomView(session, publishedPairing, currentParticipantId, names);
            return { session, publishedPairing, room };
          }),
        );

        const relevant = loaded
          .filter((entry) => entry.room !== null)
          .sort((a, b) => (b.session.date ?? "").localeCompare(a.session.date ?? ""))
          .slice(0, 1);
        if (cancelled) return;
        setSessionViews(relevant);
        setSelectedSessionId((current) => current ?? relevant[0]?.session.id ?? null);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Failed to load your pairing view.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPairings();
    return () => {
      cancelled = true;
    };
  }, [currentParticipantId, sessions]);

  const selected = useMemo(
    () => sessionViews.find((entry) => entry.session.id === selectedSessionId) ?? sessionViews[0] ?? null,
    [selectedSessionId, sessionViews],
  );

  if (loading) {
    return <EmptyState title="Loading pairing" body="Fetching your published room assignment." />;
  }

  if (error) {
    console.error("[pairing]", error);
    return (
      <EmptyState
        title="My pairing unavailable"
        body="Please refresh the page or try again in a moment."
      />
    );
  }

  if (!selected || !selected.room) {
    return (
      <div>
        <SectionHeader
          title="My Pairing"
          subtitle="Published self-view from the official pairing route."
        />
        <EmptyState
          title="No linked pairing record yet"
          body={
            role === "TechHead"
              ? "TechHead does not receive a published participant pairing view."
              : "You do not currently appear in any published room assignment. Once a session is published with your room, it will show here."
          }
        />
      </div>
    );
  }

  const room = selected.room;

  return (
    <div>
      <SectionHeader
        title="My Pairing"
        subtitle={`${selected.session.date} | Motion type: ${selected.publishedPairing.motionType}`}
        right={<StateBadge state="Published" />}
      />

      {sessionViews.length > 1 && (
        <div className="mb-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          {sessionViews.map((entry) => (
            <button
              key={entry.session.id}
              type="button"
              onClick={() => setSelectedSessionId(entry.session.id)}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-sm ${selected.session.id === entry.session.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]"}`}
            >
              {entry.session.date}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-5">
        <Card className="overflow-hidden border-indigo-200 dark:border-indigo-400/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(15,23,42,0.04))]">
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-900/10 bg-slate-950 p-4 sm:p-5 text-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-indigo-300">Your assignment</div>
                  <div className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight truncate">{room.assignmentLabel}</div>
                </div>
                <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-300">Room</div>
                  <div className="text-xl font-semibold text-indigo-200 leading-tight">{room.roomIndex}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-300 truncate">
                {room.teamLabel ?? "Adjudicator panel"} · Chair: {room.chair ?? "TBD"}
              </div>
            </div>

            <div className="hidden lg:grid gap-4">
              <div className="rounded-3xl border border-indigo-200 dark:border-indigo-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Teammates</div>
                <div className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                  {room.teammates.length > 0 ? room.teammates.join(", ") : "None"}
                </div>
              </div>
              <div className="rounded-3xl border border-indigo-200 dark:border-indigo-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Panel adjudicators</div>
                <div className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                  {room.panel.length > 0 ? room.panel.join(", ") : "None"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            <Info label="Teammates" value={room.teammates.length > 0 ? room.teammates.join(", ") : "None"} />
            <Info label="Panel adjudicators" value={room.panel.length > 0 ? room.panel.join(", ") : "None"} />
          </div>

          <div className="lg:hidden my-4 border-t border-slate-200 dark:border-white/10" />

          <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Full room pairing</h3>
          <div className="grid grid-cols-2 gap-3">
            {room.teams.map((team) => (
              <div key={team.bpPosition} className="rounded-xl border border-slate-200 dark:border-white/10 p-3 sm:p-4">
                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{team.bpPosition}</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {team.speakers.map((speaker) => `${speaker.name} (${speaker.speakingRole})`).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildParticipantRoomView(
  session: SessionRow,
  publishedPairing: PublishedPairingView,
  participantId: string,
  names: Record<string, string>,
): ParticipantRoomView | null {
  const room = publishedPairing.rooms.find(
    (entry) =>
      entry.teams.some((team) => team.speakers.some((speaker) => speaker.participantId === participantId)) ||
      entry.adjudicators.some((adjudicator) => adjudicator.participantId === participantId),
  );

  if (!room) {
    return null;
  }

  const myTeam = room.teams.find((team) => team.speakers.some((speaker) => speaker.participantId === participantId)) ?? null;
  const mySpeaker = myTeam?.speakers.find((speaker) => speaker.participantId === participantId) ?? null;
  const myAdjudicator = room.adjudicators.find((adjudicator) => adjudicator.participantId === participantId) ?? null;
  const chair = room.adjudicators.find((adjudicator) => adjudicator.isChair) ?? null;

  return {
    roomIndex: room.roomIndex,
    assignmentLabel: mySpeaker?.speakingRole ?? (myAdjudicator?.isChair ? "Chair" : myAdjudicator ? "Panel adjudicator" : session.participantAssignmentLabels?.[participantId] ?? "Assigned"),
    teamLabel: myTeam?.bpPosition ?? null,
    teammates: (myTeam?.speakers ?? [])
      .filter((speaker) => speaker.participantId !== participantId)
      .map((speaker) => names[speaker.participantId] ?? speaker.participantId),
    chair: chair ? names[chair.participantId] ?? session.assignedChairLabel ?? chair.participantId : session.assignedChairLabel ?? null,
    panel: room.adjudicators
      .filter((adjudicator) => !adjudicator.isChair)
      .map((adjudicator) => names[adjudicator.participantId] ?? adjudicator.participantId),
    teams: room.teams
      .slice()
      .sort((left, right) => bpPositionOrder(left.bpPosition) - bpPositionOrder(right.bpPosition))
      .map((team) => ({
        bpPosition: team.bpPosition,
        speakers: team.speakers.map((speaker) => ({
          name: names[speaker.participantId] ?? speaker.participantId,
          speakingRole: speaker.speakingRole,
        })),
      })),
  };
}

function bpPositionOrder(position: string) {
  return ["OG", "OO", "CG", "CO"].indexOf(position);
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

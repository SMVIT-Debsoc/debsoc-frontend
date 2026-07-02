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

        const relevant = loaded.filter((entry) => entry.room !== null);
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
        <div className="mb-4 flex flex-wrap gap-2">
          {sessionViews.map((entry) => (
            <button
              key={entry.session.id}
              type="button"
              onClick={() => setSelectedSessionId(entry.session.id)}
              className={`rounded-md border px-3 py-1.5 text-sm ${selected.session.id === entry.session.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]"}`}
            >
              {entry.session.date}
            </button>
          ))}
        </div>
      )}

      <Card className="p-5">
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <Info label="Room" value={`Room ${room.roomIndex}`} />
          <Info label="Your assignment" value={room.assignmentLabel} />
          <Info label="Your team" value={room.teamLabel ?? "Adjudicator panel"} />
          <Info label="Chair" value={room.chair ?? "TBD"} />
          <Info label="Teammates" value={room.teammates.length > 0 ? room.teammates.join(", ") : "None"} />
          <Info label="Panel adjudicators" value={room.panel.length > 0 ? room.panel.join(", ") : "None"} />
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 pt-5">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Full room pairing</h3>
          <div className="space-y-3">
            {room.teams.map((team) => (
              <div key={team.bpPosition} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{team.bpPosition}</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {team.speakers.map((speaker) => `${speaker.name} (${speaker.speakingRole})`).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
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

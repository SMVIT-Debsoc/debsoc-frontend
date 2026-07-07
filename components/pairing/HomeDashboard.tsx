"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Calendar, ChevronRight, Gauge, Trophy, Users } from "lucide-react";
import { Card, EmptyState, Pill, PrimaryButton } from "./ui";
import type {
  AdjudicatorLeaderboardRow,
  AttendanceHistoryItem,
  ProgressProfile,
  SessionRow,
  SpeakerLeaderboardRow,
} from "./types";
import type { PublishedPairingView } from "@/types/pairing";

type HomeDashboardProps = {
  role: string;
  userName: string;
  position?: string | null;
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  participants: { id: string; name: string }[];
  speakerLeaderboard: SpeakerLeaderboardRow[];
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[];
  onOpenLeaderboards: () => void;
  onOpenAdjudicatorLeaderboards?: () => void;
  onOpenWorkspace?: () => void;
};

type MotionPerformance = {
  motionType: string;
  averageScore: number;
  sessions: number;
};

type LastSessionDetails = {
  motionType: string;
  chair: string;
  pairingLabel: string;
};

export default function HomeDashboard({
  role,
  userName,
  position,
  sessions,
  attendanceHistory,
  participants,
  speakerLeaderboard,
  adjudicatorLeaderboard,
  onOpenLeaderboards,
  onOpenAdjudicatorLeaderboards,
  onOpenWorkspace,
}: HomeDashboardProps) {
  const [lastSessionDetails, setLastSessionDetails] = useState<LastSessionDetails | null>(null);
  const [progressProfile, setProgressProfile] = useState<ProgressProfile | null>(null);
  const currentParticipantId = attendanceHistory.find((item) => item.participantId)?.participantId ?? null;
  const totalSessions = sessions.length;
  const attendedSessions = attendanceHistory.filter((item) => isPresentStatus(item.status)).length;
  const attendancePercentage =
    totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

  const speakerRank = currentParticipantId
    ? speakerLeaderboard.find((entry) => entry.id === currentParticipantId)?.rank ?? null
    : null;
  const adjudicatorRank = currentParticipantId
    ? adjudicatorLeaderboard.find((entry) => entry.id === currentParticipantId)?.rank ?? null
    : null;

  const lastSession = useMemo(() => {
    return attendanceHistory
      .slice()
      .sort(
        (left, right) =>
          new Date(right.session.sessionDate).getTime() - new Date(left.session.sessionDate).getTime(),
      )[0] ?? null;
  }, [attendanceHistory]);

  useEffect(() => {
    let cancelled = false;

    async function loadLastSessionDetails() {
      if (!lastSession?.session.id || !currentParticipantId) {
        setLastSessionDetails(null);
        return;
      }

      try {
        const response = await fetch(`/api/pairing/published/${lastSession.session.id}`, {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setLastSessionDetails(null);
          }
          return;
        }

        const data = (await response.json()) as {
          publishedPairing?: PublishedPairingView;
          participantNames?: Record<string, string>;
        };
        const publishedPairing = data.publishedPairing;
        if (!publishedPairing) {
          if (!cancelled) {
            setLastSessionDetails(null);
          }
          return;
        }

        const details = deriveLastSessionDetails(publishedPairing, currentParticipantId, data.participantNames ?? {}, participants, speakerLeaderboard, adjudicatorLeaderboard);
        if (!cancelled) {
          setLastSessionDetails(details);
        }
      } catch {
        if (!cancelled) {
          setLastSessionDetails(null);
        }
      }
    }

    void loadLastSessionDetails();
    return () => {
      cancelled = true;
    };
  }, [adjudicatorLeaderboard, currentParticipantId, lastSession?.session.id, participants, speakerLeaderboard]);

  useEffect(() => {
    if (!currentParticipantId) {
      setProgressProfile(null);
      return;
    }

    let cancelled = false;

    async function loadProgressProfile() {
      try {
        const response = await fetch(`/api/progress/members/${currentParticipantId}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          if (!cancelled) {
            setProgressProfile(null);
          }
          return;
        }
        const profile = (await response.json()) as ProgressProfile;
        if (!cancelled) {
          setProgressProfile(profile);
        }
      } catch {
        if (!cancelled) {
          setProgressProfile(null);
        }
      }
    }

    void loadProgressProfile();
    return () => {
      cancelled = true;
    };
  }, [currentParticipantId]);

  const motionPerformance = useMemo<MotionPerformance[]>(() => {
    if (!progressProfile) {
      return [];
    }

    return progressProfile.motionTypeScores
      .map((entry) => ({
        motionType: entry.motionType,
        averageScore: Number(entry.score.toFixed(1)),
        sessions: entry.observationCount,
      }))
      .sort((left, right) => right.averageScore - left.averageScore);
  }, [progressProfile]);

  const bestMotion = motionPerformance[0] ?? null;
  const recentScore = lastSession?.speakerScore ?? null;
  const isAdmin = role === "cabinet" || role === "President" || role === "TechHead";
  // Prefer the specific post (e.g. a cabinet member whose position is
  // "Tech Head") over the generic account role.
  const roleLabel =
    role === "cabinet"
      ? "Cabinet"
      : role === "President"
        ? "President"
        : role === "TechHead"
          ? "Tech Head"
          : role === "Member"
            ? "Member"
            : role;
  const positionLabel = position?.trim() || roleLabel;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Welcome, {positionLabel}
        </h1>
        {isAdmin && onOpenWorkspace ? (
          <PrimaryButton onClick={onOpenWorkspace}>
            Open session workspace
            <ArrowRight size={16} />
          </PrimaryButton>
        ) : null}
      </div>

      <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SummaryCard
          icon={<Gauge size={18} />}
          label="Your attendance"
          value={`${attendancePercentage}%`}
          helper={`${attendedSessions} of ${totalSessions || 0} sessions attended`}
        />
        <SummaryCard
          icon={<Calendar size={18} />}
          label="Total sessions"
          value={totalSessions}
          helper="Sessions recorded in the current dashboard"
        />
        <RankCard
          icon={<Trophy size={18} />}
          label="Speaker rank"
          rank={speakerRank}
          helper="Current speaker leaderboard position"
          onClick={onOpenLeaderboards}
        />
        <RankCard
          icon={<Users size={18} />}
          label="Adjudicator rank"
          rank={adjudicatorRank}
          helper="Current adjudicator leaderboard position"
          onClick={onOpenAdjudicatorLeaderboards ?? onOpenLeaderboards}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 sm:mb-4">
            <Calendar size={18} />
            <h3 className="text-base font-semibold sm:text-lg">Last session you did</h3>
          </div>

          {lastSession ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Info label="Date" value={lastSession.session.sessionDate} />
              <Info
                label="Motion type"
                value={lastSessionDetails?.motionType ?? lastSession.session.motiontype}
              />
              <Info
                label="Chair"
                value={resolveParticipantName(
                  lastSession.session.Chair,
                  participants,
                  speakerLeaderboard,
                  adjudicatorLeaderboard,
                  lastSessionDetails?.chair && lastSessionDetails.chair !== "TBD"
                    ? lastSessionDetails.chair
                    : lastSession.session.Chair,
                )}
              />
              <Info label="Status" value={lastSession.status} />
              <Info
                label="Speaker score"
                value={typeof recentScore === "number" ? recentScore : "Not scored yet"}
              />
              <Info
                label="Pairing"
                value={
                  lastSessionDetails?.pairingLabel ??
                  (lastSession.pairedWith?.length
                    ? lastSession.pairedWith
                        .map((participantId) =>
                          resolveParticipantName(participantId, participants, speakerLeaderboard, adjudicatorLeaderboard, participantId),
                        )
                        .join(", ")
                    : lastSession.assignmentLabel ?? "No pair saved")
                }
              />
            </div>
          ) : (
            <EmptyState
              title="No recent session yet"
              body="Once your attendance is recorded, your latest session summary will show here."
            />
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100 sm:mb-4">
            <BarChart3 size={18} />
            <h3 className="text-base font-semibold sm:text-lg">Motion-type performance</h3>
          </div>

          {bestMotion ? (
            <div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Best current motion type
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{bestMotion.motionType}</div>
                  <Pill tone="blue">Avg {bestMotion.averageScore}</Pill>
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Based on {bestMotion.sessions} scored session{bestMotion.sessions === 1 ? "" : "s"}.
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {motionPerformance.slice(0, 4).map((entry) => (
                  <div
                    key={entry.motionType}
                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{entry.motionType}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{entry.sessions} session{entry.sessions === 1 ? "" : "s"}</div>
                    </div>
                    <Pill tone="emerald">{entry.averageScore}</Pill>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No motion performance data yet"
              body="Once scored sessions exist for you, your motion-type performance will show here automatically."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
}) {
  return (
    <Card className="glass-card-hover p-4 sm:p-5">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
        <span className="text-[11px] font-semibold uppercase leading-tight tracking-wide sm:text-xs">
          {label}
        </span>
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:mt-2 sm:text-3xl">
        {value}
      </div>
      <div className="mt-1.5 hidden text-sm text-slate-500 dark:text-slate-400 sm:block">{helper}</div>
    </Card>
  );
}

function RankCard({
  icon,
  label,
  rank,
  helper,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  rank: number | null;
  helper: string;
  onClick: () => void;
}) {
  return (
    <Card className="glass-card-hover p-0">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 sm:p-5"
      >
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
          <span className="text-[11px] font-semibold uppercase leading-tight tracking-wide sm:text-xs">
            {label}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 sm:mt-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {rank ? `#${rank}` : "--"}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <span className="hidden sm:inline">View</span>
            <ChevronRight size={16} />
          </span>
        </div>
        <span className="mt-1.5 hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
          {helper}
        </span>
      </button>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function isPresentStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() === "present";
}


function resolveParticipantName(
  id: string | null | undefined,
  participants: { id: string; name: string }[],
  speakerLeaderboard: SpeakerLeaderboardRow[],
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[],
  fallback: string,
  names: Record<string, string> = {},
) {
  if (!id) {
    return fallback;
  }

  return (
    names[id] ??
    participants.find((entry) => entry.id === id)?.name ??
    speakerLeaderboard.find((entry) => entry.id === id)?.name ??
    adjudicatorLeaderboard.find((entry) => entry.id === id)?.name ??
    fallback
  );
}

function deriveLastSessionDetails(
  publishedPairing: PublishedPairingView,
  participantId: string,
  names: Record<string, string>,
  participants: { id: string; name: string }[],
  speakerLeaderboard: SpeakerLeaderboardRow[],
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[],
): LastSessionDetails | null {
  const room = publishedPairing.rooms.find(
    (entry) =>
      entry.teams.some((team) => team.speakers.some((speaker) => speaker.participantId === participantId)) ||
      entry.adjudicators.some((adjudicator) => adjudicator.participantId === participantId),
  );

  if (!room) {
    return {
      motionType: publishedPairing.motionType,
      chair: "TBD",
      pairingLabel: "No pair saved",
    };
  }

  const myTeam =
    room.teams.find((team) => team.speakers.some((speaker) => speaker.participantId === participantId)) ?? null;
  const myAdjudicator =
    room.adjudicators.find((adjudicator) => adjudicator.participantId === participantId) ?? null;
  const chair = room.adjudicators.find((adjudicator) => adjudicator.isChair) ?? null;
  const chairLabel = chair
    ? resolveParticipantName(chair.participantId, participants, speakerLeaderboard, adjudicatorLeaderboard, "TBD", names)
    : "TBD";

  if (myTeam) {
    const teammates = myTeam.speakers
      .filter((speaker) => speaker.participantId !== participantId)
      .map(
        (speaker) =>
          `${resolveParticipantName(speaker.participantId, participants, speakerLeaderboard, adjudicatorLeaderboard, "Teammate", names)} (${speaker.speakingRole})`,
      );

    return {
      motionType: publishedPairing.motionType,
      chair: chairLabel,
      pairingLabel: teammates.length > 0 ? teammates.join(", ") : `${myTeam.bpPosition} solo`,
    };
  }

  if (myAdjudicator) {
    return {
      motionType: publishedPairing.motionType,
      chair: myAdjudicator.isChair
        ? resolveParticipantName(
            myAdjudicator.participantId,
            participants,
            speakerLeaderboard,
            adjudicatorLeaderboard,
            "You",
            names,
          )
        : chairLabel,
      pairingLabel: myAdjudicator.isChair ? `Chair - Room ${room.roomIndex}` : `Panel - Room ${room.roomIndex}`,
    };
  }

  return {
    motionType: publishedPairing.motionType,
    chair: chairLabel,
    pairingLabel: `Room ${room.roomIndex}`,
  };
}





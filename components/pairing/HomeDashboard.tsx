"use client";

import React, { useMemo } from "react";
import { ArrowRight, BarChart3, Calendar, Gauge, Trophy, Users } from "lucide-react";
import { Card, EmptyState, Pill, PrimaryButton, SectionHeader } from "./ui";
import type {
  AdjudicatorLeaderboardRow,
  AttendanceHistoryItem,
  SessionRow,
  SpeakerLeaderboardRow,
} from "./types";

type HomeDashboardProps = {
  role: string;
  userName: string;
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  speakerLeaderboard: SpeakerLeaderboardRow[];
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[];
  onOpenLeaderboards: () => void;
  onOpenWorkspace?: () => void;
};

type MotionPerformance = {
  motionType: string;
  averageScore: number;
  sessions: number;
};

export default function HomeDashboard({
  role,
  userName,
  sessions,
  attendanceHistory,
  speakerLeaderboard,
  adjudicatorLeaderboard,
  onOpenLeaderboards,
  onOpenWorkspace,
}: HomeDashboardProps) {
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

  const motionPerformance = useMemo(() => {
    const buckets = new Map<string, { total: number; sessions: number }>();

    attendanceHistory.forEach((item) => {
      if (typeof item.speakerScore !== "number") {
        return;
      }

      const current = buckets.get(item.session.motiontype) ?? { total: 0, sessions: 0 };
      current.total += item.speakerScore;
      current.sessions += 1;
      buckets.set(item.session.motiontype, current);
    });

    return Array.from(buckets.entries())
      .map(([motionType, value]) => ({
        motionType,
        averageScore: Number((value.total / value.sessions).toFixed(1)),
        sessions: value.sessions,
      }))
      .sort((left, right) => right.averageScore - left.averageScore);
  }, [attendanceHistory]);

  const bestMotion = motionPerformance[0] ?? null;
  const recentScore = lastSession?.speakerScore ?? null;
  const isAdmin = role === "cabinet" || role === "President" || role === "TechHead";

  return (
    <div>
      <SectionHeader
        title="Home"
        subtitle={`Welcome back, ${userName}. Here is your pairing dashboard summary.`}
        right={
          isAdmin && onOpenWorkspace ? (
            <PrimaryButton onClick={onOpenWorkspace}>
              Open session workspace
              <ArrowRight size={16} />
            </PrimaryButton>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          onClick={onOpenLeaderboards}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-900">
            <Calendar size={18} />
            <h3 className="text-lg font-semibold">Last session you did</h3>
          </div>

          {lastSession ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Date" value={lastSession.session.sessionDate} />
              <Info label="Motion type" value={lastSession.session.motiontype} />
              <Info label="Chair" value={lastSession.session.Chair} />
              <Info label="Status" value={lastSession.status} />
              <Info
                label="Speaker score"
                value={typeof recentScore === "number" ? recentScore : "Not scored yet"}
              />
              <Info
                label="Pairing"
                value={lastSession.pairedWith?.length ? lastSession.pairedWith.join(", ") : "No pair saved"}
              />
            </div>
          ) : (
            <EmptyState
              title="No recent session yet"
              body="Once your attendance records appear in the backend, your latest session summary will show here."
            />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-900">
            <BarChart3 size={18} />
            <h3 className="text-lg font-semibold">Motion-type performance</h3>
          </div>

          {bestMotion ? (
            <div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Best current motion type
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-2xl font-semibold text-slate-900">{bestMotion.motionType}</div>
                  <Pill tone="blue">Avg {bestMotion.averageScore}</Pill>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Based on {bestMotion.sessions} scored session{bestMotion.sessions === 1 ? "" : "s"}.
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {motionPerformance.slice(0, 4).map((entry) => (
                  <div
                    key={entry.motionType}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{entry.motionType}</div>
                      <div className="text-xs text-slate-500">{entry.sessions} session{entry.sessions === 1 ? "" : "s"}</div>
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
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-slate-500">{icon}</div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{helper}</div>
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
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-slate-500">{icon}</div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-3xl font-semibold text-slate-900">{rank ? `#${rank}` : "--"}</div>
        <button
          type="button"
          onClick={onClick}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View leaderboard
        </button>
      </div>
      <div className="mt-2 text-sm text-slate-500">{helper}</div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-base font-medium text-slate-900">{value}</div>
    </div>
  );
}

function isPresentStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() === "present";
}

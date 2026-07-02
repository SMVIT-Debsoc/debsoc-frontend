"use client";

import React, { useMemo } from "react";
import { Card, EmptyState, Pill, SectionHeader } from "./ui";
import type {
  AdjudicatorLeaderboardRow,
  SpeakerLeaderboardRow,
} from "./types";

type LeaderboardsProps = {
  speakerLeaderboard: SpeakerLeaderboardRow[];
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[];
  scope: "all" | "bi-monthly";
  loading: boolean;
  error: string | null;
  onScopeChange: (scope: "all" | "bi-monthly") => void;
  view?: "speakers" | "adjudicators";
};

export default function Leaderboards({
  speakerLeaderboard,
  adjudicatorLeaderboard,
  scope,
  loading,
  error,
  onScopeChange,
  view = "speakers",
}: LeaderboardsProps) {
  const speakerSummary = useMemo(() => {
    const totalSessions = speakerLeaderboard.reduce((sum, entry) => sum + entry.sessions, 0);
    const topSpeaker = speakerLeaderboard[0]?.name ?? "No speaker yet";

    return {
      totalEntries: speakerLeaderboard.length,
      totalSessions,
      topSpeaker,
    };
  }, [speakerLeaderboard]);

  const adjudicatorSummary = useMemo(() => {
    const totalChaired = adjudicatorLeaderboard.reduce((sum, entry) => sum + entry.chairedCount, 0);
    const totalAdjudicated = adjudicatorLeaderboard.reduce(
      (sum, entry) => sum + entry.adjudicatedCount,
      0,
    );
    const topAdjudicator = adjudicatorLeaderboard[0]?.name ?? "No adjudicator yet";

    return {
      totalEntries: adjudicatorLeaderboard.length,
      totalChaired,
      totalAdjudicated,
      topAdjudicator,
    };
  }, [adjudicatorLeaderboard]);

  return (
    <div>
      <SectionHeader
        title={view === "speakers" ? "Speaker Leaderboard" : "Adjudicator Leaderboard"}
        subtitle={
          view === "speakers"
            ? "Track cumulative speaker rankings backed by the current leaderboard API."
            : "Track adjudicator averages, chaired rounds, and panel coverage from the live backend."
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onScopeChange("all")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            scope === "all"
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
          }`}
        >
          All time
        </button>
        <button
          type="button"
          onClick={() => onScopeChange("bi-monthly")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            scope === "bi-monthly"
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
          }`}
        >
          Last 60 days
        </button>
      </div>

      {loading ? (
        <EmptyState title="Loading leaderboard" body="Fetching live leaderboard data." />
      ) : error ? (
        <EmptyState title="Leaderboard unavailable" body={error} />
      ) : view === "speakers" ? (
        <div className="space-y-6">
          <Card className="border-indigo-200 dark:border-indigo-400/25 bg-indigo-50/70 dark:bg-indigo-400/10">
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                  Speaker view
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Speaker leaderboard</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Ranked by cumulative speaker score from saved speaker scoring data.
                </div>
              </div>
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Top speaker</div>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{speakerSummary.topSpeaker}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Ranked speakers</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{speakerSummary.totalEntries}</div>
                </div>
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Tracked sessions</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{speakerSummary.totalSessions}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            {speakerLeaderboard.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No speaker leaderboard entries yet"
                  body="Speaker rankings will appear here once speaker scores exist in the backend."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.04] text-left text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Score</th>
                    <th className="px-4 py-2 font-medium">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {speakerLeaderboard.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100 dark:border-white/[0.06]">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{entry.rank}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{entry.name}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{entry.score}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{entry.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden border-amber-200 dark:border-amber-400/25 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(15,23,42,0.04))]">
            <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_0.95fr_0.8fr]">
              <div className="rounded-3xl border border-amber-200/80 bg-white/70 p-5 backdrop-blur dark:border-amber-400/25 dark:bg-amber-400/[0.07]">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                  Adjudicator command
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Adjudicator leaderboard</div>
                <div className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  This board ranks adjudicators by average score while keeping chair rounds and panel rounds visible as separate responsibility signals.
                </div>
              </div>

              <div className="rounded-3xl border border-slate-900/10 bg-slate-950 p-5 text-white shadow-sm">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-300">Top adjudicator</div>
                <div className="mt-3 text-3xl font-semibold leading-tight">{adjudicatorSummary.topAdjudicator}</div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Chair rounds</div>
                    <div className="mt-1 text-2xl font-semibold text-amber-200">{adjudicatorSummary.totalChaired}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Panel rounds</div>
                    <div className="mt-1 text-2xl font-semibold text-amber-200">{adjudicatorSummary.totalAdjudicated}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-amber-200 dark:border-amber-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Ranked adjudicators</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{adjudicatorSummary.totalEntries}</div>
                </div>
                <div className="rounded-3xl border border-amber-200 dark:border-amber-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Board status</div>
                  <div className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                    {adjudicatorSummary.totalEntries > 0 ? "Live and ranked" : "Waiting for data"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            {adjudicatorLeaderboard.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No adjudicator leaderboard entries yet"
                  body="Adjudicator rankings will appear here once adjudicator score records exist in the backend."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/[0.04] text-left text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Adjudicator</th>
                      <th className="px-4 py-3 font-medium">Average</th>
                      <th className="px-4 py-3 font-medium">Panel rounds</th>
                      <th className="px-4 py-3 font-medium">Chair rounds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjudicatorLeaderboard.map((entry, index) => (
                      <tr key={entry.id} className="border-t border-slate-100 dark:border-white/[0.06] hover:bg-amber-50/30 dark:hover:bg-amber-400/10">
                        <td className="px-4 py-3">
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/15 font-semibold text-amber-900 dark:text-amber-200">
                            {entry.rank}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{entry.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {index === 0 ? "Current table leader" : `Ranked #${entry.rank}`}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{entry.score}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Average score</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{entry.adjudicatedCount}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{entry.chairedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}









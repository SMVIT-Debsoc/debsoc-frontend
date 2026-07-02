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
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          All time
        </button>
        <button
          type="button"
          onClick={() => onScopeChange("bi-monthly")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            scope === "bi-monthly"
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
          <Card className="border-blue-200 bg-blue-50/70">
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Speaker view
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">Speaker leaderboard</div>
                <div className="mt-2 text-sm text-slate-600">
                  Ranked by cumulative speaker score from saved speaker scoring data.
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-white/80 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Top speaker</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{speakerSummary.topSpeaker}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-blue-200 bg-white/80 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Ranked speakers</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{speakerSummary.totalEntries}</div>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-white/80 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Tracked sessions</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{speakerSummary.totalSessions}</div>
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
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">Score</th>
                    <th className="px-4 py-2 font-medium">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {speakerLeaderboard.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-500">{entry.rank}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{entry.name}</td>
                      <td className="px-4 py-3">
                        <Pill tone={entry.type === "Cabinet" ? "amber" : "slate"}>{entry.type}</Pill>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{entry.score}</td>
                      <td className="px-4 py-3 text-slate-700">{entry.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden border-amber-200 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(15,23,42,0.04))]">
            <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_0.95fr_0.8fr]">
              <div className="rounded-3xl border border-amber-200/80 bg-white/70 p-5 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Adjudicator command
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">Adjudicator leaderboard</div>
                <div className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
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
                <div className="rounded-3xl border border-amber-200 bg-white/80 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Ranked adjudicators</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950">{adjudicatorSummary.totalEntries}</div>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-white/80 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Board status</div>
                  <div className="mt-2 text-base font-semibold text-slate-950">
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
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Adjudicator</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Average</th>
                      <th className="px-4 py-3 font-medium">Panel rounds</th>
                      <th className="px-4 py-3 font-medium">Chair rounds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjudicatorLeaderboard.map((entry, index) => (
                      <tr key={entry.id} className="border-t border-slate-100 hover:bg-amber-50/30">
                        <td className="px-4 py-3">
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-900">
                            {entry.rank}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{entry.name}</div>
                          <div className="text-xs text-slate-500">
                            {index === 0 ? "Current table leader" : `Ranked #${entry.rank}`}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Pill tone={entry.type === "Cabinet" ? "amber" : "slate"}>{entry.type}</Pill>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{entry.score}</div>
                          <div className="text-xs text-slate-500">Average score</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{entry.adjudicatedCount}</td>
                        <td className="px-4 py-3 text-slate-700">{entry.chairedCount}</td>
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

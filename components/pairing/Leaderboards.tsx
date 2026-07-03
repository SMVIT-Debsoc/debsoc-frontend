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
            ? "Cumulative speaker rankings."
            : "Adjudicator averages, chaired rounds, and panel coverage."
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
          <Card className="hidden lg:block overflow-hidden border-indigo-200 dark:border-indigo-400/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(15,23,42,0.04))]">
            <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.05fr_0.95fr_0.8fr]">
              <div className="hidden lg:block rounded-3xl border border-indigo-200/80 bg-white/70 p-5 backdrop-blur dark:border-indigo-400/25 dark:bg-indigo-400/[0.07]">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">
                  Speaker command
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Speaker leaderboard</div>
                <div className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  This board ranks speakers by cumulative speaker score from saved speaker scoring data, with tracked sessions visible as a participation signal.
                </div>
              </div>

              <div className="rounded-3xl border border-slate-900/10 bg-slate-950 p-5 text-white shadow-sm">
                <div className="text-xs uppercase tracking-[0.22em] text-indigo-300">Top speaker</div>
                <div className="mt-3 text-3xl font-semibold leading-tight">{speakerSummary.topSpeaker}</div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Ranked speakers</div>
                    <div className="mt-1 text-2xl font-semibold text-indigo-200">{speakerSummary.totalEntries}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Tracked sessions</div>
                    <div className="mt-1 text-2xl font-semibold text-indigo-200">{speakerSummary.totalSessions}</div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:grid gap-4">
                <div className="rounded-3xl border border-indigo-200 dark:border-indigo-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Ranked speakers</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{speakerSummary.totalEntries}</div>
                </div>
                <div className="rounded-3xl border border-indigo-200 dark:border-indigo-400/25 bg-white/80 p-4 dark:bg-white/[0.06]">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Board status</div>
                  <div className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                    {speakerSummary.totalEntries > 0 ? "Live and ranked" : "Waiting for data"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            {speakerLeaderboard.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No speaker leaderboard entries yet"
                  body="Speaker rankings will appear here once scores are recorded."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/[0.04] text-left text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Speaker</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {speakerLeaderboard.map((entry, index) => {
                      return (
                        <tr key={entry.id} className="border-t border-slate-100 dark:border-white/[0.06] hover:bg-indigo-50/30 dark:hover:bg-indigo-400/10">
                          <td className="px-4 py-3">
                            <div className="inline-flex h-10 w-10 items-center justify-center">
                              <RankDoodle rank={entry.rank} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{entry.name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{entry.score}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{entry.sessions}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="hidden lg:block overflow-hidden border-amber-200 dark:border-amber-400/25 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(15,23,42,0.04))]">
            <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.05fr_0.95fr_0.8fr]">
              <div className="hidden lg:block rounded-3xl border border-amber-200/80 bg-white/70 p-5 backdrop-blur dark:border-amber-400/25 dark:bg-amber-400/[0.07]">
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

              <div className="hidden lg:grid gap-4">
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
                  body="Adjudicator rankings will appear here once adjudicator scores are recorded."
                />
              </div>
            ) : (
              <div>
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-slate-50 dark:bg-white/[0.04] text-left text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 font-medium w-14">#</th>
                      <th className="px-2 sm:px-4 py-3 font-medium">Adjudicator</th>
                      <th className="px-2 sm:px-4 py-3 font-medium">Average</th>
                      <th className="hidden md:table-cell px-4 py-3 font-medium">Panel rounds</th>
                      <th className="hidden md:table-cell px-4 py-3 font-medium">Chair rounds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjudicatorLeaderboard.map((entry, index) => (
                      <tr key={entry.id} className="border-t border-slate-100 dark:border-white/[0.06] hover:bg-amber-50/30 dark:hover:bg-amber-400/10">
                        <td className="px-2 sm:px-4 py-3">
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/15 font-semibold text-amber-900 dark:text-amber-200">
                            {entry.rank}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{entry.name}</div>
                          <div className="md:hidden text-xs text-slate-500 dark:text-slate-400">
                            {entry.adjudicatedCount} panel · {entry.chairedCount} chair
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{entry.score}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Average</div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-slate-700 dark:text-slate-300">{entry.adjudicatedCount}</td>
                        <td className="hidden md:table-cell px-4 py-3 text-slate-700 dark:text-slate-300">{entry.chairedCount}</td>
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

function RankDoodle({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="1st place trophy">
        <path d="M12 6h16v6a8 8 0 0 1-16 0V6Z" fill="#facc15" stroke="#78350f" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 8H8a4 4 0 0 0 4 4M28 8h4a4 4 0 0 1-4 4" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 20v4h6v-4" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="13" y="24" width="14" height="4" rx="1" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
        <rect x="11" y="28" width="18" height="4" rx="1" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
        <path d="M18 9l1.2 2.2 2.4.4-1.7 1.7.4 2.4L18 14.6l-2.2 1.1.4-2.4-1.7-1.7 2.4-.4L18 9Z" fill="#fef3c7" stroke="#78350f" strokeWidth="1" strokeLinejoin="round" />
      </svg>
    );
  }
  if (rank === 2) {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="2nd place medal">
        <path d="M14 6l3 8M26 6l-3 8" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="24" r="9" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
        <circle cx="20" cy="24" r="5.5" fill="#e2e8f0" stroke="#334155" strokeWidth="1.2" />
        <text x="20" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="#334155" fontFamily="ui-sans-serif, system-ui">2</text>
      </svg>
    );
  }
  if (rank === 3) {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="3rd place medal">
        <path d="M14 6l3 8M26 6l-3 8" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="24" r="9" fill="#d97706" stroke="#7c2d12" strokeWidth="1.5" />
        <circle cx="20" cy="24" r="5.5" fill="#f59e0b" stroke="#7c2d12" strokeWidth="1.2" />
        <text x="20" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="#7c2d12" fontFamily="ui-sans-serif, system-ui">3</text>
      </svg>
    );
  }
  const label = String(rank);
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={`rank ${rank}`}>
      <path
        d="M20 5c4 0 8 1.4 11 4.2 3.1 3 4.2 6.9 3.9 10.8-.3 3.9-2 7.6-5 10-3.3 2.6-7.2 3.4-11 3-3.8-.3-7.4-2-9.8-5-2.5-3-3.5-6.8-3-10.5.5-3.7 2.5-7.1 5.6-9.2C14.4 6.1 17.1 5 20 5Z"
        fill="#e0e7ff"
        stroke="#4338ca"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeDasharray="0.1 0"
      />
      <path
        d="M10.5 12c1.5-1.5 3-2.6 4.8-3.4M32 15.5c.4 1.5.5 3 .3 4.5"
        stroke="#4338ca"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <text
        x="20"
        y={label.length > 1 ? 25 : 26}
        textAnchor="middle"
        fontSize={label.length > 2 ? 10 : label.length > 1 ? 13 : 15}
        fontWeight="800"
        fill="#3730a3"
        fontFamily="ui-sans-serif, system-ui"
      >
        {label}
      </text>
    </svg>
  );
}





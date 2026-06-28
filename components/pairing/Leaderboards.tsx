"use client";

import React from "react";
import { Card, EmptyState, Pill, SectionHeader } from "./ui";
import type { LeaderboardRow } from "./types";

type LeaderboardsProps = {
  leaderboard: LeaderboardRow[];
  scope: "all" | "bi-monthly";
  loading: boolean;
  error: string | null;
  onScopeChange: (scope: "all" | "bi-monthly") => void;
};

export default function Leaderboards({
  leaderboard,
  scope,
  loading,
  error,
  onScopeChange,
}: LeaderboardsProps) {
  return (
    <div>
      <SectionHeader
        title="Leaderboards"
        subtitle="Live cumulative speaker leaderboard from the current backend. Adjudicator ranking will unlock once adjudicator-specific scoring data exists."
      />

      <div className="mb-4 flex gap-2">
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
      ) : leaderboard.length === 0 ? (
        <EmptyState
          title="No leaderboard entries yet"
          body="Scores will appear here once attendance rows with speaker scores exist in the backend."
        />
      ) : (
        <Card>
          <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
            Ranked by cumulative speaker score from saved attendance records.
          </div>
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
              {leaderboard.map((entry) => (
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
        </Card>
      )}
    </div>
  );
}

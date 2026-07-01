"use client";

import React, { useMemo, useState } from "react";
import { Card, EmptyState, Pill, SectionHeader } from "./ui";
import type { Participant, ProgressSummary } from "./types";

type RosterProps = {
  participants: Participant[];
  progressSummaries: ProgressSummary[];
  loading: boolean;
  error: string | null;
};

export default function Roster({
  participants,
  progressSummaries,
  loading,
  error,
}: RosterProps) {
  const [filter, setFilter] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(
    null,
  );

  const filteredParticipants = useMemo(
    () =>
      participants.filter((participant) =>
        participant.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [filter, participants],
  );

  const progressByParticipantId = useMemo(
    () => new Map(progressSummaries.map((summary) => [summary.participantId, summary])),
    [progressSummaries],
  );

  const selectedProgress = selectedParticipantId
    ? progressByParticipantId.get(selectedParticipantId) ?? null
    : null;

  if (loading) {
    return <EmptyState title="Loading roster" body="Fetching live members, cabinet, and president records." />;
  }

  if (error) {
    return <EmptyState title="Roster unavailable" body={error} />;
  }

  return (
    <div>
      <SectionHeader
        title="Members & Cabinet"
        subtitle="Live participant roster with progress summaries from the pairing backend."
        right={
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search…"
            className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        }
      />

      {filteredParticipants.length === 0 ? (
        <EmptyState title="No matching participants" body="Try a different search term." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Account</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Progress</th>
                <th className="px-4 py-2 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => (
                <tr key={participant.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{participant.name}</td>
                  <td className="px-4 py-3">
                    <Pill
                      tone={
                        participant.account === "President"
                          ? "blue"
                          : participant.account === "Cabinet"
                            ? "amber"
                            : "slate"
                      }
                    >
                      {participant.account}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{participant.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {progressByParticipantId.has(participant.id) ? (
                      <button
                        type="button"
                        onClick={() => setSelectedParticipantId(participant.id)}
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        View progress
                      </button>
                    ) : (
                      <span className="text-slate-400">No data yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={participant.isVerified ? "emerald" : "red"}>
                      {participant.isVerified ? "Verified" : "Pending"}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selectedParticipantId && (
        <div className="mt-6">
          <Card className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Progress snapshot</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Read-only pairing progress summary from the backend profile service.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParticipantId(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            {selectedProgress ? (
              <div className="grid gap-4 md:grid-cols-4">
                <SummaryStat label="Speaker total" value={selectedProgress.speakerTotalScore} />
                <SummaryStat label="Strength" value={selectedProgress.speakerStrength.toFixed(2)} />
                <SummaryStat label="Confidence" value={selectedProgress.confidence.toFixed(2)} />
                <SummaryStat label="Data maturity" value={selectedProgress.dataMaturity} />
                <SummaryStat label="Sessions spoken" value={selectedProgress.sessionsSpoken} />
                <SummaryStat
                  label="Sessions adjudicated"
                  value={selectedProgress.sessionsAdjudicated}
                />
                <SummaryStat label="Sessions chaired" value={selectedProgress.sessionsChaired} />
              </div>
            ) : (
              <EmptyState
                title="No progress summary"
                body="This participant does not have enough backend progress data yet."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

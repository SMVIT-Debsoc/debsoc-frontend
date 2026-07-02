"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, Pill, SectionHeader } from "./ui";
import type { Participant, ProgressProfile, ProgressSummary } from "./types";

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
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProgressProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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

  const selectedParticipant = selectedParticipantId
    ? participants.find((participant) => participant.id === selectedParticipantId) ?? null
    : null;

  const selectedProgressSummary = selectedParticipantId
    ? progressByParticipantId.get(selectedParticipantId) ?? null
    : null;

  useEffect(() => {
    if (!selectedParticipantId) {
      setSelectedProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError(null);

      try {
        const response = await fetch(`/api/progress/members/${selectedParticipantId}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const fallback = "Failed to load progress profile.";
          let message = fallback;
          try {
            const data = (await response.json()) as { message?: string };
            if (data.message?.trim()) {
              message = data.message;
            }
          } catch {
            // ignore JSON parse failure and use fallback
          }
          throw new Error(message);
        }

        const profile = (await response.json()) as ProgressProfile;
        setSelectedProfile(profile);
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }
        setProfileError(
          caught instanceof Error ? caught.message : "Failed to load progress profile.",
        );
        setSelectedProfile(null);
      } finally {
        if (!controller.signal.aborted) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [selectedParticipantId]);

  function closeProfile() {
    setSelectedParticipantId(null);
  }

  if (loading) {
    return (
      <EmptyState
        title="Loading roster"
        body="Fetching live members, cabinet, and president records."
      />
    );
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
            placeholder="Search..."
            className="w-56 rounded-md border border-slate-300 dark:border-white/15 px-3 py-1.5 text-sm"
          />
        }
      />

      {filteredParticipants.length === 0 ? (
        <EmptyState title="No matching participants" body="Try a different search term." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.04] text-left text-slate-600 dark:text-slate-400">
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
                <tr key={participant.id} className="border-t border-slate-100 dark:border-white/[0.06]">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{participant.name}</td>
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
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{participant.email ?? "-"}</td>
                  <td className="px-4 py-3">
                    {progressByParticipantId.has(participant.id) ? (
                      <button
                        type="button"
                        onClick={() => setSelectedParticipantId(participant.id)}
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View progress
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">No data yet</span>
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
          </div>
        </Card>
      )}

      {selectedParticipantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm overlay-fade">
          <div className="absolute inset-0" onClick={closeProfile} />
          <Card className="modal-pop relative max-h-[85vh] w-full max-w-6xl overflow-y-auto p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Progress snapshot{selectedParticipant ? ` - ${selectedParticipant.name}` : ""}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Read-only pairing progress profile from the backend profile service.
                </p>
              </div>
              <button
                type="button"
                onClick={closeProfile}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>

            {profileLoading ? (
              <EmptyState
                title="Loading progress profile"
                body="Fetching the individual pairing progress profile."
              />
            ) : profileError ? (
              <EmptyState title="Progress profile unavailable" body={profileError} />
            ) : selectedProfile ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <SummaryStat
                    label="Attendance"
                    value={`${selectedProfile.attendance.attendancePercentage}%`}
                  />
                  <SummaryStat
                    label="Present sessions"
                    value={selectedProfile.attendance.presentCount}
                  />
                  <SummaryStat
                    label="Tracked sessions"
                    value={selectedProfile.attendance.totalCount}
                  />
                  <SummaryStat
                    label="Data maturity"
                    value={selectedProfile.summary.dataMaturity}
                  />
                  <SummaryStat
                    label="Speaker total"
                    value={selectedProfile.summary.speakerTotalScore}
                  />
                  <SummaryStat
                    label="Speaker strength"
                    value={selectedProfile.summary.speakerStrength.toFixed(2)}
                  />
                  <SummaryStat
                    label="Confidence"
                    value={selectedProfile.summary.confidence.toFixed(2)}
                  />
                  <SummaryStat
                    label="Sessions spoken"
                    value={selectedProfile.summary.sessionsSpoken}
                  />
                  <SummaryStat
                    label="Sessions adjudicated"
                    value={selectedProfile.summary.sessionsAdjudicated}
                  />
                  <SummaryStat
                    label="Sessions chaired"
                    value={selectedProfile.summary.sessionsChaired}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ProgressList
                    title="Verdict strengths"
                    items={selectedProfile.verdict.strengths}
                    emptyMessage="No strength verdict yet."
                  />
                  <ProgressList
                    title="Verdict weaknesses"
                    items={selectedProfile.verdict.weaknesses}
                    emptyMessage="No weakness verdict yet."
                  />
                  <ProgressList
                    title="Coverage gaps"
                    items={selectedProfile.verdict.gaps}
                    emptyMessage="No coverage gaps detected yet."
                  />
                  <ProgressList
                    title="Role aptitude"
                    items={selectedProfile.verdict.roleAptitude}
                    emptyMessage="No role aptitude insights yet."
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <MetricTable
                    title="Motion-type scores"
                    emptyMessage="No motion-type metrics yet."
                    rows={selectedProfile.motionTypeScores.map((entry) => ({
                      label: entry.motionType,
                      score: entry.score,
                      observations: entry.observationCount,
                    }))}
                  />
                  <MetricTable
                    title="Role scores"
                    emptyMessage="No role-specific metrics yet."
                    rows={selectedProfile.roleScores.map((entry) => ({
                      label: entry.role,
                      score: entry.score,
                      observations: entry.observationCount,
                    }))}
                  />
                  <MetricTable
                    title="Compatibility"
                    emptyMessage="No compatibility signals yet."
                    rows={selectedProfile.compatibilityProfiles.map((entry) => ({
                      label: entry.name,
                      score: entry.score,
                      observations: entry.observationCount,
                    }))}
                  />
                </div>
              </div>
            ) : (
              <EmptyState
                title="No progress summary"
                body={
                  selectedProgressSummary
                    ? "The participant has summary data, but the full profile is not available yet."
                    : "This participant does not have enough backend progress data yet."
                }
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function ProgressList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-4">
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MetricTable({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: Array<{ label: string; score: number; observations: number }>;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-4">
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div
              key={`${title}-${row.label}`}
              className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300"
            >
              <span className="min-w-0 flex-1 truncate">{row.label}</span>
              <span className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                {row.score.toFixed(2)} | {row.observations} obs
              </span>
            </div>
          ))}
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
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

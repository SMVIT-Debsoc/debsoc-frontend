"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, Field, PrimaryButton, SectionHeader, SecondaryButton } from "./ui";
import type { AttendanceHistoryItem, SessionRow } from "./types";
import type { PublishedPairingView } from "@/types/pairing";

type MyScoringProps = {
  role: string;
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
};

type TaskStatusResponse = {
  sessionId: string;
  scoringStatus: "pending" | "open" | "partial" | "complete";
  tasks?: Array<{
    participantId: string;
    sessionRole: "speaker" | "adjudicator";
    hasSubmitted: boolean;
  }>;
};

type PublishedPairingResponse = {
  publishedPairing: PublishedPairingView;
};

type ScoringTaskView = {
  sessionId: string;
  sessionLabel: string;
  motionType: string;
  role: "speaker" | "chair";
  hasSubmitted: boolean;
  scoringStatus: TaskStatusResponse["scoringStatus"];
  chairName?: string;
  panel: Array<{ participantId: string; name: string }>;
  speakers: Array<{
    participantId: string;
    name: string;
    bpPosition: string;
    speakingRole: string;
  }>;
};

function participantNameMap(session: SessionRow) {
  return Object.fromEntries(
    (session.attendance ?? []).flatMap((entry) => {
      const participantId = entry.member?.id ?? entry.cabinet?.id ?? entry.president?.id ?? null;
      const name = entry.member?.name ?? entry.cabinet?.name ?? entry.president?.name ?? null;
      return participantId && name ? [[participantId, name]] : []
    }),
  ) as Record<string, string>;
}

function formatTaskLabel(session: SessionRow) {
  return `${session.date} | ${session.motionType}`;
}

function isPublishedLike(session: SessionRow) {
  return session.state === "Published" || session.state === "Scored" || session.state === "Completed";
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
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

export default function MyScoring({ role, sessions, attendanceHistory }: MyScoringProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ScoringTaskView[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [speakerForm, setSpeakerForm] = useState({ chairScore: "", teamDynamicsRating: "", notes: "" });
  const [chairForm, setChairForm] = useState<{
    adjudicatorScores: Record<string, string>;
    speakerScores: Record<string, { rawScore: string; teamResultPoints: string }>;
  }>({ adjudicatorScores: {}, speakerScores: {} });
  const [submitState, setSubmitState] = useState<{ saving: boolean; message: string | null; error: string | null }>({
    saving: false,
    message: null,
    error: null,
  });

  const currentParticipantId = attendanceHistory.find((item) => item.participantId)?.participantId ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      setLoading(true);
      setError(null);

      if (!currentParticipantId) {
        setTasks([]);
        setLoading(false);
        return;
      }

      try {
        const candidateSessions = sessions.filter(isPublishedLike);
        const loaded = await Promise.all(
          candidateSessions.map(async (session): Promise<ScoringTaskView | null> => {
            const [publishedResponse, scoringStatus] = await Promise.all([
              fetchJson<PublishedPairingResponse>(`/api/pairing/published/${session.id}`),
              fetchJson<TaskStatusResponse>(`/api/sessions/${session.id}/scoring-status`),
            ]);

            const publishedPairing = publishedResponse?.publishedPairing;
            if (!publishedPairing) {
              return null;
            }

            const visibleTask = (scoringStatus.tasks ?? []).find((task) => task.participantId === currentParticipantId);
            if (!visibleTask) {
              return null;
            }

            const names = participantNameMap(session);
            const room = (publishedPairing.rooms ?? []).find(
              (entry) =>
                entry.teams.some((team) => team.speakers.some((speaker) => speaker.participantId === currentParticipantId)) ||
                entry.adjudicators.some((adjudicator) => adjudicator.participantId === currentParticipantId),
            );

            if (!room) {
              return null;
            }

            if (visibleTask.sessionRole === "speaker") {
              const chairParticipantId = room.adjudicators.find((adjudicator) => adjudicator.isChair)?.participantId;
              return {
                sessionId: session.id,
                sessionLabel: formatTaskLabel(session),
                motionType: publishedPairing.motionType,
                role: "speaker" as const,
                hasSubmitted: visibleTask.hasSubmitted,
                scoringStatus: scoringStatus.scoringStatus,
                chairName: chairParticipantId ? names[chairParticipantId] ?? session.assignedChairLabel : session.assignedChairLabel,
                panel: [],
                speakers: room.teams.flatMap((team) =>
                  team.speakers.map((speaker) => ({
                    participantId: speaker.participantId,
                    name: names[speaker.participantId] ?? speaker.participantId,
                    bpPosition: team.bpPosition,
                    speakingRole: speaker.speakingRole,
                  })),
                ),
              } satisfies ScoringTaskView;
            }

            const chairId = room.adjudicators.find((adjudicator) => adjudicator.isChair)?.participantId;
            if (chairId !== currentParticipantId) {
              return null;
            }

            return {
              sessionId: session.id,
              sessionLabel: formatTaskLabel(session),
              motionType: publishedPairing.motionType,
              role: "chair" as const,
              hasSubmitted: visibleTask.hasSubmitted,
              scoringStatus: scoringStatus.scoringStatus,
              chairName: names[chairId] ?? session.assignedChairLabel,
              panel: room.adjudicators
                .filter((adjudicator) => !adjudicator.isChair)
                .map((adjudicator) => ({
                  participantId: adjudicator.participantId,
                  name: names[adjudicator.participantId] ?? adjudicator.participantId,
                })),
              speakers: room.teams.flatMap((team) =>
                team.speakers.map((speaker) => ({
                  participantId: speaker.participantId,
                  name: names[speaker.participantId] ?? speaker.participantId,
                  bpPosition: team.bpPosition,
                  speakingRole: speaker.speakingRole,
                })),
              ),
            } satisfies ScoringTaskView;
          }),
        );

        if (cancelled) return;
        const nextTasks: ScoringTaskView[] = loaded.filter((task) => task !== null) as ScoringTaskView[];
        setTasks(nextTasks);
        setSelectedSessionId((current) => current ?? nextTasks[0]?.sessionId ?? null);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Failed to load scoring tasks.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [currentParticipantId, sessions]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.sessionId === selectedSessionId) ?? tasks[0] ?? null,
    [selectedSessionId, tasks],
  );

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    setSpeakerForm({ chairScore: "", teamDynamicsRating: "", notes: "" });
    setChairForm({
      adjudicatorScores: Object.fromEntries(selectedTask.panel.map((entry) => [entry.participantId, ""])),
      speakerScores: Object.fromEntries(
        selectedTask.speakers.map((entry) => [entry.participantId, { rawScore: "", teamResultPoints: "" }]),
      ),
    });
    setSubmitState({ saving: false, message: null, error: null });
  }, [selectedTask?.sessionId]);

  async function handleSpeakerSubmit() {
    if (!selectedTask) return;
    setSubmitState({ saving: true, message: null, error: null });
    try {
      await fetchJson(`/api/scoring/speaker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedTask.sessionId,
          chairScore: Number(speakerForm.chairScore),
          teamDynamicsRating: speakerForm.teamDynamicsRating ? Number(speakerForm.teamDynamicsRating) : null,
          notes: speakerForm.notes.trim() ? speakerForm.notes : null,
        }),
      });
      setTasks((current) => current.map((task) => task.sessionId === selectedTask.sessionId ? { ...task, hasSubmitted: true } : task));
      setSubmitState({ saving: false, message: "Speaker form submitted.", error: null });
    } catch (caught) {
      setSubmitState({ saving: false, message: null, error: caught instanceof Error ? caught.message : "Speaker scoring failed." });
    }
  }

  async function handleChairSubmit() {
    if (!selectedTask) return;
    setSubmitState({ saving: true, message: null, error: null });
    try {
      await fetchJson(`/api/scoring/chair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedTask.sessionId,
          adjudicatorScores: selectedTask.panel.map((entry) => ({
            adjudicatorMemberId: entry.participantId,
            rating: Number(chairForm.adjudicatorScores[entry.participantId]),
            notes: null,
          })),
          speakerScores: selectedTask.speakers.map((entry) => ({
            memberId: entry.participantId,
            rawScore: Number(chairForm.speakerScores[entry.participantId]?.rawScore),
            bpPosition: entry.bpPosition,
            speakingRole: entry.speakingRole,
            teamResultPoints: Number(chairForm.speakerScores[entry.participantId]?.teamResultPoints),
          })),
        }),
      });
      setTasks((current) => current.map((task) => task.sessionId === selectedTask.sessionId ? { ...task, hasSubmitted: true } : task));
      setSubmitState({ saving: false, message: "Chair form submitted.", error: null });
    } catch (caught) {
      setSubmitState({ saving: false, message: null, error: caught instanceof Error ? caught.message : "Chair scoring failed." });
    }
  }

  if (loading) {
    return <EmptyState title="Loading scoring tasks" body="Fetching your live role-based scoring tasks." />;
  }

  if (error) {
    return <EmptyState title="Scoring tasks unavailable" body={error} />;
  }

  if (tasks.length === 0) {
    return (
      <div>
        <SectionHeader
          title="My Scoring Tasks"
          subtitle="Only published sessions where you are a speaker or assigned chair appear here."
        />
        <EmptyState
          title="No scoring tasks right now"
          body={
            role === "TechHead"
              ? "TechHead does not receive speaker or chair scoring forms."
              : "You do not currently have any published speaker or chair scoring task pending in the pairing system."
          }
        />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="My Scoring Tasks"
        subtitle="Submit the real role-based scoring form for your published session assignment."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tasks.map((task) => (
          <SecondaryButton
            key={task.sessionId}
            type="button"
            onClick={() => setSelectedSessionId(task.sessionId)}
            className={selectedTask?.sessionId === task.sessionId ? "border-blue-600 text-blue-700" : ""}
          >
            {task.sessionLabel}
          </SecondaryButton>
        ))}
      </div>

      {selectedTask && (
        <Card className="p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedTask.sessionLabel}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Motion type: {selectedTask.motionType} | Role: {selectedTask.role === "speaker" ? "Speaker" : "Chair"}
              </p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-medium ${selectedTask.hasSubmitted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {selectedTask.hasSubmitted ? "Submitted" : "Pending"}
            </div>
          </div>

          {submitState.message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{submitState.message}</div>}
          {submitState.error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitState.error}</div>}

          {selectedTask.role === "speaker" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Assigned chair: <span className="font-medium text-slate-900">{selectedTask.chairName ?? "N/A"}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Chair score (0-10)">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={speakerForm.chairScore}
                    onChange={(event) => setSpeakerForm((current) => ({ ...current, chairScore: event.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    disabled={selectedTask.hasSubmitted || submitState.saving}
                  />
                </Field>
                <Field label="Team dynamics (optional, 0-10)">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={speakerForm.teamDynamicsRating}
                    onChange={(event) => setSpeakerForm((current) => ({ ...current, teamDynamicsRating: event.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    disabled={selectedTask.hasSubmitted || submitState.saving}
                  />
                </Field>
              </div>
              <Field label="Notes (optional)">
                <textarea
                  value={speakerForm.notes}
                  onChange={(event) => setSpeakerForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  disabled={selectedTask.hasSubmitted || submitState.saving}
                />
              </Field>
              <PrimaryButton
                type="button"
                disabled={selectedTask.hasSubmitted || submitState.saving || speakerForm.chairScore.trim() === ""}
                onClick={handleSpeakerSubmit}
              >
                Submit speaker form
              </PrimaryButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Adjudicator scores</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedTask.panel.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No panel adjudicators in this room.</div>
                  ) : selectedTask.panel.map((entry) => (
                    <Field key={entry.participantId} label={entry.name}>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={chairForm.adjudicatorScores[entry.participantId] ?? ""}
                        onChange={(event) => setChairForm((current) => ({
                          ...current,
                          adjudicatorScores: { ...current.adjudicatorScores, [entry.participantId]: event.target.value },
                        }))}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        disabled={selectedTask.hasSubmitted || submitState.saving}
                      />
                    </Field>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Speaker scores</h4>
                <div className="space-y-4">
                  {selectedTask.speakers.map((entry) => (
                    <div key={entry.participantId} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-3 text-sm font-medium text-slate-900">
                        {entry.name} | {entry.bpPosition} | {entry.speakingRole}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Raw score">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={chairForm.speakerScores[entry.participantId]?.rawScore ?? ""}
                            onChange={(event) => setChairForm((current) => ({
                              ...current,
                              speakerScores: {
                                ...current.speakerScores,
                                [entry.participantId]: {
                                  rawScore: event.target.value,
                                  teamResultPoints: current.speakerScores[entry.participantId]?.teamResultPoints ?? "",
                                },
                              },
                            }))}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            disabled={selectedTask.hasSubmitted || submitState.saving}
                          />
                        </Field>
                        <Field label="Team result points">
                          <input
                            type="number"
                            min={0}
                            max={3}
                            value={chairForm.speakerScores[entry.participantId]?.teamResultPoints ?? ""}
                            onChange={(event) => setChairForm((current) => ({
                              ...current,
                              speakerScores: {
                                ...current.speakerScores,
                                [entry.participantId]: {
                                  rawScore: current.speakerScores[entry.participantId]?.rawScore ?? "",
                                  teamResultPoints: event.target.value,
                                },
                              },
                            }))}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            disabled={selectedTask.hasSubmitted || submitState.saving}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <PrimaryButton
                type="button"
                disabled={selectedTask.hasSubmitted || submitState.saving}
                onClick={handleChairSubmit}
              >
                Submit chair form
              </PrimaryButton>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  ListChecks,
  Send,
  Users,
  Wand2,
} from "lucide-react";
import {
  Card,
  EmptyState,
  Field,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StateBadge,
} from "./ui";
import type {
  LifecycleState,
  Participant,
  SessionRow,
  WorkspaceSessionData,
} from "./types";
import type { PairingProposalView } from "@/types/pairing";
import type {
  SessionPreparationContextResponse,
  SessionScoringStatusResponse,
} from "@/types/session";

type StepKey = "prepare" | "setup" | "review" | "publish" | "post";

type SessionWorkspaceProps = {
  userName: string;
  participants: Participant[];
  sessions: SessionRow[];
  onSessionsChange: (sessions: SessionRow[]) => void;
  loading: boolean;
  error: string | null;
};

const STEPS: { key: StepKey; label: string }[] = [
  { key: "prepare", label: "Prepare" },
  { key: "setup", label: "Setup" },
  { key: "review", label: "Generate & Review" },
  { key: "publish", label: "Publish" },
  { key: "post", label: "Post-session" },
];

const STEP_INDEX: Record<StepKey, number> = {
  prepare: 0,
  setup: 1,
  review: 2,
  publish: 3,
  post: 4,
};

type AttendanceDraft = Record<
  string,
  { isPresent: boolean; sessionRole: "speaker" | "adjudicator" }
>;

type OverrideSpeakerSlotDraft = {
  slotKey: string;
  bpPosition: "OG" | "OO" | "CG" | "CO";
  speakingRole: "PM" | "DPM" | "LO" | "DLO" | "MG" | "GW" | "MO" | "OW";
  participantId: string;
};

type OverrideAdjudicatorSlotDraft = {
  slotKey: string;
  participantId: string;
  isChair: boolean;
};

type OverrideRoomDraft = {
  roomIndex: number;
  speakerSlots: OverrideSpeakerSlotDraft[];
  adjudicatorSlots: OverrideAdjudicatorSlotDraft[];
};

type ManualOverrideDraft = {
  rooms: OverrideRoomDraft[];
};

export default function SessionWorkspace({
  userName,
  participants,
  sessions,
  onSessionsChange,
  loading,
  error,
}: SessionWorkspaceProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [step, setStep] = useState<StepKey>("prepare");
  const [workspace, setWorkspace] = useState<WorkspaceSessionData>({
    context: null,
    proposal: null,
    publishedPairing: null,
    scoringStatus: null,
  });
  const [attendanceDraft, setAttendanceDraft] = useState<AttendanceDraft>({});
  const [motionType, setMotionType] = useState("");
  const [motionText, setMotionText] = useState("");
  const [objective, setObjective] = useState("BALANCED");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideDraft, setOverrideDraft] = useState<ManualOverrideDraft | null>(null);
  const [overrideNotes, setOverrideNotes] = useState("");
  const [autoGeneratingSessionId, setAutoGeneratingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [selectedSessionId, sessions]);


  useEffect(() => {
    let cancelled = false;

    async function loadSessionWorkspace(sessionId: string) {
      setActionError(null);
      setFeedback(null);
      setBusyAction("Loading session");

      try {
        const context = await fetchJson<SessionPreparationContextResponse>(
          `/api/sessions/${sessionId}`,
        );

        if (cancelled) return;

        setWorkspace({
          context,
          proposal: null,
          publishedPairing: null,
          scoringStatus: null,
        });
        hydrateFormState(context, participants, setAttendanceDraft, setMotionType, setMotionText, setObjective);

        const nextState: WorkspaceSessionData = {
          context,
          proposal: null,
          publishedPairing: null,
          scoringStatus: null,
        };

        if (context.session.acceptedProposalId) {
          nextState.proposal = await fetchJson<PairingProposalView>(
            `/api/pairing/proposal/${context.session.acceptedProposalId}`,
          );
        }

        if (context.session.publishedProposalId || context.session.publicationStatus.toUpperCase() === "PUBLISHED") {
          nextState.publishedPairing = (
            await fetchJson<{
              publishedPairing: NonNullable<WorkspaceSessionData["publishedPairing"]>;
            }>(`/api/pairing/published/${sessionId}`)
          ).publishedPairing;
          nextState.scoringStatus = await fetchJson<SessionScoringStatusResponse>(
            `/api/sessions/${sessionId}/scoring-status`,
          );
        }

        if (!cancelled) {
          setWorkspace(nextState);
          setStep(deriveStepFromWorkspace(nextState, context));
        }
      } catch (caught) {
        if (!cancelled) {
          setActionError(
            caught instanceof Error ? caught.message : "Failed to load session workspace.",
          );
        }
      } finally {
        if (!cancelled) {
          setBusyAction(null);
        }
      }
    }

    if (selectedSessionId) {
      void loadSessionWorkspace(selectedSessionId);
    }

    return () => {
      cancelled = true;
    };
  }, [participants, selectedSessionId]);

  useEffect(() => {
    setOverrideDraft(workspace.proposal ? createManualOverrideDraft(workspace.proposal) : null);
  }, [workspace.proposal]);

  useEffect(() => {
    const pairingStatus = workspace.context?.session.pairingStatus?.toUpperCase();
    const publicationStatus = workspace.context?.session.publicationStatus?.toUpperCase();

    if (step !== "review" || !selectedSessionId || !workspace.context) {
      return;
    }

    if (workspace.proposal || publicationStatus === "PUBLISHED") {
      return;
    }

    if (pairingStatus !== "READY" && pairingStatus != "GENERATED") {
      return;
    }

    if (busyAction !== null || autoGeneratingSessionId === selectedSessionId) {
      return;
    }

    setAutoGeneratingSessionId(selectedSessionId);
    void generateProposal(
      selectedSessionId,
      setWorkspace,
      setFeedback,
      setActionError,
      setBusyAction,
    ).finally(() => {
      setAutoGeneratingSessionId((current) => current === selectedSessionId ? null : current);
    });
  }, [
    autoGeneratingSessionId,
    busyAction,
    selectedSessionId,
    setActionError,
    setFeedback,
    setWorkspace,
    step,
    workspace.context,
    workspace.proposal,
  ]);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;
  const counts = useMemo(() => {
    const entries = Object.values(attendanceDraft);
    const speakers = entries.filter(
      (entry) => entry.isPresent && entry.sessionRole === "speaker",
    ).length;
    const adjudicators = entries.filter(
      (entry) => entry.isPresent && entry.sessionRole === "adjudicator",
    ).length;
    const rooms = Math.floor(speakers / 8);
    const leftover = speakers % 8;
    return {
      speakers,
      adjudicators,
      rooms,
      leftover,
      adjudicatorCoverage: adjudicators >= Math.max(rooms, 1),
    };
  }, [attendanceDraft]);

  const stepAvailability = computeStepAvailability(workspace.context, workspace.proposal, workspace.publishedPairing);

  if (loading) {
    return <EmptyState title="Loading workspace" body="Fetching live session and roster data." />;
  }

  if (error) {
    return <EmptyState title="Workspace unavailable" body={error} />;
  }

  if (!selectedSessionId) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="No sessions available"
          body="Create a new session to start the pairing workflow."
        />
        <div className="flex justify-center">
          <PrimaryButton
            type="button"
            disabled={busyAction !== null}
            onClick={() =>
              void createInitialSession(
                userName,
                sessions,
                onSessionsChange,
                setSelectedSessionId,
                setFeedback,
                setActionError,
                setBusyAction,
              )
            }
          >
            Create session
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <SectionHeader
        title="Session Workspace"
        subtitle={selectedSession ? selectedSession.date : "Session workspace"}
        right={<StateBadge state={deriveUiState(workspace, selectedSession?.state)} />}
      />

      <Card className="mb-6 p-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Field label="Session">
            <select
              value={selectedSessionId}
              onChange={(event) => setSelectedSessionId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.date} · {session.motionType}
                </option>
              ))}
            </select>
          </Field>
          <div className="text-sm text-slate-500">
            Chair default: <span className="font-medium text-slate-900">{userName}</span>
          </div>
        </div>
      </Card>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {STEPS.map((entry) => {
          const enabled = stepAvailability[entry.key];
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => enabled && setStep(entry.key)}
              disabled={!enabled}
              className={`rounded-lg border px-4 py-3 text-left text-sm ${
                step === entry.key
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : enabled
                    ? "border-slate-200 bg-white text-slate-600"
                    : "border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Step
              </div>
              <div className="mt-1 font-semibold">{entry.label}</div>
            </button>
          );
        })}
      </div>

      {busyAction && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {busyAction}…
        </div>
      )}
      {feedback && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {feedback}
        </div>
      )}
      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {actionError}
        </div>
      )}

      {step === "prepare" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Users size={16} /> Attendance and roles
            </h3>
            <div className="space-y-3">
              {participants.map((participant) => {
                const draft = attendanceDraft[participant.id] ?? {
                  isPresent: false,
                  sessionRole: "speaker" as const,
                };

                return (
                  <div
                    key={participant.id}
                    className="grid gap-3 rounded-lg border border-slate-200 px-4 py-3 md:grid-cols-[minmax(0,1fr)_160px_120px]"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{participant.name}</div>
                      <div className="text-sm text-slate-500">
                        {participant.account}
                        {participant.position ? ` - ${participant.position}` : ""}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Session role
                      </div>
                      <select
                        value={draft.sessionRole}
                        onChange={(event) => {
                          setAttendanceDraft((current) => ({
                            ...current,
                            [participant.id]: {
                              ...draft,
                              isPresent: true,
                              sessionRole: event.target.value as "speaker" | "adjudicator",
                            },
                          }));
                        }}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="speaker">Speaker</option>
                        <option value="adjudicator">Adjudicator</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 self-end text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.isPresent}
                        onChange={(event) => {
                          setAttendanceDraft((current) => ({
                            ...current,
                            [participant.id]: {
                              ...draft,
                              isPresent: event.target.checked,
                            },
                          }));
                        }}
                      />
                      Present
                    </label>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <ListChecks size={16} /> Feasibility
            </h3>
            <div className="space-y-2 text-sm">
              <MetricRow label="Speakers" value={counts.speakers} />
              <MetricRow label="Adjudicators" value={counts.adjudicators} />
              <MetricRow label="Rooms possible" value={counts.rooms} />
              <MetricRow label="Leftover speakers" value={counts.leftover} />
              <MetricRow
                label="Adjudicator coverage"
                value={counts.adjudicatorCoverage ? "OK" : "Needs more adjudicators"}
              />
            </div>
          </Card>
        </div>
      )}

      {step === "setup" && (
        <Card className="p-4">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <ClipboardList size={16} /> Session-only inputs
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Motion type">
              <input
                value={motionType}
                onChange={(event) => setMotionType(event.target.value)}
                placeholder="IR / Policy / Moral / ..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Pairing objective">
              <select
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="BALANCED">Balanced</option>
                <option value="COMPETITIVE">Competitive</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Motion text">
                <textarea
                  value={motionText}
                  onChange={(event) => setMotionText(event.target.value)}
                  rows={4}
                  placeholder="Enter the session motion."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {step === "review" && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Wand2 size={16} /> Generate & Review
          </h3>
          {workspace.proposal ? (
            <>
              <ProposalView proposal={workspace.proposal} participants={participants} />
              <OverridePanel
                open={overrideOpen}
                onToggle={() => setOverrideOpen((current) => !current)}
                proposal={workspace.proposal}
                participants={participants}
                presentParticipantIds={
                  workspace.context?.attendance
                    .filter((entry) => entry.isPresent)
                    .map((entry) => entry.participantId) ?? []
                }
                draft={overrideDraft}
                onDraftChange={setOverrideDraft}
                overrideNotes={overrideNotes}
                onOverrideNotesChange={setOverrideNotes}
                disabled={busyAction !== null}
                onSubmit={() => {
                  const proposalId = workspace.proposal?.summary.proposalId;
                  if (!proposalId || !overrideDraft) return Promise.resolve();
                  return submitProposalOverride(
                    proposalId,
                    selectedSessionId,
                    buildManualOverridePayload(overrideDraft),
                    overrideNotes,
                    setWorkspace,
                    setFeedback,
                    setActionError,
                    setBusyAction,
                  );
                }}
              />
            </>
          ) : (
            <EmptyState
              title="No proposal generated yet"
              body="Generating the proposal automatically for review. If it does not appear, use Regenerate once the first pass completes."
            />
          )}
        </Card>
      )}

      {step === "publish" && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Send size={16} /> Publish
          </h3>
          {workspace.publishedPairing ? (
            <PublishedView publishedPairing={workspace.publishedPairing} participants={participants} />
          ) : workspace.proposal ? (
            <EmptyState
              title="Approved proposal ready for publish"
              body="Once you publish, this session becomes the official member-visible pairing."
            />
          ) : (
            <EmptyState
              title="Nothing to publish yet"
              body="Generate and approve a proposal before trying to publish."
            />
          )}
        </Card>
      )}

      {step === "post" && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <ClipboardList size={16} /> Post-session scoring
          </h3>
          {workspace.scoringStatus ? (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                Scoring status:{" "}
                <span className="font-semibold text-slate-900">
                  {workspace.scoringStatus.scoringStatus}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {workspace.scoringStatus.tasks.map((task) => (
                  <div
                    key={task.participantId}
                    className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                  >
                    <div className="font-medium text-slate-900">{findParticipantName(participants, task.participantId)}</div>
                    <div className="mt-1 text-slate-600">
                      Role: {task.sessionRole} · {task.hasSubmitted ? "Submitted" : "Pending"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Scoring not open yet"
              body="Post-session scoring will appear here after publication and scoring window activation."
            />
          )}
        </Card>
      )}

      <div className="sticky bottom-4 z-10 mt-6 rounded-xl border border-slate-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur">
        <div className="mb-3 text-xs text-slate-500">
          Step navigation
          {busyAction === null && !canAdvance(step, stepAvailability) && step !== "post"
            ? " - complete the current step action to unlock the next stage."
            : " - use Previous or Next to move through the workflow."}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <SecondaryButton
            type="button"
            onClick={() => setStep(previousStep(step))}
            disabled={STEP_INDEX[step] === 0 || busyAction !== null}
          >
            <ArrowLeft size={16} />
            Previous
          </SecondaryButton>

          <div className="flex flex-wrap gap-3">
          {step === "review" && workspace.proposal && (
            <SecondaryButton
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                const proposalId = workspace.proposal?.summary.proposalId;
                if (!proposalId) return;
                void regenerateCurrentProposal(
                  proposalId,
                  setWorkspace,
                  setFeedback,
                  setActionError,
                  setBusyAction,
                );
              }}
            >
              Regenerate
            </SecondaryButton>
          )}
          {step === "publish" && (
            <PrimaryButton
              type="button"
              disabled={busyAction !== null || !workspace.proposal}
              onClick={() => void publishCurrentProposal(selectedSessionId, setWorkspace, setFeedback, setActionError, setBusyAction, setStep)}
            >
              Publish official pairing
            </PrimaryButton>
          )}
          {step === "post" && workspace.context?.session.publicationStatus.toUpperCase() === "PUBLISHED" && (
            <SecondaryButton
              type="button"
              disabled={busyAction !== null}
              onClick={() => void refreshScoringStatus(selectedSessionId, setWorkspace, setFeedback, setActionError, setBusyAction)}
            >
              Refresh scoring
            </SecondaryButton>
          )}

          <PrimaryButton
            type="button"
            disabled={!canAdvance(step, stepAvailability) || busyAction !== null}
            onClick={() => {
              if (step === "prepare") {
                void savePreparation(
                  selectedSessionId,
                  attendanceDraft,
                  setWorkspace,
                  setAttendanceDraft,
                  setFeedback,
                  setActionError,
                  setBusyAction,
                  participants,
                  setMotionType,
                  setMotionText,
                  setObjective,
                  setStep,
                  true,
                );
                return;
              }
              if (step === "setup") {
                void saveSetup(
                  selectedSessionId,
                  motionType,
                  motionText,
                  objective,
                  setWorkspace,
                  setFeedback,
                  setActionError,
                  setBusyAction,
                  setStep,
                );
                return;
              }
              if (step === "review") {
                const proposalId = workspace.proposal?.summary.proposalId;
                if (!proposalId) {
                  return;
                }
                void approveCurrentProposal(
                  proposalId,
                  selectedSessionId,
                  setWorkspace,
                  setFeedback,
                  setActionError,
                  setBusyAction,
                  setStep,
                );
                return;
              }
              setStep(nextStep(step));
            }}
          >
            Next
            <ArrowRight size={16} />
          </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

async function createInitialSession(
  userName: string,
  sessions: SessionRow[],
  onSessionsChange: (sessions: SessionRow[]) => void,
  setSelectedSessionId: React.Dispatch<React.SetStateAction<string>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
) {
  setBusyAction("Creating session");
  setActionError(null);
  setFeedback(null);
  try {
    const created = await fetchJson<{
      sessionId: string;
      motionType: string;
      pairingStatus: string;
      publicationStatus: string;
      scoringStatus: string;
    }>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ chair: userName }),
    });

    const nextSession: SessionRow = {
      id: created.sessionId,
      date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
      motionType: created.motionType,
      chair: userName,
      state: "Preparation",
      attendance: [],
    };

    onSessionsChange([nextSession, ...sessions]);
    setSelectedSessionId(created.sessionId);
    setFeedback("New session created. Continue with attendance and setup.");
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Session creation failed.");
  } finally {
    setBusyAction(null);
  }
}

function hydrateFormState(
  context: SessionPreparationContextResponse,
  participants: Participant[],
  setAttendanceDraft: React.Dispatch<React.SetStateAction<AttendanceDraft>>,
  setMotionType: React.Dispatch<React.SetStateAction<string>>,
  setMotionText: React.Dispatch<React.SetStateAction<string>>,
  setObjective: React.Dispatch<React.SetStateAction<string>>,
) {
  const roleMap = new Map(
    context.sessionRoles.map((assignment) => [assignment.participantId, assignment.role]),
  );
  const attendanceMap = new Map(
    context.attendance.map((record) => [record.participantId, record.isPresent]),
  );

  const nextDraft: AttendanceDraft = {};
  for (const participant of participants) {
    nextDraft[participant.id] = {
      isPresent: attendanceMap.get(participant.id) ?? false,
      sessionRole: roleMap.get(participant.id) ?? "speaker",
    };
  }

  setAttendanceDraft(nextDraft);
  setMotionType(context.session.motionType ?? "");
  setMotionText(context.session.motionText ?? "");
  setObjective(context.session.pairingObjective ?? "BALANCED");
}

function deriveStepFromContext(context: SessionPreparationContextResponse): StepKey {
  const pairingStatus = context.session.pairingStatus.toUpperCase();
  const publicationStatus = context.session.publicationStatus.toUpperCase();

  if (context.session.publishedProposalId || publicationStatus === "PUBLISHED") return "post";
  if (context.session.acceptedProposalId || pairingStatus === "APPROVED") return "publish";
  if (pairingStatus === "GENERATED") return "review";
  if (pairingStatus === "READY") return "review";
  if (pairingStatus === "PREPARATION") return "setup";
  return "prepare";
}

function deriveStepFromWorkspace(
  workspace: WorkspaceSessionData,
  context: SessionPreparationContextResponse,
): StepKey {
  if (workspace.publishedPairing || workspace.scoringStatus || context.session.publishedProposalId) {
    return "post";
  }
  if (workspace.proposal || context.session.acceptedProposalId) {
    return "publish";
  }
  return deriveStepFromContext(context);
}

function computeStepAvailability(
  context: SessionPreparationContextResponse | null,
  proposal: PairingProposalView | null,
  publishedPairing: WorkspaceSessionData["publishedPairing"],
) {
  const pairingStatus = context?.session.pairingStatus.toUpperCase();
  const publicationStatus = context?.session.publicationStatus.toUpperCase();

  return {
    prepare: true,
    setup: Boolean(context),
    review: pairingStatus === "READY" || pairingStatus === "GENERATED" || pairingStatus === "APPROVED" || publicationStatus === "PUBLISHED",
    publish: Boolean(proposal) || pairingStatus === "APPROVED" || publicationStatus === "PUBLISHED",
    post: Boolean(publishedPairing) || publicationStatus === "PUBLISHED",
  } satisfies Record<StepKey, boolean>;
}

function deriveUiState(
  workspace: WorkspaceSessionData,
  fallback: LifecycleState | undefined,
): LifecycleState {
  const scoringStatus = workspace.scoringStatus?.scoringStatus;
  const pairingStatus = workspace.context?.session.pairingStatus.toUpperCase();
  const publicationStatus = workspace.context?.session.publicationStatus.toUpperCase();

  if (scoringStatus === "complete") return "Scored";
  if (workspace.publishedPairing || publicationStatus === "PUBLISHED") return "Published";
  if (pairingStatus === "APPROVED") return "Approved";
  if (pairingStatus === "GENERATED") return "Generated";
  return fallback ?? "Preparation";
}

async function savePreparation(
  sessionId: string,
  attendanceDraft: AttendanceDraft,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
  setAttendanceDraft: React.Dispatch<React.SetStateAction<AttendanceDraft>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
  participants: Participant[],
  setMotionType: React.Dispatch<React.SetStateAction<string>>,
  setMotionText: React.Dispatch<React.SetStateAction<string>>,
  setObjective: React.Dispatch<React.SetStateAction<string>>,
  setStep: React.Dispatch<React.SetStateAction<StepKey>>,
  advanceToSetup = true,
) {
  setBusyAction("Saving attendance");
  setActionError(null);
  setFeedback(null);
  try {
    const entries = Object.entries(attendanceDraft).map(([participantId, value]) => ({
      participantId,
      isPresent: value.isPresent,
      sessionRole: value.sessionRole,
    }));

    const context = await fetchJson<SessionPreparationContextResponse>("/api/attendance/mark", {
      method: "POST",
      body: JSON.stringify({ sessionId, entries }),
    });

    setWorkspace((current) => ({ ...current, context }));
    hydrateFormState(
      context,
      participants,
      setAttendanceDraft,
      setMotionType,
      setMotionText,
      setObjective,
    );
    setFeedback(advanceToSetup ? "Attendance and session roles saved." : "Attendance updated.");
    if (advanceToSetup) {
      setStep("setup");
    }
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Attendance save failed.");
  } finally {
    setBusyAction(null);
  }
}

async function saveSetup(
  sessionId: string,
  motionType: string,
  motionText: string,
  objective: string,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
  setStep: React.Dispatch<React.SetStateAction<StepKey>>,
) {
  setBusyAction("Saving session setup");
  setActionError(null);
  setFeedback(null);
  try {
    await fetchJson(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        motionType,
        motionText,
        pairingObjective: objective,
        pairingStatus: "READY",
      }),
    });

    const context = await fetchJson<SessionPreparationContextResponse>(`/api/sessions/${sessionId}`);
    setWorkspace((current) => ({ ...current, context }));
    setFeedback("Session setup saved.");
    setStep("review");
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Session setup save failed.");
  } finally {
    setBusyAction(null);
  }
}

async function generateProposal(
  sessionId: string,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
) {
  setBusyAction("Generating proposal");
  setActionError(null);
  setFeedback(null);
  try {
    const generated = await fetchJson<{ proposal: PairingProposalView }>("/api/pairing/generate", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
    const context = await fetchJson<SessionPreparationContextResponse>(`/api/sessions/${sessionId}`);
    setWorkspace((current) => ({
      ...current,
      context,
      proposal: generated.proposal,
    }));
    setFeedback("Proposal generated. Review it below.");
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Proposal generation failed.");
  } finally {
    setBusyAction(null);
  }
}

async function approveCurrentProposal(
  proposalId: string,
  sessionId: string,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
  setStep: React.Dispatch<React.SetStateAction<StepKey>>,
) {
  setBusyAction("Approving proposal");
  setActionError(null);
  setFeedback(null);
  try {
    await fetchJson(`/api/pairing/proposal/${proposalId}/approve`, {
      method: "POST",
    });
    const context = await fetchJson<SessionPreparationContextResponse>(`/api/sessions/${sessionId}`);
    const proposal = await fetchJson<PairingProposalView>(
      `/api/pairing/proposal/${proposalId}`,
    );
    setWorkspace((current) => ({ ...current, context, proposal }));
    setFeedback("Proposal approved.");
    setStep("publish");
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Proposal approval failed.");
  } finally {
    setBusyAction(null);
  }
}

async function regenerateCurrentProposal(
  proposalId: string,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
) {
  setBusyAction("Regenerating proposal");
  setActionError(null);
  setFeedback(null);
  try {
    const regenerated = await fetchJson<{ proposal: PairingProposalView }>(
      `/api/pairing/proposal/${proposalId}/regenerate`,
      { method: "POST" },
    );
    setWorkspace((current) => ({
      ...current,
      proposal: regenerated.proposal,
    }));
    setFeedback("Fresh proposal generated.");
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Proposal regeneration failed.");
  } finally {
    setBusyAction(null);
  }
}

async function submitProposalOverride(
  proposalId: string,
  sessionId: string,
  payload: Record<string, unknown>,
  overrideNotes: string,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
) {
  setBusyAction("Submitting override");
  setActionError(null);
  setFeedback(null);

  try {
    const result = await fetchJson<{ proposal: PairingProposalView }>(
      `/api/pairing/proposal/${proposalId}/override`,
      {
        method: "POST",
        body: JSON.stringify({
          overrideType: "MANUAL_ASSIGNMENT",
          payload,
          notes: overrideNotes.trim() ? overrideNotes.trim() : null,
        }),
      },
    );

    const context = await fetchJson<SessionPreparationContextResponse>(`/api/sessions/${sessionId}`);
    setWorkspace((current) => ({
      ...current,
      context,
      proposal: result.proposal,
    }));
    setFeedback("Override submitted and proposal updated.");
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Proposal override failed.");
  } finally {
    setBusyAction(null);
  }
}

async function publishCurrentProposal(
  sessionId: string,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
  setStep: React.Dispatch<React.SetStateAction<StepKey>>,
) {
  setBusyAction("Publishing pairing");
  setActionError(null);
  setFeedback(null);
  try {
    const publishedPairing = (
      await fetchJson<{
        publishedPairing: NonNullable<WorkspaceSessionData["publishedPairing"]>;
      }>(`/api/pairing/publish/${sessionId}`, {
        method: "POST",
      })
    ).publishedPairing;
    const context = await fetchJson<SessionPreparationContextResponse>(`/api/sessions/${sessionId}`);
    const scoringStatus = await fetchJson<SessionScoringStatusResponse>(
      `/api/sessions/${sessionId}/scoring-status`,
    );
    setWorkspace((current) => ({
      ...current,
      context,
      publishedPairing,
      scoringStatus,
    }));
    setFeedback("Official pairing published.");
    setStep("post");
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Publish failed.");
  } finally {
    setBusyAction(null);
  }
}

async function refreshScoringStatus(
  sessionId: string,
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
  setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
  setActionError: React.Dispatch<React.SetStateAction<string | null>>,
  setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
) {
  setBusyAction("Refreshing scoring");
  setActionError(null);
  setFeedback(null);
  try {
    const scoringStatus = await fetchJson<SessionScoringStatusResponse>(
      `/api/sessions/${sessionId}/scoring-status`,
    );
    setWorkspace((current) => ({ ...current, scoringStatus }));
    setFeedback("Scoring status refreshed.");
  } catch (caught) {
    setActionError(caught instanceof Error ? caught.message : "Scoring refresh failed.");
  } finally {
    setBusyAction(null);
  }
}

function canAdvance(step: StepKey, availability: Record<StepKey, boolean>) {
  if (step === "post") return false;
  return availability[nextStep(step)];
}

function previousStep(step: StepKey): StepKey {
  return STEPS[Math.max(STEP_INDEX[step] - 1, 0)].key;
}

function nextStep(step: StepKey): StepKey {
  return STEPS[Math.min(STEP_INDEX[step] + 1, STEPS.length - 1)].key;
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function ProposalView({ proposal, participants }: { proposal: PairingProposalView; participants: Participant[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm text-slate-600">
          Proposal v{proposal.summary.version} ?? Score{" "}
          <span className="font-semibold text-slate-900">
            {proposal.summary.proposalScore.toFixed(2)}
          </span>
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Status: {proposal.summary.status} ?? Top-band rank:{" "}
          {proposal.summary.topBandRank ?? "???"}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {proposal.rooms.map((room) => (
          <div key={room.roomIndex} className="rounded-lg border border-slate-200 p-4">
            <div className="font-semibold text-slate-900">Room {room.roomIndex}</div>
            <div className="mt-2 text-sm text-slate-600">
              Balance {room.roomBalanceScore?.toFixed(2) ?? "???"} ?? Difficulty{" "}
              {room.roomDifficultyScore?.toFixed(2) ?? "???"}
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {room.teams.map((team) => (
                <div key={team.bpPosition}>
                  <span className="font-medium text-slate-900">{team.bpPosition}</span>: {" "}
                  {team.speakers
                    .map((speaker) => `${findParticipantName(participants, speaker.participantId)} (${speaker.speakingRole})`)
                    .join(", ")}
                </div>
              ))}
              <div>
                <span className="font-medium text-slate-900">Adjudicators</span>: {" "}
                {room.adjudicators
                  .map(
                    (adjudicator) =>
                      `${findParticipantName(participants, adjudicator.participantId)}${adjudicator.isChair ? " (Chair)" : ""}`,
                  )
                  .join(", ")}
              </div>
            </div>
          </div>
        ))}
      </div>
      {proposal.unassignedParticipants.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Unassigned speakers: {proposal.unassignedParticipants.length}</div>
          <div className="mt-2 space-y-1">
            {proposal.unassignedParticipants.map((participant) => (
              <div key={participant.participantId}>
                {findParticipantName(participants, participant.participantId)} - {formatLeftoverReason(participant.reason)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function formatLeftoverReason(reason: string) {
  switch (reason) {
    case "INSUFFICIENT_SPEAKERS_FOR_FULL_ROOM":
      return "Not enough speakers to fill another full BP room";
    case "ROLE_MISMATCH":
      return "Role split did not fit room construction";
    case "ADMIN_EXCLUDED":
      return "Excluded by admin decision";
    case "CONSTRAINT_CONFLICT":
      return "Blocked by active pairing constraints";
    default:
      return reason;
  }
}

const OVERRIDE_TEAM_LAYOUT = [
  { bpPosition: "OG", roles: ["PM", "DPM"] },
  { bpPosition: "OO", roles: ["LO", "DLO"] },
  { bpPosition: "CG", roles: ["MG", "GW"] },
  { bpPosition: "CO", roles: ["MO", "OW"] },
] as const;

function createManualOverrideDraft(proposal: PairingProposalView): ManualOverrideDraft {
  return {
    rooms: proposal.rooms.map((room) => ({
      roomIndex: room.roomIndex,
      speakerSlots: OVERRIDE_TEAM_LAYOUT.flatMap(({ bpPosition, roles }) => {
        const team = room.teams.find((entry) => entry.bpPosition === bpPosition);
        return roles.map((role, roleIndex) => ({
          slotKey: `${room.roomIndex}-${bpPosition}-${role}`,
          bpPosition,
          speakingRole: role,
          participantId: team?.speakers[roleIndex]?.participantId ?? "",
        }));
      }),
      adjudicatorSlots:
        room.adjudicators.length > 0
          ? room.adjudicators.map((adjudicator, index) => ({
              slotKey: `${room.roomIndex}-adj-${index}`,
              participantId: adjudicator.participantId,
              isChair: adjudicator.isChair,
            }))
          : [{ slotKey: `${room.roomIndex}-chair-0`, participantId: "", isChair: true }],
    })),
  };
}

function buildManualOverridePayload(draft: ManualOverrideDraft): Record<string, unknown> {
  const assignedParticipantIds = new Set<string>();

  return {
    rooms: draft.rooms.map((room) => ({
      roomIndex: room.roomIndex,
      teams: OVERRIDE_TEAM_LAYOUT.map(({ bpPosition, roles }) => ({
        bpPosition,
        speakers: roles.map((role) => {
          const slot = room.speakerSlots.find(
            (entry) => entry.bpPosition === bpPosition && entry.speakingRole === role,
          );
          if (!slot?.participantId) {
            throw new Error(`${bpPosition} ${role} must have a participant.`);
          }
          assignedParticipantIds.add(slot.participantId);
          return {
            participantId: slot.participantId,
            speakingRole: role,
          };
        }),
      })),
      adjudicators: room.adjudicatorSlots.map((slot) => {
        if (!slot.participantId) {
          throw new Error(`Room ${room.roomIndex} has an empty adjudicator slot.`);
        }
        assignedParticipantIds.add(slot.participantId);
        return {
          participantId: slot.participantId,
          isChair: slot.isChair,
        };
      }),
    })),
    assignedParticipantIds: [...assignedParticipantIds],
  };
}

function deriveManualOverrideState(draft: ManualOverrideDraft, presentParticipantIds: string[]) {
  const assignmentCounts = new Map<string, number>();

  for (const room of draft.rooms) {
    for (const slot of room.speakerSlots) {
      if (!slot.participantId) continue;
      assignmentCounts.set(slot.participantId, (assignmentCounts.get(slot.participantId) ?? 0) + 1);
    }
    for (const slot of room.adjudicatorSlots) {
      if (!slot.participantId) continue;
      assignmentCounts.set(slot.participantId, (assignmentCounts.get(slot.participantId) ?? 0) + 1);
    }
  }

  return {
    duplicateParticipantIds: [...assignmentCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([participantId]) => participantId),
    unassignedParticipantIds: presentParticipantIds.filter(
      (participantId) => !assignmentCounts.has(participantId),
    ),
  };
}

function OverridePanel({
  open,
  onToggle,
  proposal,
  participants,
  presentParticipantIds,
  draft,
  onDraftChange,
  overrideNotes,
  onOverrideNotesChange,
  disabled,
  onSubmit,
}: {
  open: boolean;
  onToggle: () => void;
  proposal: PairingProposalView | null;
  participants: Participant[];
  presentParticipantIds: string[];
  draft: ManualOverrideDraft | null;
  onDraftChange: React.Dispatch<React.SetStateAction<ManualOverrideDraft | null>>;
  overrideNotes: string;
  onOverrideNotesChange: (value: string) => void;
  disabled: boolean;
  onSubmit: () => Promise<void>;
}) {
  if (!proposal || !draft) {
    return null;
  }

  const options = presentParticipantIds
    .map((participantId) => ({
      id: participantId,
      name: findParticipantName(participants, participantId),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const derived = deriveManualOverrideState(draft, presentParticipantIds);
  const canSubmit =
    !disabled &&
    derived.duplicateParticipantIds.length === 0 &&
    draft.rooms.every(
      (room) =>
        room.speakerSlots.every((slot) => !!slot.participantId) &&
        room.adjudicatorSlots.length > 0 &&
        room.adjudicatorSlots.every((slot) => !!slot.participantId) &&
        room.adjudicatorSlots.filter((slot) => slot.isChair).length === 1,
    );

  return (
    <Card className="mt-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-900">Manual override editor</h4>
          <p className="mt-1 text-sm text-slate-500">
            Reassign speakers, change speaking positions, move people into adjudication, and set the chair directly here.
          </p>
        </div>
        <SecondaryButton type="button" onClick={onToggle} disabled={disabled}>
          {open ? "Hide override" : "Open override"}
        </SecondaryButton>
      </div>
      {open && (
        <div className="mt-4 space-y-4">
          {derived.duplicateParticipantIds.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              Resolve duplicate assignments before submitting: {derived.duplicateParticipantIds.map((participantId) => findParticipantName(participants, participantId)).join(", ")}
            </div>
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            {draft.rooms.map((room) => (
              <div key={room.roomIndex} className="rounded-lg border border-slate-200 p-4">
                <div className="font-semibold text-slate-900">Room {room.roomIndex}</div>
                <div className="mt-4 space-y-3">
                  {OVERRIDE_TEAM_LAYOUT.map(({ bpPosition, roles }) => (
                    <div key={`${room.roomIndex}-${bpPosition}`} className="rounded-md border border-slate-100 p-3">
                      <div className="mb-2 text-sm font-semibold text-slate-900">{bpPosition}</div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {roles.map((role) => {
                          const slot = room.speakerSlots.find(
                            (entry) => entry.bpPosition === bpPosition && entry.speakingRole === role,
                          );
                          return (
                            <Field key={slot?.slotKey ?? `${room.roomIndex}-${bpPosition}-${role}`} label={role}>
                              <select
                                value={slot?.participantId ?? ""}
                                onChange={(event) =>
                                  onDraftChange((current) =>
                                    current
                                      ? {
                                          ...current,
                                          rooms: current.rooms.map((entry) =>
                                            entry.roomIndex !== room.roomIndex
                                              ? entry
                                              : {
                                                  ...entry,
                                                  speakerSlots: entry.speakerSlots.map((speakerSlot) =>
                                                    speakerSlot.slotKey === slot?.slotKey
                                                      ? { ...speakerSlot, participantId: event.target.value }
                                                      : speakerSlot,
                                                  ),
                                                },
                                          ),
                                        }
                                      : current,
                                  )
                                }
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                              >
                                <option value="">Select participant</option>
                                {options.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-slate-100 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">Adjudicators</div>
                    <SecondaryButton
                      type="button"
                      disabled={disabled || room.adjudicatorSlots.length >= 3}
                      onClick={() =>
                        onDraftChange((current) =>
                          current
                            ? {
                                ...current,
                                rooms: current.rooms.map((entry) =>
                                  entry.roomIndex !== room.roomIndex
                                    ? entry
                                    : {
                                        ...entry,
                                        adjudicatorSlots: [
                                          ...entry.adjudicatorSlots,
                                          {
                                            slotKey: `${room.roomIndex}-adj-${entry.adjudicatorSlots.length}`,
                                            participantId: "",
                                            isChair: false,
                                          },
                                        ],
                                      },
                                ),
                              }
                            : current,
                        )
                      }
                    >
                      Add panel slot
                    </SecondaryButton>
                  </div>
                  <div className="space-y-3">
                    {room.adjudicatorSlots.map((slot, slotIndex) => (
                      <div key={slot.slotKey} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-end">
                        <Field label={slot.isChair ? "Chair" : `Panel ${slotIndex}`}>
                          <select
                            value={slot.participantId}
                            onChange={(event) =>
                              onDraftChange((current) =>
                                current
                                  ? {
                                      ...current,
                                      rooms: current.rooms.map((entry) =>
                                        entry.roomIndex !== room.roomIndex
                                          ? entry
                                          : {
                                              ...entry,
                                              adjudicatorSlots: entry.adjudicatorSlots.map((adjudicatorSlot) =>
                                                adjudicatorSlot.slotKey === slot.slotKey
                                                  ? { ...adjudicatorSlot, participantId: event.target.value }
                                                  : adjudicatorSlot,
                                              ),
                                            },
                                      ),
                                    }
                                  : current,
                              )
                            }
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="">Select participant</option>
                            {options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="radio"
                            name={`chair-${room.roomIndex}`}
                            checked={slot.isChair}
                            onChange={() =>
                              onDraftChange((current) =>
                                current
                                  ? {
                                      ...current,
                                      rooms: current.rooms.map((entry) =>
                                        entry.roomIndex !== room.roomIndex
                                          ? entry
                                          : {
                                              ...entry,
                                              adjudicatorSlots: entry.adjudicatorSlots.map((adjudicatorSlot) => ({
                                                ...adjudicatorSlot,
                                                isChair: adjudicatorSlot.slotKey === slot.slotKey,
                                              })),
                                            },
                                      ),
                                    }
                                  : current,
                              )
                            }
                          />
                          Chair
                        </label>
                        <SecondaryButton
                          type="button"
                          disabled={disabled || room.adjudicatorSlots.length === 1}
                          onClick={() =>
                            onDraftChange((current) =>
                              current
                                ? {
                                    ...current,
                                    rooms: current.rooms.map((entry) => {
                                      if (entry.roomIndex !== room.roomIndex) {
                                        return entry;
                                      }
                                      const nextSlots = entry.adjudicatorSlots.filter(
                                        (adjudicatorSlot) => adjudicatorSlot.slotKey !== slot.slotKey,
                                      );
                                      if (nextSlots.length > 0 && !nextSlots.some((adjudicatorSlot) => adjudicatorSlot.isChair)) {
                                        nextSlots[0] = { ...nextSlots[0], isChair: true };
                                      }
                                      return {
                                        ...entry,
                                        adjudicatorSlots: nextSlots,
                                      };
                                    }),
                                  }
                                : current,
                            )
                          }
                        >
                          Remove
                        </SecondaryButton>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="font-semibold">Will stay unassigned after override: {derived.unassignedParticipantIds.length}</div>
            <div className="mt-2">
              {derived.unassignedParticipantIds.length > 0
                ? derived.unassignedParticipantIds.map((participantId) => findParticipantName(participants, participantId)).join(", ")
                : "Everyone present is assigned in the edited proposal."}
            </div>
          </div>
          <Field label="Notes">
            <textarea
              value={overrideNotes}
              onChange={(event) => onOverrideNotesChange(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Why you are overriding this proposal"
            />
          </Field>
          <div className="flex justify-end">
            <PrimaryButton type="button" disabled={!canSubmit} onClick={() => void onSubmit()}>
              Apply manual override
            </PrimaryButton>
          </div>
        </div>
      )}
    </Card>
  );
}

function PublishedView({
  publishedPairing,
  participants,
}: {
  publishedPairing: NonNullable<WorkspaceSessionData["publishedPairing"]>;
  participants: Participant[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Official published pairing · {publishedPairing.motionType} · {publishedPairing.publishedAt}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {publishedPairing.rooms.map((room) => (
          <div key={room.roomIndex} className="rounded-lg border border-slate-200 p-4">
            <div className="font-semibold text-slate-900">Room {room.roomIndex}</div>
            <div className="mt-3 space-y-2 text-sm">
              {room.teams.map((team) => (
                <div key={team.bpPosition}>
                  <span className="font-medium text-slate-900">{team.bpPosition}</span>:{" "}
                  {team.speakers.map((speaker) => `${findParticipantName(participants, speaker.participantId)} (${speaker.speakingRole})`).join(", ")}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function findParticipantName(participants: Participant[], participantId: string) {
  return participants.find((participant) => participant.id === participantId)?.name ?? participantId;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const fallback = `Request failed for ${url}`;
    throw new Error(await readApiError(response, fallback));
  }

  return (await response.json()) as T;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string };
    if (data.message && data.message.trim()) {
      return data.message;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

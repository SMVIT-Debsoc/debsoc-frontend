"use client";

import React, {useEffect, useMemo, useState} from "react";
import {createPortal} from "react-dom";
import {
    ArrowLeft,
    ArrowRight,
    ClipboardList,
    Gavel,
    ListChecks,
    Mic,
    Plus,
    Search,
    Send,
    Users,
    Wand2,
    X,
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
import type {PairingProposalView} from "@/types/pairing";
import type {
    SessionPreparationContextResponse,
    SessionRuleConfigView,
    SessionScoringStatusResponse,
} from "@/types/session";
import type { RealtimeEventEnvelope } from "@/types/realtime";
import ProfileAvatar from "@/components/ProfileAvatar";

type StepKey = "prepare" | "setup" | "review" | "publish" | "post";

type SessionWorkspaceProps = {
    userName: string;
    participants: Participant[];
    sessions: SessionRow[];
    onSessionsChange: (sessions: SessionRow[]) => void;
    realtimeEvent?: RealtimeEventEnvelope | null;
    loading: boolean;
    error: string | null;
};

const STEPS: {key: StepKey; label: string}[] = [
    {key: "prepare", label: "Prepare"},
    {key: "setup", label: "Setup"},
    {key: "review", label: "Generate & Review"},
    {key: "publish", label: "Publish"},
    {key: "post", label: "Post-session"},
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
    {isPresent: boolean; sessionRole: "speaker" | "adjudicator"}
>;
type TimeConstraintDraft = SessionRuleConfigView["timeConstraints"][number];
type EventTeamUpPreferenceDraft =
    SessionRuleConfigView["eventTeamUpPreferences"][number];

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
    realtimeEvent = null,
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
    const [timeConstraints, setTimeConstraints] = useState<
        TimeConstraintDraft[]
    >([]);
    const [eventTeamUpPreferences, setEventTeamUpPreferences] = useState<
        EventTeamUpPreferenceDraft[]
    >([]);
    const [selectedTimeConstraintId, setSelectedTimeConstraintId] =
        useState("");
    const [teamUpFirstParticipantId, setTeamUpFirstParticipantId] =
        useState("");
    const [teamUpSecondParticipantId, setTeamUpSecondParticipantId] =
        useState("");
    const [nextTeamUpIsStrict, setNextTeamUpIsStrict] = useState(false);
    const [busyAction, setBusyAction] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    // Raw backend errors are noisy internals â€” log them to the console for
    // debugging but never surface them in the UI. Callers keep using the same
    // Dispatch<SetStateAction<string|null>> signature; state is intentionally
    // unused.
    const setActionError = React.useCallback<
        React.Dispatch<React.SetStateAction<string | null>>
    >((value) => {
        const message = typeof value === "function" ? value(null) : value;
        if (message) console.error("[pairing]", message);
    }, []);
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [overrideDraft, setOverrideDraft] =
        useState<ManualOverrideDraft | null>(null);
    const [overrideNotes, setOverrideNotes] = useState("");
    const [autoGeneratingSessionId, setAutoGeneratingSessionId] = useState<
        string | null
    >(null);
    const [rolePicker, setRolePicker] = useState<
        null | "speaker" | "adjudicator"
    >(null);
    const [pickerFilter, setPickerFilter] = useState("");
    const [wsMounted, setWsMounted] = useState(false);

    useEffect(() => setWsMounted(true), []);

    useEffect(() => {
        if (!rolePicker) return;
        setPickerFilter("");
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setRolePicker(null);
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [rolePicker]);

    useEffect(() => {
        if (!selectedSessionId) {
            const nextSessionId = findDefaultSessionId(sessions);
            if (nextSessionId) {
                setSelectedSessionId(nextSessionId);
            }
        }
    }, [selectedSessionId, sessions]);

    const shouldRefreshSelectedSession =
        realtimeEvent !== null &&
        realtimeEvent.sessionId !== null &&
        realtimeEvent.sessionId === selectedSessionId &&
        (realtimeEvent.refetchHints.includes("session_detail") ||
            realtimeEvent.refetchHints.includes("published_pairing") ||
            realtimeEvent.refetchHints.includes("scoring_status"));

    useEffect(() => {
        let cancelled = false;

        async function loadSessionWorkspace(sessionId: string) {
            setActionError(null);
            setFeedback(null);
            setBusyAction("Loading session");

            try {
                const context =
                    await fetchJson<SessionPreparationContextResponse>(
                        `/api/sessions/${sessionId}`,
                    );

                if (cancelled) return;

                setWorkspace({
                    context,
                    proposal: null,
                    publishedPairing: null,
                    scoringStatus: null,
                });
                hydrateFormState(
                    context,
                    participants,
                    setAttendanceDraft,
                    setMotionType,
                    setMotionText,
                    setObjective,
                    setTimeConstraints,
                    setEventTeamUpPreferences,
                );

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

                if (
                    context.session.publishedProposalId ||
                    context.session.publicationStatus.toUpperCase() ===
                        "PUBLISHED"
                ) {
                    nextState.publishedPairing = (
                        await fetchJson<{
                            publishedPairing: NonNullable<
                                WorkspaceSessionData["publishedPairing"]
                            >;
                        }>(`/api/pairing/published/${sessionId}`)
                    ).publishedPairing;
                    nextState.scoringStatus =
                        await fetchJson<SessionScoringStatusResponse>(
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
                        caught instanceof Error
                            ? caught.message
                            : "Failed to load session workspace.",
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
    }, [selectedSessionId, shouldRefreshSelectedSession]);

    useEffect(() => {
        setOverrideDraft(
            workspace.proposal
                ? createManualOverrideDraft(workspace.proposal)
                : null,
        );
    }, [workspace.proposal]);

    useEffect(() => {
        if (
            workspace.scoringStatus?.scoringStatus !== "complete" ||
            !selectedSessionId
        ) {
            return;
        }

        closeCompletedSession(
            selectedSessionId,
            sessions,
            onSessionsChange,
            setSelectedSessionId,
        );
    }, [
        onSessionsChange,
        selectedSessionId,
        sessions,
        workspace.scoringStatus,
    ]);

    useEffect(() => {
        const pairingStatus =
            workspace.context?.session.pairingStatus?.toUpperCase();
        const publicationStatus =
            workspace.context?.session.publicationStatus?.toUpperCase();

        if (step !== "review" || !selectedSessionId || !workspace.context) {
            return;
        }

        if (workspace.proposal || publicationStatus === "PUBLISHED") {
            return;
        }

        if (pairingStatus !== "READY" && pairingStatus != "GENERATED") {
            return;
        }

        if (
            busyAction !== null ||
            autoGeneratingSessionId === selectedSessionId
        ) {
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
            setAutoGeneratingSessionId((current) =>
                current === selectedSessionId ? null : current,
            );
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

    const selectedSession =
        sessions.find((session) => session.id === selectedSessionId) ?? null;
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

    const presentSpeakers = useMemo(
        () =>
            participants.filter(
                (participant) =>
                    attendanceDraft[participant.id]?.isPresent &&
                    attendanceDraft[participant.id]?.sessionRole === "speaker",
            ),
        [attendanceDraft, participants],
    );

    const stepAvailability = computeStepAvailability(
        workspace.context,
        workspace.proposal,
        workspace.publishedPairing,
    );

    const canCancelSession =
        Boolean(selectedSessionId) &&
        (workspace.context?.session.publicationStatus?.toUpperCase() ??
            "DRAFT") !== "PUBLISHED";

    const isInRole = (id: string, role: "speaker" | "adjudicator") => {
        const draft = attendanceDraft[id];
        return Boolean(draft?.isPresent && draft.sessionRole === role);
    };
    const assignedSpeakers = participants.filter((p) =>
        isInRole(p.id, "speaker"),
    );
    const assignedAdjudicators = participants.filter((p) =>
        isInRole(p.id, "adjudicator"),
    );
    const addToRole = (id: string, role: "speaker" | "adjudicator") => {
        setAttendanceDraft((current) => ({
            ...current,
            [id]: {isPresent: true, sessionRole: role},
        }));
    };
    const removeFromRole = (id: string) => {
        setAttendanceDraft((current) => ({
            ...current,
            [id]: {
                isPresent: false,
                sessionRole: current[id]?.sessionRole ?? "speaker",
            },
        }));
    };

    if (loading) {
        return (
            <EmptyState
                title="Loading workspace"
                body="Fetching live session and roster data."
            />
        );
    }

    if (error) {
        return <EmptyState title="Workspace unavailable" body={error} />;
    }

    if (!selectedSessionId) {
        const hasCompletedSessions = sessions.some(
            (session) => session.state === "Scored",
        );
        const eyebrow = hasCompletedSessions
            ? "Session closed"
            : "Fresh workspace";
        const headline = hasCompletedSessions
            ? "Ready for the next round"
            : "Kick off a session";
        const body = hasCompletedSessions
            ? "The last session is fully scored and archived. Spin up a new session to draft attendance, generate pairings, and publish rooms."
            : "Create a new session to open the pairing workflow â€” mark attendance, generate the proposal, and publish rooms.";

        const steps = [
            {n: "1", label: "Mark attendance"},
            {n: "2", label: "Generate pairing"},
            {n: "3", label: "Publish rooms"},
            {n: "4", label: "Score & close"},
        ];

        return (
            <Card className="overflow-hidden border-indigo-200 dark:border-indigo-400/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(15,23,42,0.04))]">
                <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-slate-900/10 bg-slate-950 p-5 sm:p-6 text-white shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                                {hasCompletedSessions ? "âœ…" : "âœ¨"}
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] uppercase tracking-[0.22em] text-indigo-300">
                                    {eyebrow}
                                </div>
                                <div className="mt-1 text-2xl sm:text-3xl font-semibold leading-tight">
                                    {headline}
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-300">
                            {body}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
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
                                {busyAction
                                    ? "Creatingâ€¦"
                                    : "Create new session"}
                            </PrimaryButton>
                            <span className="text-xs text-slate-400">
                                Takes ~2 seconds
                            </span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-indigo-200 dark:border-indigo-400/25 bg-white/70 p-5 backdrop-blur dark:bg-white/[0.04]">
                        <div className="text-xs uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">
                            Workflow
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                            Four steps to close a session
                        </div>
                        <ol className="mt-4 space-y-3">
                            {steps.map((step) => (
                                <li
                                    key={step.n}
                                    className="flex items-center gap-3"
                                >
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">
                                        {step.n}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {step.label}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="pb-10">
            <SectionHeader
                title="Session Workspace"
                subtitle={
                    selectedSession ? selectedSession.date : "Session workspace"
                }
                right={
                    <StateBadge
                        state={deriveUiState(workspace, selectedSession?.state)}
                    />
                }
            />

            <Card className="mb-6 p-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <Field label="Session">
                        <select
                            value={selectedSessionId}
                            onChange={(event) =>
                                setSelectedSessionId(event.target.value)
                            }
                            className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                        >
                            {sessions.map((session) => (
                                <option key={session.id} value={session.id}>
                                    {session.date} Â· {session.motionType}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Chair default:{" "}
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                            {userName}
                        </span>
                    </div>
                </div>
            </Card>

            <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
                {STEPS.map((entry, index) => {
                    const enabled = stepAvailability[entry.key];
                    const isLastOdd =
                        index === STEPS.length - 1 && STEPS.length % 2 === 1;
                    return (
                        <button
                            key={entry.key}
                            type="button"
                            onClick={() => enabled && setStep(entry.key)}
                            disabled={!enabled}
                            className={`rounded-xl border px-3 py-2.5 text-left text-sm md:px-4 md:py-3 ${
                                isLastOdd ? "col-span-2 md:col-span-1" : ""
                            } ${
                                step === entry.key
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-400/10 text-indigo-900 dark:text-indigo-200"
                                    : enabled
                                      ? "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.06] text-slate-600 dark:text-slate-400"
                                      : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500"
                            }`}
                        >
                            <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 md:text-[11px]">
                                Step {index + 1}
                            </div>
                            <div className="mt-0.5 truncate text-sm font-semibold md:mt-1">
                                {entry.label}
                            </div>
                        </button>
                    );
                })}
            </div>

            {busyAction && (
                <div className="mb-4 rounded-xl border border-indigo-200 dark:border-indigo-400/25 bg-indigo-50 dark:bg-indigo-400/10 px-4 py-3 text-sm text-indigo-900 dark:text-indigo-200">
                    {busyAction}â€¦
                </div>
            )}
            {feedback && (
                <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-400/25 bg-emerald-50 dark:bg-emerald-400/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
                    {feedback}
                </div>
            )}

            {step === "prepare" && (
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="p-4 lg:col-span-2">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold">
                            <Users size={16} /> Attendance and roles
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <RoleColumn
                                title="Speakers"
                                icon={<Mic size={16} />}
                                accent="indigo"
                                assigned={assignedSpeakers}
                                onAdd={() => setRolePicker("speaker")}
                                onRemove={removeFromRole}
                            />
                            <RoleColumn
                                title="Adjudicators"
                                icon={<Gavel size={16} />}
                                accent="blue"
                                assigned={assignedAdjudicators}
                                onAdd={() => setRolePicker("adjudicator")}
                                onRemove={removeFromRole}
                            />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <h3 className="mb-3 flex items-center gap-2 font-semibold">
                            <ListChecks size={16} /> Feasibility
                        </h3>
                        <div className="space-y-2 text-sm">
                            <MetricRow
                                label="Speakers"
                                value={counts.speakers}
                            />
                            <MetricRow
                                label="Adjudicators"
                                value={counts.adjudicators}
                            />
                            <MetricRow
                                label="Rooms possible"
                                value={counts.rooms}
                            />
                            <MetricRow
                                label="Leftover speakers"
                                value={counts.leftover}
                            />
                            <MetricRow
                                label="Adjudicator coverage"
                                value={
                                    counts.adjudicatorCoverage
                                        ? "OK"
                                        : "Needs more adjudicators"
                                }
                            />
                        </div>
                    </Card>
                </div>
            )}

            {wsMounted && rolePicker
                ? createPortal(
                      <RolePickerModal
                          role={rolePicker}
                          participants={participants}
                          filter={pickerFilter}
                          onFilter={setPickerFilter}
                          isInRole={isInRole}
                          onToggle={(id) =>
                              isInRole(id, rolePicker)
                                  ? removeFromRole(id)
                                  : addToRole(id, rolePicker)
                          }
                          onClose={() => setRolePicker(null)}
                      />,
                      document.body,
                  )
                : null}

            {step === "setup" && (
                <div className="space-y-6">
                    <Card className="p-5">
                        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                            <div>
                                <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                                    <ClipboardList size={16} /> Session-only
                                    inputs
                                </h3>
                                <p className="mb-5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    These are the admin-controlled setup inputs
                                    used before the engine generates a proposal.
                                    They apply to this session only and feed the
                                    pairing run directly.
                                </p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field
                                        label="Motion type"
                                        hint="Use the debate category that should drive motion-type-aware pairing signals."
                                    >
                                        <input
                                            value={motionType}
                                            onChange={(event) =>
                                                setMotionType(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="IR / Policy / Moral / Finance / ..."
                                            className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                                        />
                                    </Field>
                                    <Field
                                        label="Pairing objective"
                                        hint="This changes how the generator prioritizes development, balance, or competitive strength."
                                    >
                                        <select
                                            value={objective}
                                            onChange={(event) =>
                                                setObjective(event.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                                        >
                                            <option value="DEVELOPMENT">
                                                Development
                                            </option>
                                            <option value="BALANCED">
                                                Balanced
                                            </option>
                                            <option value="COMPETITIVE">
                                                Competitive
                                            </option>
                                        </select>
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field
                                            label="Motion text"
                                            hint="This is the exact motion shown later in review, publication, and member-visible pairing views."
                                        >
                                            <textarea
                                                value={motionText}
                                                onChange={(event) =>
                                                    setMotionText(
                                                        event.target.value,
                                                    )
                                                }
                                                rows={5}
                                                placeholder="Enter the session motion."
                                                className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        Current generation profile
                                    </div>
                                    <div className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {objective === "DEVELOPMENT"
                                            ? "Development-focused"
                                            : objective === "COMPETITIVE"
                                              ? "Competitive-focused"
                                              : "Balanced pairing"}
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {objective === "DEVELOPMENT"
                                            ? "Use this when you want the engine to prioritize learning spread, role rotation, and developmental exposure."
                                            : objective === "COMPETITIVE"
                                              ? "Use this when the session should prioritize stronger competitive room quality and tougher assignment alignment."
                                              : "Use this when you want the engine to balance fairness, quality, and reasonable competitive spread."}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        Setup checklist
                                    </div>
                                    <div className="mt-3 space-y-3 text-sm">
                                        <SetupChecklistRow
                                            label="Attendance already marked"
                                            value={
                                                counts.speakers +
                                                    counts.adjudicators >
                                                0
                                                    ? "Ready"
                                                    : "Pending"
                                            }
                                        />
                                        <SetupChecklistRow
                                            label="Motion type"
                                            value={
                                                motionType.trim()
                                                    ? motionType.trim()
                                                    : "Missing"
                                            }
                                        />
                                        <SetupChecklistRow
                                            label="Motion text"
                                            value={
                                                motionText.trim()
                                                    ? "Added"
                                                    : "Missing"
                                            }
                                        />
                                        <SetupChecklistRow
                                            label="Objective"
                                            value={objective}
                                        />
                                        <SetupChecklistRow
                                            label="Time constraints"
                                            value={
                                                timeConstraints.length > 0
                                                    ? String(
                                                          timeConstraints.length,
                                                      ) + " added"
                                                    : "None"
                                            }
                                        />
                                        <SetupChecklistRow
                                            label="Event team-up preferences"
                                            value={
                                                eventTeamUpPreferences.length >
                                                0
                                                    ? String(
                                                          eventTeamUpPreferences.length,
                                                      ) + " added"
                                                    : "None"
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <Card className="p-5">
                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Time constraints
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Use this when a speaker needs an early speaking
                                slot because of a hard leave time or similar
                                session-day constraint.
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                <select
                                    value={selectedTimeConstraintId}
                                    onChange={(event) =>
                                        setSelectedTimeConstraintId(
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                                >
                                    <option value="">
                                        Select a present speaker
                                    </option>
                                    {presentSpeakers
                                        .filter(
                                            (participant) =>
                                                !timeConstraints.some(
                                                    (constraint) =>
                                                        constraint.participantId ===
                                                        participant.id,
                                                ),
                                        )
                                        .map((participant) => (
                                            <option
                                                key={participant.id}
                                                value={participant.id}
                                            >
                                                {participant.name}
                                            </option>
                                        ))}
                                </select>
                                <SecondaryButton
                                    type="button"
                                    disabled={!selectedTimeConstraintId}
                                    onClick={() => {
                                        if (!selectedTimeConstraintId) return;
                                        setTimeConstraints((current) => [
                                            ...current,
                                            {
                                                participantId:
                                                    selectedTimeConstraintId,
                                                isStrict: false,
                                            },
                                        ]);
                                        setSelectedTimeConstraintId("");
                                    }}
                                >
                                    Add
                                </SecondaryButton>
                            </div>
                            <div className="mt-4 space-y-3">
                                {timeConstraints.length === 0 ? (
                                    <EmptyState
                                        title="No time constraints yet"
                                        body="Add only the speakers who truly need an early slot."
                                    />
                                ) : (
                                    timeConstraints.map((constraint) => (
                                        <div
                                            key={constraint.participantId}
                                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10"
                                        >
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {findParticipantName(
                                                        participants,
                                                        constraint.participantId,
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    Prefer PM or LO placement
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            constraint.isStrict
                                                        }
                                                        onChange={(event) =>
                                                            setTimeConstraints(
                                                                (current) =>
                                                                    current.map(
                                                                        (
                                                                            entry,
                                                                        ) =>
                                                                            entry.participantId ===
                                                                            constraint.participantId
                                                                                ? {
                                                                                      ...entry,
                                                                                      isStrict:
                                                                                          event
                                                                                              .target
                                                                                              .checked,
                                                                                  }
                                                                                : entry,
                                                                    ),
                                                            )
                                                        }
                                                    />
                                                    Strict
                                                </label>
                                                <SecondaryButton
                                                    type="button"
                                                    onClick={() =>
                                                        setTimeConstraints(
                                                            (current) =>
                                                                current.filter(
                                                                    (entry) =>
                                                                        entry.participantId !==
                                                                        constraint.participantId,
                                                                ),
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </SecondaryButton>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        <Card className="p-5">
                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Event team-up preferences
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Use this when two speakers should stay together
                                for tournament prep or focused practice, even if
                                the engine needs to flex their exact speaker
                                positions.
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                <select
                                    value={teamUpFirstParticipantId}
                                    onChange={(event) =>
                                        setTeamUpFirstParticipantId(
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                                >
                                    <option value="">First speaker</option>
                                    {presentSpeakers.map((participant) => (
                                        <option
                                            key={participant.id}
                                            value={participant.id}
                                        >
                                            {participant.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={teamUpSecondParticipantId}
                                    onChange={(event) =>
                                        setTeamUpSecondParticipantId(
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                                >
                                    <option value="">Second speaker</option>
                                    {presentSpeakers
                                        .filter(
                                            (participant) =>
                                                participant.id !==
                                                teamUpFirstParticipantId,
                                        )
                                        .map((participant) => (
                                            <option
                                                key={participant.id}
                                                value={participant.id}
                                            >
                                                {participant.name}
                                            </option>
                                        ))}
                                </select>
                                <SecondaryButton
                                    type="button"
                                    disabled={
                                        !teamUpFirstParticipantId ||
                                        !teamUpSecondParticipantId ||
                                        hasTeamUpPreference(
                                            eventTeamUpPreferences,
                                            teamUpFirstParticipantId,
                                            teamUpSecondParticipantId,
                                        )
                                    }
                                    onClick={() => {
                                        if (
                                            !teamUpFirstParticipantId ||
                                            !teamUpSecondParticipantId
                                        )
                                            return;
                                        setEventTeamUpPreferences((current) => [
                                            ...current,
                                            {
                                                firstParticipantId:
                                                    teamUpFirstParticipantId,
                                                secondParticipantId:
                                                    teamUpSecondParticipantId,
                                                isStrict: nextTeamUpIsStrict,
                                            },
                                        ]);
                                        setTeamUpFirstParticipantId("");
                                        setTeamUpSecondParticipantId("");
                                        setNextTeamUpIsStrict(false);
                                    }}
                                >
                                    Add
                                </SecondaryButton>
                            </div>
                            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={nextTeamUpIsStrict}
                                    onChange={(event) =>
                                        setNextTeamUpIsStrict(
                                            event.target.checked,
                                        )
                                    }
                                />
                                Mark next team-up as strict
                            </label>
                            <div className="mt-4 space-y-3">
                                {eventTeamUpPreferences.length === 0 ? (
                                    <EmptyState
                                        title="No team-up preferences yet"
                                        body="Add only the pairs that should stay together for this session."
                                    />
                                ) : (
                                    eventTeamUpPreferences.map(
                                        (preference, index) => (
                                            <div
                                                key={
                                                    preference.firstParticipantId +
                                                    "-" +
                                                    preference.secondParticipantId +
                                                    "-" +
                                                    index
                                                }
                                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10"
                                            >
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                        {findParticipantName(
                                                            participants,
                                                            preference.firstParticipantId,
                                                        )}{" "}
                                                        +{" "}
                                                        {findParticipantName(
                                                            participants,
                                                            preference.secondParticipantId,
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                                        Tournament-prep team
                                                        preference
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                preference.isStrict
                                                            }
                                                            onChange={(event) =>
                                                                setEventTeamUpPreferences(
                                                                    (current) =>
                                                                        current.map(
                                                                            (
                                                                                entry,
                                                                                entryIndex,
                                                                            ) =>
                                                                                entryIndex ===
                                                                                index
                                                                                    ? {
                                                                                          ...entry,
                                                                                          isStrict:
                                                                                              event
                                                                                                  .target
                                                                                                  .checked,
                                                                                      }
                                                                                    : entry,
                                                                        ),
                                                                )
                                                            }
                                                        />
                                                        Strict
                                                    </label>
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() =>
                                                            setEventTeamUpPreferences(
                                                                (current) =>
                                                                    current.filter(
                                                                        (
                                                                            _,
                                                                            entryIndex,
                                                                        ) =>
                                                                            entryIndex !==
                                                                            index,
                                                                    ),
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </SecondaryButton>
                                                </div>
                                            </div>
                                        ),
                                    )
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
            {step === "review" && (
                <Card className="p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                        <Wand2 size={16} /> Generate & Review
                    </h3>
                    {workspace.proposal ? (
                        <>
                            <ProposalView
                                proposal={workspace.proposal}
                                participants={participants}
                            />
                            <OverridePanel
                                open={overrideOpen}
                                onToggle={() =>
                                    setOverrideOpen((current) => !current)
                                }
                                proposal={workspace.proposal}
                                participants={participants}
                                presentParticipantIds={
                                    workspace.context?.attendance
                                        .filter((entry) => entry.isPresent)
                                        .map((entry) => entry.participantId) ??
                                    []
                                }
                                draft={overrideDraft}
                                onDraftChange={setOverrideDraft}
                                overrideNotes={overrideNotes}
                                onOverrideNotesChange={setOverrideNotes}
                                disabled={busyAction !== null}
                                onSubmit={() => {
                                    const proposalId =
                                        workspace.proposal?.summary.proposalId;
                                    if (!proposalId || !overrideDraft)
                                        return Promise.resolve();
                                    return submitProposalOverride(
                                        proposalId,
                                        selectedSessionId,
                                        buildManualOverridePayload(
                                            overrideDraft,
                                        ),
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
                        <PublishedView
                            publishedPairing={workspace.publishedPairing}
                            participants={participants}
                        />
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
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Scoring status:{" "}
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {workspace.scoringStatus.scoringStatus}
                                </span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {workspace.scoringStatus.tasks.map((task) => (
                                    <div
                                        key={task.participantId}
                                        className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 text-sm"
                                    >
                                        <div className="font-medium text-slate-900 dark:text-slate-100">
                                            {findParticipantName(
                                                participants,
                                                task.participantId,
                                            )}
                                        </div>
                                        <div className="mt-1 text-slate-600 dark:text-slate-400">
                                            Role: {task.sessionRole} Â·{" "}
                                            {task.hasSubmitted
                                                ? "Submitted"
                                                : "Pending"}
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

            <div className="sticky bottom-4 z-10 mt-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 px-4 py-4 shadow-lg backdrop-blur-xl dark:bg-slate-900/85">
                <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                    Step navigation
                    {busyAction === null &&
                    !canAdvance(step, stepAvailability) &&
                    step !== "post"
                        ? " - complete the current step action to unlock the next stage."
                        : " - use Previous or Next to move through the workflow."}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10 pt-4">
                    <div className="flex flex-wrap gap-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => setStep(previousStep(step))}
                            disabled={
                                STEP_INDEX[step] === 0 || busyAction !== null
                            }
                        >
                            <ArrowLeft size={16} />
                            Previous
                        </SecondaryButton>
                        {canCancelSession && (
                            <SecondaryButton
                                type="button"
                                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-400/25 dark:text-red-300 dark:hover:bg-red-400/10"
                                disabled={busyAction !== null}
                                onClick={() =>
                                    void cancelCurrentSession(
                                        selectedSessionId,
                                        sessions,
                                        onSessionsChange,
                                        setSelectedSessionId,
                                        setWorkspace,
                                        setFeedback,
                                        setActionError,
                                        setBusyAction,
                                    )
                                }
                            >
                                <X size={16} />
                                Cancel session
                            </SecondaryButton>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {step === "review" && workspace.proposal && (
                            <SecondaryButton
                                type="button"
                                disabled={busyAction !== null}
                                onClick={() => {
                                    const proposalId =
                                        workspace.proposal?.summary.proposalId;
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
                                disabled={
                                    busyAction !== null || !workspace.proposal
                                }
                                onClick={() =>
                                    void publishCurrentProposal(
                                        selectedSessionId,
                                        setWorkspace,
                                        setFeedback,
                                        setActionError,
                                        setBusyAction,
                                        setStep,
                                        sessions,
                                        onSessionsChange,
                                    )
                                }
                            >
                                Publish official pairing
                            </PrimaryButton>
                        )}
                        {step === "post" &&
                            workspace.context?.session.publicationStatus.toUpperCase() ===
                                "PUBLISHED" && (
                                <SecondaryButton
                                    type="button"
                                    disabled={busyAction !== null}
                                    onClick={() =>
                                        void refreshScoringStatus(
                                            selectedSessionId,
                                            setWorkspace,
                                            setFeedback,
                                            setActionError,
                                            setBusyAction,
                                        )
                                    }
                                >
                                    Refresh scoring
                                </SecondaryButton>
                            )}

                        <PrimaryButton
                            type="button"
                            disabled={
                                !canAdvance(step, stepAvailability) ||
                                busyAction !== null
                            }
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
                                        setTimeConstraints,
                                        setEventTeamUpPreferences,
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
                                        timeConstraints,
                                        eventTeamUpPreferences,
                                        setWorkspace,
                                        setFeedback,
                                        setActionError,
                                        setBusyAction,
                                        setStep,
                                    );
                                    return;
                                }
                                if (step === "review") {
                                    const proposalId =
                                        workspace.proposal?.summary.proposalId;
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
            body: JSON.stringify({chair: userName}),
        });

        const nextSession: SessionRow = {
            id: created.sessionId,
            date: new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }).format(new Date()),
            motionType: created.motionType,
            chair: userName,
            state: "Preparation",
            attendance: [],
        };

        onSessionsChange([nextSession, ...sessions]);
        setSelectedSessionId(created.sessionId);
        setFeedback("New session created. Continue with attendance and setup.");
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Session creation failed.",
        );
    } finally {
        setBusyAction(null);
    }
}

async function cancelCurrentSession(
    sessionId: string,
    sessions: SessionRow[],
    onSessionsChange: (sessions: SessionRow[]) => void,
    setSelectedSessionId: React.Dispatch<React.SetStateAction<string>>,
    setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceSessionData>>,
    setFeedback: React.Dispatch<React.SetStateAction<string | null>>,
    setActionError: React.Dispatch<React.SetStateAction<string | null>>,
    setBusyAction: React.Dispatch<React.SetStateAction<string | null>>,
) {
    if (
        !window.confirm(
            "Cancel this session? This will remove the draft session and undo attendance, roles, proposals, and any other in-progress session data.",
        )
    ) {
        return;
    }

    setBusyAction("Cancelling session");
    setActionError(null);
    setFeedback(null);

    try {
        await fetchJson<{sessionId: string; cancelled: boolean}>(
            "/api/sessions/" + sessionId,
            {method: "DELETE"},
        );

        setWorkspace({
            context: null,
            proposal: null,
            publishedPairing: null,
            scoringStatus: null,
        });
        removeCancelledSession(
            sessionId,
            sessions,
            onSessionsChange,
            setSelectedSessionId,
        );
        setFeedback("Session cancelled. You can start a new session now.");
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Session cancel failed.",
        );
    } finally {
        setBusyAction(null);
    }
}
function findDefaultSessionId(sessions: SessionRow[]) {
    return sessions.find((session) => session.state !== "Scored")?.id ?? "";
}

function closeCompletedSession(
    completedSessionId: string,
    sessions: SessionRow[],
    onSessionsChange: (sessions: SessionRow[]) => void,
    setSelectedSessionId: React.Dispatch<React.SetStateAction<string>>,
) {
    const nextSessions = sessions.map((session) =>
        session.id === completedSessionId
            ? {...session, state: "Scored" as const}
            : session,
    );
    const nextActiveSessionId =
        nextSessions.find(
            (session) =>
                session.id !== completedSessionId && session.state !== "Scored",
        )?.id ?? "";

    onSessionsChange(nextSessions);
    setSelectedSessionId(nextActiveSessionId);
}

function removeCancelledSession(
    cancelledSessionId: string,
    sessions: SessionRow[],
    onSessionsChange: (sessions: SessionRow[]) => void,
    setSelectedSessionId: React.Dispatch<React.SetStateAction<string>>,
) {
    const nextSessions = sessions.filter(
        (session) => session.id !== cancelledSessionId,
    );
    const nextActiveSessionId =
        nextSessions.find((session) => session.state !== "Scored")?.id ?? "";

    onSessionsChange(nextSessions);
    setSelectedSessionId(nextActiveSessionId);
}
function hydrateFormState(
    context: SessionPreparationContextResponse,
    participants: Participant[],
    setAttendanceDraft: React.Dispatch<React.SetStateAction<AttendanceDraft>>,
    setMotionType: React.Dispatch<React.SetStateAction<string>>,
    setMotionText: React.Dispatch<React.SetStateAction<string>>,
    setObjective: React.Dispatch<React.SetStateAction<string>>,
    setTimeConstraints: React.Dispatch<
        React.SetStateAction<TimeConstraintDraft[]>
    >,
    setEventTeamUpPreferences: React.Dispatch<
        React.SetStateAction<EventTeamUpPreferenceDraft[]>
    >,
) {
    const roleMap = new Map(
        context.sessionRoles.map((assignment) => [
            assignment.participantId,
            assignment.role,
        ]),
    );
    const attendanceMap = new Map(
        context.attendance.map((record) => [
            record.participantId,
            record.isPresent,
        ]),
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
    setTimeConstraints(context.session.sessionRules.timeConstraints ?? []);
    setEventTeamUpPreferences(
        context.session.sessionRules.eventTeamUpPreferences ?? [],
    );
}

function hasTeamUpPreference(
    preferences: EventTeamUpPreferenceDraft[],
    firstParticipantId: string,
    secondParticipantId: string,
) {
    return preferences.some(
        (entry) =>
            (entry.firstParticipantId === firstParticipantId &&
                entry.secondParticipantId === secondParticipantId) ||
            (entry.firstParticipantId === secondParticipantId &&
                entry.secondParticipantId === firstParticipantId),
    );
}

function deriveStepFromContext(
    context: SessionPreparationContextResponse,
): StepKey {
    const pairingStatus = context.session.pairingStatus.toUpperCase();
    const publicationStatus = context.session.publicationStatus.toUpperCase();

    if (
        context.session.publishedProposalId ||
        publicationStatus === "PUBLISHED"
    )
        return "post";
    if (context.session.acceptedProposalId || pairingStatus === "APPROVED")
        return "publish";
    if (pairingStatus === "GENERATED") return "review";
    if (pairingStatus === "READY") return "review";
    if (pairingStatus === "PREPARATION") return "setup";
    return "prepare";
}

function deriveStepFromWorkspace(
    workspace: WorkspaceSessionData,
    context: SessionPreparationContextResponse,
): StepKey {
    if (
        workspace.publishedPairing ||
        workspace.scoringStatus ||
        context.session.publishedProposalId
    ) {
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
        review:
            pairingStatus === "READY" ||
            pairingStatus === "GENERATED" ||
            pairingStatus === "APPROVED" ||
            publicationStatus === "PUBLISHED",
        publish:
            Boolean(proposal) ||
            pairingStatus === "APPROVED" ||
            publicationStatus === "PUBLISHED",
        post: Boolean(publishedPairing) || publicationStatus === "PUBLISHED",
    } satisfies Record<StepKey, boolean>;
}

function deriveUiState(
    workspace: WorkspaceSessionData,
    fallback: LifecycleState | undefined,
): LifecycleState {
    const scoringStatus = workspace.scoringStatus?.scoringStatus;
    const pairingStatus =
        workspace.context?.session.pairingStatus.toUpperCase();
    const publicationStatus =
        workspace.context?.session.publicationStatus.toUpperCase();

    if (scoringStatus === "complete") return "Scored";
    if (workspace.publishedPairing || publicationStatus === "PUBLISHED")
        return "Published";
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
    setTimeConstraints: React.Dispatch<
        React.SetStateAction<TimeConstraintDraft[]>
    >,
    setEventTeamUpPreferences: React.Dispatch<
        React.SetStateAction<EventTeamUpPreferenceDraft[]>
    >,
    setStep: React.Dispatch<React.SetStateAction<StepKey>>,
    advanceToSetup = true,
) {
    setBusyAction("Saving attendance");
    setActionError(null);
    setFeedback(null);
    try {
        const entries = Object.entries(attendanceDraft).map(
            ([participantId, value]) => ({
                participantId,
                isPresent: value.isPresent,
                sessionRole: value.sessionRole,
            }),
        );

        const context = await fetchJson<SessionPreparationContextResponse>(
            "/api/attendance/mark",
            {
                method: "POST",
                body: JSON.stringify({sessionId, entries}),
            },
        );

        setWorkspace((current) => ({...current, context}));
        hydrateFormState(
            context,
            participants,
            setAttendanceDraft,
            setMotionType,
            setMotionText,
            setObjective,
            setTimeConstraints,
            setEventTeamUpPreferences,
        );
        setFeedback(
            advanceToSetup
                ? "Attendance and session roles saved."
                : "Attendance updated.",
        );
        if (advanceToSetup) {
            setStep("setup");
        }
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Attendance save failed.",
        );
    } finally {
        setBusyAction(null);
    }
}

async function saveSetup(
    sessionId: string,
    motionType: string,
    motionText: string,
    objective: string,
    timeConstraints: TimeConstraintDraft[],
    eventTeamUpPreferences: EventTeamUpPreferenceDraft[],
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
                sessionRules: {
                    timeConstraints,
                    eventTeamUpPreferences,
                },
            }),
        });

        const context = await fetchJson<SessionPreparationContextResponse>(
            `/api/sessions/${sessionId}`,
        );
        setWorkspace((current) => ({...current, context}));
        setFeedback("Session setup saved.");
        setStep("review");
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Session setup save failed.",
        );
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
        const generated = await fetchJson<{proposal: PairingProposalView}>(
            "/api/pairing/generate",
            {
                method: "POST",
                body: JSON.stringify({sessionId}),
            },
        );
        const context = await fetchJson<SessionPreparationContextResponse>(
            `/api/sessions/${sessionId}`,
        );
        setWorkspace((current) => ({
            ...current,
            context,
            proposal: generated.proposal,
        }));
        setFeedback("Proposal generated. Review it below.");
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Proposal generation failed.",
        );
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
        const context = await fetchJson<SessionPreparationContextResponse>(
            `/api/sessions/${sessionId}`,
        );
        const proposal = await fetchJson<PairingProposalView>(
            `/api/pairing/proposal/${proposalId}`,
        );
        setWorkspace((current) => ({...current, context, proposal}));
        setFeedback("Proposal approved.");
        setStep("publish");
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Proposal approval failed.",
        );
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
        const regenerated = await fetchJson<{proposal: PairingProposalView}>(
            `/api/pairing/proposal/${proposalId}/regenerate`,
            {method: "POST"},
        );
        setWorkspace((current) => ({
            ...current,
            proposal: regenerated.proposal,
        }));
        setFeedback("Fresh proposal generated.");
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Proposal regeneration failed.",
        );
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
        const result = await fetchJson<{proposal: PairingProposalView}>(
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

        const context = await fetchJson<SessionPreparationContextResponse>(
            `/api/sessions/${sessionId}`,
        );
        setWorkspace((current) => ({
            ...current,
            context,
            proposal: result.proposal,
        }));
        setFeedback("Override submitted and proposal updated.");
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Proposal override failed.",
        );
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
    sessions: SessionRow[],
    onSessionsChange: (sessions: SessionRow[]) => void,
) {
    setBusyAction("Publishing pairing");
    setActionError(null);
    setFeedback(null);
    try {
        const publishedPairing = (
            await fetchJson<{
                publishedPairing: NonNullable<
                    WorkspaceSessionData["publishedPairing"]
                >;
            }>(`/api/pairing/publish/${sessionId}`, {
                method: "POST",
            })
        ).publishedPairing;
        const context = await fetchJson<SessionPreparationContextResponse>(
            `/api/sessions/${sessionId}`,
        );
        const scoringStatus = await fetchJson<SessionScoringStatusResponse>(
            `/api/sessions/${sessionId}/scoring-status`,
        );
        setWorkspace((current) => ({
            ...current,
            context,
            publishedPairing,
            scoringStatus,
        }));
        // Mark the session as Published in the shared sessions list so downstream
        // views (My Scoring Tasks, Home, etc.) can pick it up without a page reload.
        onSessionsChange(
            sessions.map((session) =>
                session.id === sessionId
                    ? {...session, state: "Published" as const}
                    : session,
            ),
        );
        setFeedback("Official pairing published.");
        setStep("post");
    } catch (caught) {
        setActionError(
            caught instanceof Error ? caught.message : "Publish failed.",
        );
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
        setWorkspace((current) => ({...current, scoringStatus}));
        setFeedback("Scoring status refreshed.");
    } catch (caught) {
        setActionError(
            caught instanceof Error
                ? caught.message
                : "Scoring refresh failed.",
        );
    } finally {
        setBusyAction(null);
    }
}

function canAdvance(step: StepKey, availability: Record<StepKey, boolean>) {
    if (step === "post") return false;
    if (step === "setup") return true;
    return availability[nextStep(step)];
}

function previousStep(step: StepKey): StepKey {
    return STEPS[Math.max(STEP_INDEX[step] - 1, 0)].key;
}

function nextStep(step: StepKey): StepKey {
    return STEPS[Math.min(STEP_INDEX[step] + 1, STEPS.length - 1)].key;
}

function SetupChecklistRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    const isMissing = value === "Missing" || value === "Pending";
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span
                className={`font-medium ${
                    isMissing
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-slate-900 dark:text-slate-100"
                }`}
            >
                {value}
            </span>
        </div>
    );
}

function MetricRow({label, value}: {label: string; value: React.ReactNode}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
                {value}
            </span>
        </div>
    );
}

function RoleColumn({
    title,
    icon,
    accent,
    assigned,
    onAdd,
    onRemove,
}: {
    title: string;
    icon: React.ReactNode;
    accent: "indigo" | "blue";
    assigned: Participant[];
    onAdd: () => void;
    onRemove: (id: string) => void;
}) {
    const ring =
        accent === "indigo"
            ? "from-indigo-500 to-blue-600"
            : "from-blue-500 to-sky-600";
    return (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                    <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${ring} text-white`}
                    >
                        {icon}
                    </span>
                    {title}
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {assigned.length}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 active:scale-95 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300 dark:hover:bg-indigo-400/20"
                >
                    <Plus size={14} /> Add
                </button>
            </div>
            {assigned.length === 0 ? (
                <button
                    type="button"
                    onClick={onAdd}
                    className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 py-8 text-sm text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500 dark:border-white/10 dark:text-slate-500"
                >
                    <Plus size={18} />
                    Add {title.toLowerCase()}
                </button>
            ) : (
                <ul className="space-y-2">
                    {assigned.map((p) => (
                        <li
                            key={p.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]"
                        >
                            <ProfileAvatar
                                name={p.name}
                                seed={p.id}
                                className="h-8 w-8"
                                initialsClassName="text-xs"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {p.name}
                                </div>
                                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {p.account}
                                    {p.position ? ` Â· ${p.position}` : ""}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemove(p.id)}
                                aria-label={`Remove ${p.name}`}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-400/10"
                            >
                                <X size={15} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function RolePickerModal({
    role,
    participants,
    filter,
    onFilter,
    isInRole,
    onToggle,
    onClose,
}: {
    role: "speaker" | "adjudicator";
    participants: Participant[];
    filter: string;
    onFilter: (value: string) => void;
    isInRole: (id: string, role: "speaker" | "adjudicator") => boolean;
    onToggle: (id: string) => void;
    onClose: () => void;
}) {
    const label = role === "speaker" ? "Speakers" : "Adjudicators";
    const other = role === "speaker" ? "adjudicator" : "speaker";
    const filtered = participants.filter((p) =>
        p.name.toLowerCase().includes(filter.toLowerCase()),
    );
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="overlay-fade absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                onClick={onClose}
            />
            <div className="lg-panel modal-pop relative flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-900/5 px-5 py-4 dark:border-white/10">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Add {label.toLowerCase()}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Tap a member to add or remove them from{" "}
                            {label.toLowerCase()}.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-900/10 bg-white/60 text-zinc-600 transition hover:bg-white/90 active:scale-95 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="shrink-0 px-5 pt-3">
                    <div className="relative">
                        <Search
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            autoFocus
                            value={filter}
                            onChange={(event) => onFilter(event.target.value)}
                            placeholder="Search members..."
                            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm dark:border-white/15"
                        />
                    </div>
                </div>
                <div className="mt-3 flex-1 overflow-y-auto px-5 pb-5">
                    {filtered.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-400">
                            No members found.
                        </p>
                    ) : (
                        <ul className="space-y-1.5">
                            {filtered.map((p) => {
                                const selected = isInRole(p.id, role);
                                const inOther = isInRole(p.id, other);
                                return (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => onToggle(p.id)}
                                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                                                selected
                                                    ? "border-indigo-400 bg-indigo-50 dark:border-indigo-400/40 dark:bg-indigo-400/10"
                                                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.04]"
                                            }`}
                                        >
                                            <ProfileAvatar
                                                name={p.name}
                                                seed={p.id}
                                                className="h-9 w-9"
                                                initialsClassName="text-xs"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {p.name}
                                                </div>
                                                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                    {p.account}
                                                    {inOther
                                                        ? ` Â· currently ${other}`
                                                        : ""}
                                                </div>
                                            </div>
                                            <span
                                                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                                    selected
                                                        ? "border-indigo-500 bg-indigo-500 text-white"
                                                        : "border-slate-300 text-transparent dark:border-white/20"
                                                }`}
                                            >
                                                <Plus
                                                    size={14}
                                                    className={
                                                        selected
                                                            ? "rotate-45"
                                                            : ""
                                                    }
                                                />
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div className="shrink-0 border-t border-zinc-900/5 px-5 py-3 dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="lg-button w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

function ProposalView({
    proposal,
    participants,
}: {
    proposal: PairingProposalView;
    participants: Participant[];
}) {
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    Proposal v{proposal.summary.version} Â· Score{" "}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {proposal.summary.proposalScore.toFixed(2)}
                    </span>
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Status: {proposal.summary.status}
                    {proposal.summary.topBandRank != null
                        ? ` Â· Top-band rank: ${proposal.summary.topBandRank}`
                        : ""}
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {proposal.rooms.map((room) => {
                    const balance = room.roomBalanceScore?.toFixed(2);
                    const difficulty = room.roomDifficultyScore?.toFixed(2);
                    const scoreLine = [
                        balance ? `Balance ${balance}` : null,
                        difficulty ? `Difficulty ${difficulty}` : null,
                    ]
                        .filter(Boolean)
                        .join(" Â· ");
                    return (
                        <div
                            key={room.roomIndex}
                            className="rounded-xl border border-slate-200 dark:border-white/10 p-4"
                        >
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                                Room {room.roomIndex}
                            </div>
                            {scoreLine ? (
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    {scoreLine}
                                </div>
                            ) : null}
                            <div className="mt-3 space-y-2 text-sm">
                                {room.teams.map((team) => (
                                    <div key={team.bpPosition}>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                            {team.bpPosition}
                                        </span>
                                        :{" "}
                                        {team.speakers
                                            .map(
                                                (speaker) =>
                                                    `${findParticipantName(participants, speaker.participantId)} (${speaker.speakingRole})`,
                                            )
                                            .join(", ")}
                                    </div>
                                ))}
                                <div>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                        Adjudicators
                                    </span>
                                    :{" "}
                                    {room.adjudicators
                                        .map(
                                            (adjudicator) =>
                                                `${findParticipantName(participants, adjudicator.participantId)}${adjudicator.isChair ? " (Chair)" : ""}`,
                                        )
                                        .join(", ")}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {proposal.unassignedParticipants.length > 0 && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                    <div className="font-semibold">
                        Unassigned speakers:{" "}
                        {proposal.unassignedParticipants.length}
                    </div>
                    <div className="mt-2 space-y-1">
                        {proposal.unassignedParticipants.map((participant) => (
                            <div key={participant.participantId}>
                                {findParticipantName(
                                    participants,
                                    participant.participantId,
                                )}{" "}
                                - {formatLeftoverReason(participant.reason)}
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
    {bpPosition: "OG", roles: ["PM", "DPM"]},
    {bpPosition: "OO", roles: ["LO", "DLO"]},
    {bpPosition: "CG", roles: ["MG", "GW"]},
    {bpPosition: "CO", roles: ["MO", "OW"]},
] as const;

function createManualOverrideDraft(
    proposal: PairingProposalView,
): ManualOverrideDraft {
    return {
        rooms: proposal.rooms.map((room) => ({
            roomIndex: room.roomIndex,
            speakerSlots: OVERRIDE_TEAM_LAYOUT.flatMap(
                ({bpPosition, roles}) => {
                    const team = room.teams.find(
                        (entry) => entry.bpPosition === bpPosition,
                    );
                    return roles.map((role, roleIndex) => ({
                        slotKey: `${room.roomIndex}-${bpPosition}-${role}`,
                        bpPosition,
                        speakingRole: role,
                        participantId:
                            team?.speakers[roleIndex]?.participantId ?? "",
                    }));
                },
            ),
            adjudicatorSlots:
                room.adjudicators.length > 0
                    ? room.adjudicators.map((adjudicator, index) => ({
                          slotKey: `${room.roomIndex}-adj-${index}`,
                          participantId: adjudicator.participantId,
                          isChair: adjudicator.isChair,
                      }))
                    : [
                          {
                              slotKey: `${room.roomIndex}-chair-0`,
                              participantId: "",
                              isChair: true,
                          },
                      ],
        })),
    };
}

function buildManualOverridePayload(
    draft: ManualOverrideDraft,
): Record<string, unknown> {
    const assignedParticipantIds = new Set<string>();

    return {
        rooms: draft.rooms.map((room) => ({
            roomIndex: room.roomIndex,
            teams: OVERRIDE_TEAM_LAYOUT.map(({bpPosition, roles}) => ({
                bpPosition,
                speakers: roles.map((role) => {
                    const slot = room.speakerSlots.find(
                        (entry) =>
                            entry.bpPosition === bpPosition &&
                            entry.speakingRole === role,
                    );
                    if (!slot?.participantId) {
                        throw new Error(
                            `${bpPosition} ${role} must have a participant.`,
                        );
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
                    throw new Error(
                        `Room ${room.roomIndex} has an empty adjudicator slot.`,
                    );
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

function deriveManualOverrideState(
    draft: ManualOverrideDraft,
    presentParticipantIds: string[],
) {
    const assignmentCounts = new Map<string, number>();

    for (const room of draft.rooms) {
        for (const slot of room.speakerSlots) {
            if (!slot.participantId) continue;
            assignmentCounts.set(
                slot.participantId,
                (assignmentCounts.get(slot.participantId) ?? 0) + 1,
            );
        }
        for (const slot of room.adjudicatorSlots) {
            if (!slot.participantId) continue;
            assignmentCounts.set(
                slot.participantId,
                (assignmentCounts.get(slot.participantId) ?? 0) + 1,
            );
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
    onDraftChange: React.Dispatch<
        React.SetStateAction<ManualOverrideDraft | null>
    >;
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
                room.adjudicatorSlots.filter((slot) => slot.isChair).length ===
                    1,
        );

    return (
        <Card className="mt-4 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        Manual override editor
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Reassign speakers, change speaking positions, move
                        people into adjudication, and set the chair directly
                        here.
                    </p>
                </div>
                <SecondaryButton
                    type="button"
                    onClick={onToggle}
                    disabled={disabled}
                >
                    {open ? "Hide override" : "Open override"}
                </SecondaryButton>
            </div>
            {open && (
                <div className="mt-4 space-y-4">
                    {derived.duplicateParticipantIds.length > 0 && (
                        <div className="rounded-xl border border-red-200 dark:border-red-400/25 bg-red-50 dark:bg-red-400/10 px-4 py-3 text-sm text-red-900 dark:text-red-200">
                            Resolve duplicate assignments before submitting:{" "}
                            {derived.duplicateParticipantIds
                                .map((participantId) =>
                                    findParticipantName(
                                        participants,
                                        participantId,
                                    ),
                                )
                                .join(", ")}
                        </div>
                    )}
                    <div className="grid gap-4 xl:grid-cols-2">
                        {draft.rooms.map((room) => (
                            <div
                                key={room.roomIndex}
                                className="rounded-xl border border-slate-200 dark:border-white/10 p-4"
                            >
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                    Room {room.roomIndex}
                                </div>
                                <div className="mt-4 space-y-3">
                                    {OVERRIDE_TEAM_LAYOUT.map(
                                        ({bpPosition, roles}) => (
                                            <div
                                                key={`${room.roomIndex}-${bpPosition}`}
                                                className="rounded-md border border-slate-100 dark:border-white/[0.06] p-3"
                                            >
                                                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {bpPosition}
                                                </div>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    {roles.map((role) => {
                                                        const slot =
                                                            room.speakerSlots.find(
                                                                (entry) =>
                                                                    entry.bpPosition ===
                                                                        bpPosition &&
                                                                    entry.speakingRole ===
                                                                        role,
                                                            );
                                                        return (
                                                            <Field
                                                                key={
                                                                    slot?.slotKey ??
                                                                    `${room.roomIndex}-${bpPosition}-${role}`
                                                                }
                                                                label={role}
                                                            >
                                                                <select
                                                                    value={
                                                                        slot?.participantId ??
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        onDraftChange(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                current
                                                                                    ? {
                                                                                          ...current,
                                                                                          rooms: current.rooms.map(
                                                                                              (
                                                                                                  entry,
                                                                                              ) =>
                                                                                                  entry.roomIndex !==
                                                                                                  room.roomIndex
                                                                                                      ? entry
                                                                                                      : {
                                                                                                            ...entry,
                                                                                                            speakerSlots:
                                                                                                                entry.speakerSlots.map(
                                                                                                                    (
                                                                                                                        speakerSlot,
                                                                                                                    ) =>
                                                                                                                        speakerSlot.slotKey ===
                                                                                                                        slot?.slotKey
                                                                                                                            ? {
                                                                                                                                  ...speakerSlot,
                                                                                                                                  participantId:
                                                                                                                                      event
                                                                                                                                          .target
                                                                                                                                          .value,
                                                                                                                              }
                                                                                                                            : speakerSlot,
                                                                                                                ),
                                                                                                        },
                                                                                          ),
                                                                                      }
                                                                                    : current,
                                                                        )
                                                                    }
                                                                    className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                                                                >
                                                                    <option value="">
                                                                        Select
                                                                        participant
                                                                    </option>
                                                                    {options.map(
                                                                        (
                                                                            option,
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    option.id
                                                                                }
                                                                                value={
                                                                                    option.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    option.name
                                                                                }
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                            </Field>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                                <div className="mt-4 rounded-md border border-slate-100 dark:border-white/[0.06] p-3">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            Adjudicators
                                        </div>
                                        <SecondaryButton
                                            type="button"
                                            disabled={
                                                disabled ||
                                                room.adjudicatorSlots.length >=
                                                    3
                                            }
                                            onClick={() =>
                                                onDraftChange((current) =>
                                                    current
                                                        ? {
                                                              ...current,
                                                              rooms: current.rooms.map(
                                                                  (entry) =>
                                                                      entry.roomIndex !==
                                                                      room.roomIndex
                                                                          ? entry
                                                                          : {
                                                                                ...entry,
                                                                                adjudicatorSlots:
                                                                                    [
                                                                                        ...entry.adjudicatorSlots,
                                                                                        {
                                                                                            slotKey: `${room.roomIndex}-adj-${entry.adjudicatorSlots.length}`,
                                                                                            participantId:
                                                                                                "",
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
                                        {room.adjudicatorSlots.map(
                                            (slot, slotIndex) => (
                                                <div
                                                    key={slot.slotKey}
                                                    className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-end"
                                                >
                                                    <Field
                                                        label={
                                                            slot.isChair
                                                                ? "Chair"
                                                                : `Panel ${slotIndex}`
                                                        }
                                                    >
                                                        <select
                                                            value={
                                                                slot.participantId
                                                            }
                                                            onChange={(event) =>
                                                                onDraftChange(
                                                                    (
                                                                        current,
                                                                    ) =>
                                                                        current
                                                                            ? {
                                                                                  ...current,
                                                                                  rooms: current.rooms.map(
                                                                                      (
                                                                                          entry,
                                                                                      ) =>
                                                                                          entry.roomIndex !==
                                                                                          room.roomIndex
                                                                                              ? entry
                                                                                              : {
                                                                                                    ...entry,
                                                                                                    adjudicatorSlots:
                                                                                                        entry.adjudicatorSlots.map(
                                                                                                            (
                                                                                                                adjudicatorSlot,
                                                                                                            ) =>
                                                                                                                adjudicatorSlot.slotKey ===
                                                                                                                slot.slotKey
                                                                                                                    ? {
                                                                                                                          ...adjudicatorSlot,
                                                                                                                          participantId:
                                                                                                                              event
                                                                                                                                  .target
                                                                                                                                  .value,
                                                                                                                      }
                                                                                                                    : adjudicatorSlot,
                                                                                                        ),
                                                                                                },
                                                                                  ),
                                                                              }
                                                                            : current,
                                                                )
                                                            }
                                                            className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                                                        >
                                                            <option value="">
                                                                Select
                                                                participant
                                                            </option>
                                                            {options.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option.id
                                                                        }
                                                                        value={
                                                                            option.id
                                                                        }
                                                                    >
                                                                        {
                                                                            option.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </Field>
                                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                        <input
                                                            type="radio"
                                                            name={`chair-${room.roomIndex}`}
                                                            checked={
                                                                slot.isChair
                                                            }
                                                            onChange={() =>
                                                                onDraftChange(
                                                                    (
                                                                        current,
                                                                    ) =>
                                                                        current
                                                                            ? {
                                                                                  ...current,
                                                                                  rooms: current.rooms.map(
                                                                                      (
                                                                                          entry,
                                                                                      ) =>
                                                                                          entry.roomIndex !==
                                                                                          room.roomIndex
                                                                                              ? entry
                                                                                              : {
                                                                                                    ...entry,
                                                                                                    adjudicatorSlots:
                                                                                                        entry.adjudicatorSlots.map(
                                                                                                            (
                                                                                                                adjudicatorSlot,
                                                                                                            ) => ({
                                                                                                                ...adjudicatorSlot,
                                                                                                                isChair:
                                                                                                                    adjudicatorSlot.slotKey ===
                                                                                                                    slot.slotKey,
                                                                                                            }),
                                                                                                        ),
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
                                                        disabled={
                                                            disabled ||
                                                            room
                                                                .adjudicatorSlots
                                                                .length === 1
                                                        }
                                                        onClick={() =>
                                                            onDraftChange(
                                                                (current) =>
                                                                    current
                                                                        ? {
                                                                              ...current,
                                                                              rooms: current.rooms.map(
                                                                                  (
                                                                                      entry,
                                                                                  ) => {
                                                                                      if (
                                                                                          entry.roomIndex !==
                                                                                          room.roomIndex
                                                                                      ) {
                                                                                          return entry;
                                                                                      }
                                                                                      const nextSlots =
                                                                                          entry.adjudicatorSlots.filter(
                                                                                              (
                                                                                                  adjudicatorSlot,
                                                                                              ) =>
                                                                                                  adjudicatorSlot.slotKey !==
                                                                                                  slot.slotKey,
                                                                                          );
                                                                                      if (
                                                                                          nextSlots.length >
                                                                                              0 &&
                                                                                          !nextSlots.some(
                                                                                              (
                                                                                                  adjudicatorSlot,
                                                                                              ) =>
                                                                                                  adjudicatorSlot.isChair,
                                                                                          )
                                                                                      ) {
                                                                                          nextSlots[0] =
                                                                                              {
                                                                                                  ...nextSlots[0],
                                                                                                  isChair: true,
                                                                                              };
                                                                                      }
                                                                                      return {
                                                                                          ...entry,
                                                                                          adjudicatorSlots:
                                                                                              nextSlots,
                                                                                      };
                                                                                  },
                                                                              ),
                                                                          }
                                                                        : current,
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </SecondaryButton>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                        <div className="font-semibold">
                            Will stay unassigned after override:{" "}
                            {derived.unassignedParticipantIds.length}
                        </div>
                        <div className="mt-2">
                            {derived.unassignedParticipantIds.length > 0
                                ? derived.unassignedParticipantIds
                                      .map((participantId) =>
                                          findParticipantName(
                                              participants,
                                              participantId,
                                          ),
                                      )
                                      .join(", ")
                                : "Everyone present is assigned in the edited proposal."}
                        </div>
                    </div>
                    <Field label="Notes">
                        <textarea
                            value={overrideNotes}
                            onChange={(event) =>
                                onOverrideNotesChange(event.target.value)
                            }
                            rows={3}
                            className="w-full rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-sm"
                            placeholder="Why you are overriding this proposal"
                        />
                    </Field>
                    <div className="flex justify-end">
                        <PrimaryButton
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => void onSubmit()}
                        >
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
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-400/25 bg-indigo-50 dark:bg-indigo-400/10 p-4 text-sm text-indigo-900 dark:text-indigo-200">
                Official published pairing Â· {publishedPairing.motionType} Â·{" "}
                {publishedPairing.publishedAt}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {publishedPairing.rooms.map((room) => (
                    <div
                        key={room.roomIndex}
                        className="rounded-xl border border-slate-200 dark:border-white/10 p-4"
                    >
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                            Room {room.roomIndex}
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                            {room.teams.map((team) => (
                                <div key={team.bpPosition}>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {team.bpPosition}
                                    </span>
                                    :{" "}
                                    {team.speakers
                                        .map(
                                            (speaker) =>
                                                `${findParticipantName(participants, speaker.participantId)} (${speaker.speakingRole})`,
                                        )
                                        .join(", ")}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function findParticipantName(
    participants: Participant[],
    participantId: string,
) {
    return (
        participants.find((participant) => participant.id === participantId)
            ?.name ?? participantId
    );
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
        const data = (await response.json()) as {message?: string};
        if (data.message && data.message.trim()) {
            return data.message;
        }
    } catch {
        return fallback;
    }

    return fallback;
}
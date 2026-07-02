"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, ShieldCheck, User } from "lucide-react";
import { EmptyState, SectionHeader } from "./ui";
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
  const [mounted, setMounted] = useState(false);
  const [modalTab, setModalTab] = useState<"overview" | "insights" | "metrics">("overview");
  const reduce = useReducedMotion();

  useEffect(() => setMounted(true), []);

  const filteredParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.isVerified &&
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
        console.error("[pairing] progress profile", caught);
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

  useEffect(() => {
    if (!selectedParticipantId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedParticipantId(null);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedParticipantId]);

  if (loading) {
    return (
      <EmptyState
        title="Loading roster"
        body="Fetching live members, cabinet, and president records."
      />
    );
  }

  if (error) {
    if (error) console.error("[pairing]", error);
    return (
      <EmptyState
        title="Roster unavailable"
        body="Please refresh the page or try again in a moment."
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Members & Cabinet"
        subtitle="Participant roster with progress summaries."
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredParticipants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={reduce ? false : { opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: Math.min(index * 0.04, 0.4),
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={reduce ? undefined : { y: -3 }}
              className="lg-tile flex flex-col gap-5 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_16px_-6px_rgba(79,70,229,0.5)]"
                    aria-hidden
                  >
                    {getInitials(participant.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                      {participant.name}
                    </div>
                  </div>
                </div>
                <AccountBadge account={participant.account} />
              </div>
              {progressByParticipantId.has(participant.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    setModalTab("overview");
                    setSelectedParticipantId(participant.id);
                  }}
                  className="lg-button group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium active:scale-[0.98]"
                >
                  View progress
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </button>
              ) : (
                <span className="mt-auto rounded-xl border border-dashed border-zinc-300/70 px-3 py-2.5 text-center text-sm text-zinc-400 dark:border-white/10 dark:text-zinc-500">
                  No progress data yet
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {mounted && selectedParticipantId
        ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="overlay-fade absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={closeProfile}
          />
          <div className="lg-panel modal-pop relative flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl">
            <div className="relative shrink-0 border-b border-zinc-900/5 px-6 py-5 dark:border-white/10">
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {selectedParticipant ? (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_16px_-6px_rgba(79,70,229,0.5)]">
                      {getInitials(selectedParticipant.name)}
                    </span>
                  ) : null}
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {selectedParticipant ? selectedParticipant.name : "Progress snapshot"}
                    </h3>
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                      Read-only pairing progress profile
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeProfile}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-900/10 bg-white/60 text-zinc-600 transition hover:bg-white/90 active:scale-95 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.12]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {selectedProfile && !profileLoading && !profileError ? (
              <div className="flex shrink-0 gap-1 border-b border-zinc-900/5 px-4 pt-3 dark:border-white/10">
                {([
                  ["overview", "Overview"],
                  ["insights", "Insights"],
                  ["metrics", "Metrics"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setModalTab(key)}
                    className={`relative rounded-t-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                      modalTab === key
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {label}
                    {modalTab === key && (
                      <motion.span
                        layoutId="roster-modal-tab"
                        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="h-[60vh] overflow-y-auto p-5 sm:p-6">
            {profileLoading ? (
              <EmptyState
                title="Loading progress profile"
                body="Fetching the individual pairing progress profile."
              />
            ) : profileError ? (
              <EmptyState
                title="Progress profile unavailable"
                body="Please try again in a moment."
              />
            ) : selectedProfile ? (
              modalTab === "overview" ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  <SummaryStat
                    label="Attendance"
                    value={`${selectedProfile.attendance.attendancePercentage}%`}
                  />
                  <SummaryStat
                    label="Present"
                    value={selectedProfile.attendance.presentCount}
                  />
                  <SummaryStat
                    label="Tracked"
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
                    label="Spoken"
                    value={selectedProfile.summary.sessionsSpoken}
                  />
                  <SummaryStat
                    label="Adjudicated"
                    value={selectedProfile.summary.sessionsAdjudicated}
                  />
                  <SummaryStat
                    label="Chaired"
                    value={selectedProfile.summary.sessionsChaired}
                  />
                </div>
              ) : modalTab === "insights" ? (
                <div className="grid gap-4 lg:grid-cols-2">
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
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
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
              )
            ) : (
              <EmptyState
                title="No progress summary"
                body={
                  selectedProgressSummary
                    ? "The participant has summary data, but the full profile is not available yet."
                    : "This participant does not have enough progress data yet."
                }
              />
            )}
            </div>
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}

function AccountBadge({ account }: { account: string }) {
  const config =
    account === "President"
      ? {
          Icon: Crown,
          className:
            "border-zinc-900/15 bg-zinc-900/[0.06] text-zinc-800 dark:border-white/20 dark:bg-white/10 dark:text-zinc-100",
        }
      : account === "Cabinet"
        ? {
            Icon: ShieldCheck,
            className:
              "border-indigo-400/30 bg-indigo-400/10 text-indigo-700 dark:text-indigo-300",
          }
        : {
            Icon: User,
            className:
              "border-zinc-400/20 bg-zinc-400/[0.08] text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400",
          };
  const { Icon, className } = config;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon size={12} strokeWidth={2} />
      {account}
    </span>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}

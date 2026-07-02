"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, Crown, Users, X } from "lucide-react";
import { Card, EmptyState, SectionHeader, StateBadge } from "./ui";
import type { AttendanceHistoryItem, SessionRow } from "./types";

type SessionsProps = {
  mode: "admin" | "participant";
  sessions: SessionRow[];
  attendanceHistory?: AttendanceHistoryItem[];
  loading: boolean;
  error: string | null;
};

export default function Sessions({
  mode,
  sessions,
  attendanceHistory = [],
  loading,
  error,
}: SessionsProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  useEffect(() => {
    if (!selectedSessionId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedSessionId(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selectedSessionId]);

  if (loading) {
    return <EmptyState title="Loading sessions" body="Fetching live session history." />;
  }

  if (error) {
    return <EmptyState title="Sessions unavailable" body={error} />;
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        body="Once sessions or attendance records exist in the backend, they will appear here automatically."
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title={mode === "admin" ? "Sessions" : "Session History"}
        subtitle={
          mode === "admin"
            ? "Live session rows from the current backend."
            : "Your attendance history from the current backend."
        }
      />

      {/* Mobile: stacked cards (no horizontal scroll). */}
      <div className="space-y-3 md:hidden">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => setSelectedSessionId(session.id)}
            className="lg-tile flex w-full flex-col gap-2 p-4 text-left"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                {session.date}
              </span>
              <StateBadge state={session.state} />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {session.motionType}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                Chair: {session.assignedChairLabel ?? session.chair ?? "N/A"}
              </span>
              <span className="shrink-0 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                View →
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop: table. */}
      <Card className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.04] text-left text-slate-600 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Motion type</th>
              <th className="px-4 py-2 font-medium">Chair</th>
              <th className="px-4 py-2 font-medium">State</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-t border-slate-100 dark:border-white/[0.06]">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                    {session.date}
                  </span>
                </td>
                <td className="px-4 py-3">{session.motionType}</td>
                <td className="px-4 py-3">{session.assignedChairLabel ?? session.chair ?? "N/A"}</td>
                <td className="px-4 py-3">
                  <StateBadge state={session.state} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedSessionId(session.id)}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {mounted && selectedSession
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <div
                className="overlay-fade absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                onClick={() => setSelectedSessionId(null)}
              />
              <div className="lg-panel modal-pop relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl">
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-900/5 px-5 py-4 dark:border-white/10">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {selectedSession.date}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Motion type: {selectedSession.motionType}
                      {(selectedSession.assignedChairLabel ?? selectedSession.chair)
                        ? ` · Chair: ${selectedSession.assignedChairLabel ?? selectedSession.chair}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StateBadge state={selectedSession.state} />
                    <button
                      type="button"
                      onClick={() => setSelectedSessionId(null)}
                      aria-label="Close"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-900/10 bg-white/60 text-zinc-600 transition hover:bg-white/90 active:scale-95 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto p-5">
                  <SessionDetails
                    mode={mode}
                    session={selectedSession}
                    attendanceHistory={attendanceHistory}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function SessionDetails({
  mode,
  session,
  attendanceHistory,
}: {
  mode: "admin" | "participant";
  session: SessionRow;
  attendanceHistory: AttendanceHistoryItem[];
}) {
  const attendanceEntries = session.attendance ?? [];
  const presentEntries = attendanceEntries.filter((entry) => isPresentStatus(entry.status));
  const presentCount = presentEntries.length;
  const myAttendance =
    attendanceHistory.find((item) => item.session.id === session.id) ?? null;

  return (
    <>
      {mode === "admin" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SummaryTile label="Present" value={presentCount} icon={<Users size={13} />} />
            <SummaryTile label="Chair" value={session.assignedChairLabel ?? session.chair ?? "N/A"} icon={<Crown size={13} />} />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Present participants
            </h4>
            {attendanceEntries.length > 0 ? (
              presentEntries.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {presentEntries.map((entry) => {
                    const participantId = entry.member?.id ?? entry.cabinet?.id ?? entry.president?.id ?? null;
                    const name =
                      entry.member?.name ?? entry.cabinet?.name ?? entry.president?.name ?? "Unknown participant";
                    const assignmentLabel =
                      (participantId ? session.participantAssignmentLabels?.[participantId] : null) ?? "Present";
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 dark:border-white/10"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-[10px] font-semibold text-white">
                          {sessionInitials(name)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                            {name}
                          </div>
                          <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {assignmentLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No present participants"
                  body="Attendance has been marked for this session, but no one is currently marked present."
                />
              )
            ) : (
              <EmptyState
                title="No attendance records"
                body="This session exists, but no attendance rows have been saved for it yet."
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5">
          {myAttendance ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SummaryTile label="Status" value={myAttendance.status} icon={<Users size={13} />} />
              <SummaryTile
                label="Speaker score"
                value={myAttendance.speakerScore ?? "N/A"}
                icon={<Users size={13} />}
              />
              <SummaryTile
                label="Pair code"
                value={myAttendance.pairingCode ?? "N/A"}
                icon={<Users size={13} />}
              />
              <SummaryTile
                label="Paired with"
                value={myAttendance.pairedWith?.join(", ") || "Solo / unavailable"}
                icon={<Users size={13} />}
              />
            </div>
          ) : (
            <EmptyState
              title="No personal attendance record"
              body="This session is visible in your history, but your current backend role has no linked attendance row for it."
            />
          )}
        </div>
      )}
    </>
  );
}

function SummaryTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function sessionInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isPresentStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() === "present";
}

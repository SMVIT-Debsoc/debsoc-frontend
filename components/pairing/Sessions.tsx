"use client";

import React, { useMemo, useState } from "react";
import { Calendar, Crown, Users } from "lucide-react";
import { Card, EmptyState, SectionHeader, StateBadge } from "./ui";
import type { AttendanceHistoryItem, LegacySessionAttendance, SessionRow } from "./types";

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

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

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

      <Card>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
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
              <tr key={session.id} className="border-t border-slate-100">
                <td className="flex items-center gap-2 px-4 py-3">
                  <Calendar size={14} className="text-slate-400" />
                  {session.date}
                </td>
                <td className="px-4 py-3">{session.motionType}</td>
                <td className="px-4 py-3">{session.chair ?? "—"}</td>
                <td className="px-4 py-3">
                  <StateBadge state={session.state} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedSessionId(session.id)}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selectedSession && (
        <div className="mt-6">
          <SessionDetails
            mode={mode}
            session={selectedSession}
            attendanceHistory={attendanceHistory}
          />
        </div>
      )}
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
  const presentCount =
    session.attendance?.filter((entry) => entry.status === "Present").length ?? 0;
  const legacyGroups = buildLegacyGroups(session.attendance ?? []);
  const myAttendance =
    attendanceHistory.find((item) => item.session.id === session.id) ?? null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{session.date}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Motion type: {session.motionType}
            {session.chair ? ` · Chair: ${session.chair}` : ""}
          </p>
        </div>
        <StateBadge state={session.state} />
      </div>

      {mode === "admin" ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryTile label="Present" value={presentCount} icon={<Users size={18} />} />
            <SummaryTile label="Legacy pair groups" value={legacyGroups.length} icon={<Users size={18} />} />
            <SummaryTile label="Chair" value={session.chair ?? "—"} icon={<Crown size={18} />} />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900">Legacy attendance view</h4>
            {session.attendance && session.attendance.length > 0 ? (
              <div className="space-y-3">
                {legacyGroups.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                      Pairing groups from `pairingCode`
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {legacyGroups.map((group) => (
                        <div
                          key={group.code}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        >
                          <div className="font-medium text-slate-900">{group.code}</div>
                          <div className="mt-1">{group.names.join(" · ")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-2 md:grid-cols-2">
                  {session.attendance.map((entry) => {
                    const name = entry.member?.name ?? entry.cabinet?.name ?? "Unknown participant";
                    return (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <div className="font-medium text-slate-900">{name}</div>
                        <div className="mt-1 text-slate-600">
                          Status: {entry.status}
                          {entry.pairingCode ? ` · Pair: ${entry.pairingCode}` : ""}
                          {entry.debatedAlone ? " · Debated alone" : ""}
                          {entry.speakerScore !== null && entry.speakerScore !== undefined
                            ? ` · Score: ${entry.speakerScore}`
                            : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
              <SummaryTile label="Status" value={myAttendance.status} icon={<Users size={18} />} />
              <SummaryTile
                label="Speaker score"
                value={myAttendance.speakerScore ?? "—"}
                icon={<Users size={18} />}
              />
              <SummaryTile
                label="Pair code"
                value={myAttendance.pairingCode ?? "—"}
                icon={<Users size={18} />}
              />
              <SummaryTile
                label="Paired with"
                value={myAttendance.pairedWith?.join(", ") || "Solo / unavailable"}
                icon={<Users size={18} />}
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
    </Card>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-500">{icon}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function buildLegacyGroups(attendance: LegacySessionAttendance[]) {
  const groups = new Map<string, string[]>();

  for (const entry of attendance) {
    if (!entry.pairingCode || entry.debatedAlone) continue;
    const name = entry.member?.name ?? entry.cabinet?.name ?? "Unknown participant";
    const current = groups.get(entry.pairingCode) ?? [];
    current.push(name);
    groups.set(entry.pairingCode, current);
  }

  return Array.from(groups.entries())
    .map(([code, names]) => ({ code, names }))
    .sort((left, right) => left.code.localeCompare(right.code));
}

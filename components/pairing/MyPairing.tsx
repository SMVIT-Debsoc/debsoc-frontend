"use client";

import React from "react";
import { Card, EmptyState, SectionHeader, StateBadge } from "./ui";
import type { AttendanceHistoryItem } from "./types";

type MyPairingProps = {
  role: string;
  attendanceHistory: AttendanceHistoryItem[];
};

export default function MyPairing({ role, attendanceHistory }: MyPairingProps) {
  const latest = attendanceHistory[0] ?? null;

  if (!latest) {
    return (
      <div>
        <SectionHeader
          title="My Pairing"
          subtitle="Live self-view from attendance history."
        />
        <EmptyState
          title="No linked pairing record yet"
          body={
            role === "President"
              ? "The current legacy backend does not store president attendance inside the pairing flow, so this tab has no real record to show yet."
              : "No attendance history was found for your account yet. Once your attendance is saved, this tab will reflect it automatically."
          }
        />
      </div>
    );
  }

  const pairedWith = latest.pairedWith?.join(", ") || (latest.debatedAlone ? "Debated alone" : "Pair details unavailable");

  return (
    <div>
      <SectionHeader
        title="My Pairing"
        subtitle={`${latest.session.sessionDate} · Motion type: ${latest.session.motiontype}`}
        right={<StateBadge state={latest.speakerScore !== null ? "Scored" : "Published"} />}
      />

      <Card className="relative overflow-hidden border-blue-100 p-5 shadow-sm">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500" />
        <div className="grid gap-4 md:grid-cols-2">
          <Stat label="Attendance status" value={latest.status} />
          <Stat label="Chair" value={latest.session.Chair} />
          <Stat label="Pair code" value={latest.pairingCode ?? "—"} />
          <Stat label="Paired with" value={pairedWith} />
          <Stat
            label="Recorded speaker score"
            value={latest.speakerScore !== null ? String(latest.speakerScore) : "—"}
          />
          <Stat label="Legacy solo flag" value={latest.debatedAlone ? "Yes" : "No"} />
        </div>
      </Card>

      <p className="mt-6 border-t border-slate-200 pt-4 text-[12px] text-slate-500">
        This is a legacy attendance-backed self-view. It has replaced the hard-coded published
        pairing fixture, but it will stay structurally limited until the documented published
        pairing route exists.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-[13px] font-medium leading-snug text-slate-900">{value}</div>
    </div>
  );
}

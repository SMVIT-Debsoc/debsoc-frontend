"use client";

import React, { useState } from "react";
import { Card, ConfidenceDots, Pill, SectionHeader } from "./ui";
import {
  defaultProgress,
  participants,
  progressByParticipant,
} from "./mock";
import type { Participant, ProgressProfile } from "./mock";

export default function Roster() {
  const [filter, setFilter] = useState("");

  return (
    <div>
      <SectionHeader
        title="Members & Cabinet"
        subtitle="Hover a row to see that person&apos;s progress verdict, drawn from session metrics."
        right={
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search…"
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-56"
          />
        }
      />
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="py-2 px-4 font-medium">Name</th>
              <th className="py-2 px-4 font-medium">Account</th>
              <th className="py-2 px-4 font-medium">Speaker total</th>
              <th className="py-2 px-4 font-medium">Strength</th>
              <th className="py-2 px-4 font-medium">Spoken / Adj / Chair</th>
              <th className="py-2 px-4 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {participants
              .filter((p) =>
                p.name.toLowerCase().includes(filter.toLowerCase())
              )
              .map((p) => {
                const prog =
                  progressByParticipant[p.id] ?? defaultProgress(p);
                return <RosterRow key={p.id} p={p} prog={prog} />;
              })}
          </tbody>
        </table>
      </Card>
      <p className="text-[12px] text-slate-500 mt-3">
        Access: cabinet and president see any participant&apos;s progress. A
        participant sees only their own.
      </p>
    </div>
  );
}

function RosterRow({
  p,
  prog,
}: {
  p: Participant;
  prog: ProgressProfile;
}) {
  const [open, setOpen] = useState(false);
  const dataLabel =
    prog.strengthConfidence >= 4
      ? "mature"
      : prog.strengthConfidence >= 2
      ? "building"
      : "low data";

  return (
    <tr
      className="relative border-t border-slate-100 hover:bg-slate-50"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      <td className="py-3 px-4 font-medium">
        {p.name}
        {open && <ProgressPopover prog={prog} name={p.name} />}
      </td>
      <td className="py-3 px-4">
        <Pill
          tone={
            p.account === "President"
              ? "blue"
              : p.account === "Cabinet"
              ? "amber"
              : "slate"
          }
        >
          {p.account}
        </Pill>
      </td>
      <td className="py-3 px-4">{prog.speakerTotal || "—"}</td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-2">
          <span className="font-medium">
            {prog.speakerStrength ? prog.speakerStrength.toFixed(2) : "—"}
          </span>
          <ConfidenceDots value={prog.strengthConfidence} />
        </span>
      </td>
      <td className="py-3 px-4 text-slate-700">
        {prog.sessionsSpoken} / {prog.sessionsAdjudicated} /{" "}
        {prog.sessionsChaired}
      </td>
      <td className="py-3 px-4">
        <Pill
          tone={
            dataLabel === "mature"
              ? "emerald"
              : dataLabel === "building"
              ? "amber"
              : "slate"
          }
        >
          {dataLabel}
        </Pill>
      </td>
    </tr>
  );
}

function ProgressPopover({
  prog,
  name,
}: {
  prog: ProgressProfile;
  name: string;
}) {
  return (
    <div className="absolute left-4 top-full z-30 mt-1 w-[min(560px,calc(100vw-2rem))] bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-sm cursor-default">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{name} · Progress</div>
        <div className="text-xs text-slate-500">
          trend: <span className="font-medium">{prog.trend}</span>
        </div>
      </div>

      {/* Verdict */}
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
          Verdict
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-slate-800">
          {prog.verdict.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      </div>

      {/* Evidence */}
      <div className="border-t border-slate-100 pt-2 grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Headline numbers
          </div>
          <div className="text-slate-700 leading-snug">
            Total: <span className="font-medium">{prog.speakerTotal}</span> ·
            Strength:{" "}
            <span className="font-medium">
              {prog.speakerStrength.toFixed(2)}
            </span>{" "}
            <ConfidenceDots value={prog.strengthConfidence} />
            <br />
            Spoken {prog.sessionsSpoken} · Adj {prog.sessionsAdjudicated} ·
            Chair {prog.sessionsChaired}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            By motion type
          </div>
          <ul className="text-slate-700 space-y-0.5">
            {prog.perMotionTotal.length === 0 && <li>—</li>}
            {prog.perMotionTotal.map((m) => (
              <li key={m.motion}>
                {m.motion}: <span className="font-medium">{m.total}</span>{" "}
                {m.lowData && (
                  <span className="text-amber-600 text-xs">low data</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Roles
          </div>
          <ul className="text-slate-700 space-y-0.5">
            {prog.roleScores.length === 0 && <li>—</li>}
            {prog.roleScores.map((r) => (
              <li key={r.role}>
                {r.role}:{" "}
                <span className="font-medium">{r.score.toFixed(2)}</span>{" "}
                {r.lowData && (
                  <span className="text-amber-600 text-xs">low data</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Partner dynamics
          </div>
          <div className="text-slate-700">
            <div>
              Strong:{" "}
              {prog.partnerGood.length ? prog.partnerGood.join(", ") : "—"}
            </div>
            <div className="mt-1">
              Friction:{" "}
              {prog.partnerFriction.length === 0
                ? "—"
                : prog.partnerFriction
                    .map((f) => `${f.name} (${f.note})`)
                    .join(", ")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

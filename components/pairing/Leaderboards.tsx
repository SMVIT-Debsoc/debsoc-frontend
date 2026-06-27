"use client";

import React, { useMemo, useState } from "react";
import { Card, Pill, SectionHeader } from "./ui";
import {
  adjudicatorLeaderboard,
  findParticipant,
  speakerLeaderboard,
} from "./mock";

const MOTIONS = ["All", "IR", "Policy", "Moral", "Feminism", "Finance"];

export default function Leaderboards() {
  const [tab, setTab] = useState<"speakers" | "adjudicators">("speakers");

  return (
    <div>
      <SectionHeader
        title="Leaderboards"
        subtitle="Derived from raw scoring; recomputable. Speakers = cumulative total. Adjudicators = average across sessions."
      />
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("speakers")}
          className={`px-3 py-1.5 text-sm rounded-md border ${
            tab === "speakers"
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Speakers
        </button>
        <button
          type="button"
          onClick={() => setTab("adjudicators")}
          className={`px-3 py-1.5 text-sm rounded-md border ${
            tab === "adjudicators"
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Adjudicators
        </button>
      </div>
      {tab === "speakers" ? <SpeakerBoard /> : <AdjBoard />}
    </div>
  );
}

function SpeakerBoard() {
  const [motion, setMotion] = useState<string>("All");

  const rows = useMemo(() => {
    const arr = speakerLeaderboard.map((r) => ({
      ...r,
      shownValue:
        motion === "All" ? r.total : r.motionTotals[motion] ?? 0,
    }));
    return arr.sort((a, b) => b.shownValue - a.shownValue);
  }, [motion]);

  const enoughData =
    motion === "All" || rows.some((r) => (r.shownValue ?? 0) > 60);

  return (
    <Card>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 flex-wrap">
        <span className="text-sm text-slate-600">Motion type:</span>
        {MOTIONS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMotion(m)}
            className={`text-sm px-2.5 py-1 rounded-md ${
              motion === m
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {m}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          {motion === "All"
            ? "Showing cumulative total across all motions."
            : `Showing cumulative ${motion} total.`}
        </span>
      </div>
      {enoughData ? (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="py-2 px-4 font-medium w-12">#</th>
              <th className="py-2 px-4 font-medium">Name</th>
              <th className="py-2 px-4 font-medium">
                {motion === "All" ? "Total" : `${motion} total`}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const p = findParticipant(r.participantId);
              if (!p) return null;
              return (
                <tr
                  key={r.participantId}
                  className="border-t border-slate-100"
                >
                  <td className="py-2 px-4 text-slate-500">{i + 1}</td>
                  <td className="py-2 px-4 font-medium">
                    {p.name}{" "}
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
                  <td className="py-2 px-4 font-semibold">{r.shownValue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="p-6 text-center text-sm text-slate-600">
          Not enough data yet for <strong>{motion}</strong>. Try another motion
          type.
        </div>
      )}
    </Card>
  );
}

function AdjBoard() {
  return (
    <Card>
      <div className="px-4 py-3 border-b border-slate-100 text-xs text-slate-500">
        Ranked by average only (not cumulative, not boosted by count). Counts
        below are shown for context.
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
          <tr>
            <th className="py-2 px-4 font-medium w-12">#</th>
            <th className="py-2 px-4 font-medium">Name</th>
            <th className="py-2 px-4 font-medium">Average</th>
            <th className="py-2 px-4 font-medium">Adjudicated</th>
            <th className="py-2 px-4 font-medium">Chaired</th>
          </tr>
        </thead>
        <tbody>
          {adjudicatorLeaderboard.map((r, i) => {
            const p = findParticipant(r.participantId);
            if (!p) return null;
            return (
              <tr key={r.participantId} className="border-t border-slate-100">
                <td className="py-2 px-4 text-slate-500">{i + 1}</td>
                <td className="py-2 px-4 font-medium">
                  {p.name}{" "}
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
                <td className="py-2 px-4 font-semibold">
                  {r.average.toFixed(1)}
                </td>
                <td className="py-2 px-4 text-slate-700">
                  {r.sessionsAdjudicated}
                </td>
                <td className="py-2 px-4 text-slate-700">
                  {r.sessionsChaired}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

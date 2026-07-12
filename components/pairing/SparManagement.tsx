"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, EmptyState, Field, Pill, PrimaryButton, SecondaryButton, SectionHeader } from "./ui";
import type { Participant } from "./types";
import { benchPositions } from "@/types/pairing";
import { getSparRolesForPosition, sparRolesByPosition, type SparHistoryResponse, type SparLeaderboardResponse } from "@/types/spar";

const DEFAULT_HISTORY: SparHistoryResponse = { records: [], pagination: { page: 1, limit: 20, totalPages: 0, totalRecords: 0 } };
const DEFAULT_LEADERBOARD: SparLeaderboardResponse = { rankings: [], myRank: null, totalParticipants: 0, pagination: { page: 1, limit: 20, totalPages: 0 } };

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400";
const selectClass = `${inputClass} appearance-none pr-9`;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function participantRoleForApi(account: Participant["account"]) {
  if (account === "Cabinet") return "cabinet";
  return account;
}

export default function SparManagement({
  participants,
  currentUserId = null,
}: {
  participants: Participant[];
  currentUserId?: string | null;
}) {
  const [sparDate, setSparDate] = useState(todayInputValue());
  const [motionType, setMotionType] = useState("");
  const [motionText, setMotionText] = useState("");
  const [bpPosition, setBpPosition] = useState<(typeof benchPositions)[number]>("OG");
  const [isIronMan, setIsIronMan] = useState(false);
  const [teammateKey, setTeammateKey] = useState("");
  const rolesForPosition = getSparRolesForPosition(bpPosition);
  const [selectedRole, setSelectedRole] = useState(rolesForPosition[0]);
  const [firstScore, setFirstScore] = useState("");
  const [secondScore, setSecondScore] = useState("");
  const [teamRank, setTeamRank] = useState("1");
  const [history, setHistory] = useState<SparHistoryResponse>(DEFAULT_HISTORY);
  const [leaderboard, setLeaderboard] = useState<SparLeaderboardResponse>(DEFAULT_LEADERBOARD);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const roles = sparRolesByPosition[bpPosition];
    setSelectedRole(roles[0]);
  }, [bpPosition]);

  const teammateOptions = useMemo(
    () => participants
      .filter((participant) => participant.id !== currentUserId)
      .map((participant) => ({
        key: `${participant.account}:${participant.id}`,
        id: participant.id,
        role: participantRoleForApi(participant.account),
        label: `${participant.name} (${participant.account})`,
      })),
    [currentUserId, participants],
  );

  async function loadSparData() {
    setLoading(true);
    setError(null);
    try {
      const [historyResponse, leaderboardResponse] = await Promise.all([
        fetch("/api/spar/history", { cache: "no-store" }),
        fetch("/api/spar/leaderboard", { cache: "no-store" }),
      ]);
      if (!historyResponse.ok) throw new Error("Could not load spar history.");
      if (!leaderboardResponse.ok) throw new Error("Could not load spar leaderboard.");
      setHistory(await historyResponse.json());
      setLeaderboard(await leaderboardResponse.json());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load spar data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSparData();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const teammate = teammateOptions.find((option) => option.key === teammateKey) ?? null;
    const speakerScores = isIronMan
      ? [
          { speakingRole: rolesForPosition[0], speakerScore: Number(firstScore) },
          { speakingRole: rolesForPosition[1], speakerScore: Number(secondScore) },
        ]
      : [{ speakingRole: selectedRole, speakerScore: Number(firstScore) }];

    try {
      const response = await fetch("/api/spar/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sparDate: new Date(`${sparDate}T00:00:00.000Z`).toISOString(),
          motionType,
          motionText: motionText.trim() || null,
          bpPosition,
          isIronMan,
          teammateId: isIronMan ? null : teammate?.id ?? null,
          teammateRole: isIronMan ? null : teammate?.role ?? null,
          teamRank: Number(teamRank),
          speakerScores,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body.message === "string" ? body.message : "Spar submission failed.");
      }
      setMessage("Spar submitted.");
      setFirstScore("");
      setSecondScore("");
      setMotionText("");
      await loadSparData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Spar submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSpar(sparId: string) {
    setError(null);
    const response = await fetch(`/api/spar/${sparId}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(typeof body.message === "string" ? body.message : "Spar delete failed.");
      return;
    }
    await loadSparData();
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Spars" subtitle="Submit practice rounds and track spar ranking." right={<SecondaryButton type="button" onClick={() => void loadSparData()}>Refresh</SecondaryButton>} />
      {(message || error) && <div className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"}`}>{error ?? message}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Submit Spar" />
          <form onSubmit={submit} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Date"><input className={inputClass} type="date" value={sparDate} max={todayInputValue()} onChange={(event) => setSparDate(event.target.value)} required /></Field>
            <Field label="Motion Type"><input className={inputClass} value={motionType} onChange={(event) => setMotionType(event.target.value)} placeholder="e.g. International Relations" required /></Field>
            <div className="sm:col-span-2"><Field label="Motion Text"><input className={inputClass} value={motionText} onChange={(event) => setMotionText(event.target.value)} placeholder="Optional full motion" /></Field></div>
            <Field label="BP Position"><select className={selectClass} value={bpPosition} onChange={(event) => setBpPosition(event.target.value as typeof bpPosition)}>{benchPositions.map((position) => <option key={position}>{position}</option>)}</select></Field>
            <Field label="Teammate"><select className={selectClass} value={isIronMan ? "iron" : teammateKey} onChange={(event) => { const value = event.target.value; setIsIronMan(value === "iron"); setTeammateKey(value === "iron" ? "" : value); }}><option value="">Select teammate</option><option value="iron">Iron Man</option>{teammateOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></Field>
            {!isIronMan && <Field label="Speaking Role"><select className={selectClass} value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as typeof selectedRole)}>{rolesForPosition.map((role) => <option key={role}>{role}</option>)}</select></Field>}
            <Field label={isIronMan ? `${rolesForPosition[0]} Score` : "Speaker Score"}><input className={inputClass} type="number" min="50" max="100" step="0.1" value={firstScore} onChange={(event) => setFirstScore(event.target.value)} placeholder="50-100" required /></Field>
            {isIronMan && <Field label={`${rolesForPosition[1]} Score`}><input className={inputClass} type="number" min="50" max="100" step="0.1" value={secondScore} onChange={(event) => setSecondScore(event.target.value)} placeholder="50-100" required /></Field>}
            <Field label="Team Rank"><select className={selectClass} value={teamRank} onChange={(event) => setTeamRank(event.target.value)}>{[1, 2, 3, 4].map((rank) => <option key={rank} value={rank}>{rank}</option>)}</select></Field>
            <div className="flex pt-2 sm:col-span-2"><PrimaryButton type="submit" disabled={submitting || (!isIronMan && !teammateKey)}>{submitting ? "Submitting..." : "Submit Spar"}</PrimaryButton></div>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeader title="Spar Leaderboard" subtitle={leaderboard.myRank ? `Your rank: #${leaderboard.myRank.rank}` : undefined} />
          {loading ? <EmptyState title="Loading" body="Fetching spar rankings." /> : leaderboard.rankings.length === 0 ? <EmptyState title="No rankings yet" body="Submit a spar to start the board." /> : <div className="space-y-2">{leaderboard.rankings.map((entry) => <div key={`${entry.userRole}:${entry.userId}`} className="flex items-center justify-between rounded-xl bg-white/55 px-3 py-2 text-sm dark:bg-white/[0.04]"><div><span className="font-semibold text-slate-900 dark:text-slate-100">#{entry.rank} {entry.userName}</span><div className="text-xs text-slate-500">{entry.totalSpars} spars - streak {entry.currentStreak}</div></div><Pill tone="blue">{entry.userRole}</Pill></div>)}</div>}
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <SectionHeader title="My Spar History" />
        {loading ? <EmptyState title="Loading" body="Fetching your spar history." /> : history.records.length === 0 ? <EmptyState title="No spars yet" body="Your submitted spars will appear here." /> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Motion</th><th className="px-3 py-2">Position</th><th className="px-3 py-2">Rank</th><th className="px-3 py-2">Scores</th><th className="px-3 py-2"></th></tr></thead><tbody>{history.records.map((record) => <tr key={record.id} className="border-t border-slate-200/70 dark:border-white/10"><td className="px-3 py-3">{record.sparDate.slice(0, 10)}</td><td className="px-3 py-3">{record.motionType}</td><td className="px-3 py-3">{record.bpPosition}{record.isIronMan ? " - Iron Man" : ""}</td><td className="px-3 py-3">{record.teamRank}</td><td className="px-3 py-3">{record.speakerScores.map((score) => `${score.speakingRole} ${score.speakerScore}`).join(", ")}</td><td className="px-3 py-3 text-right"><button className="inline-flex min-h-[36px] items-center rounded-lg px-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10" onClick={() => void removeSpar(record.id)} type="button" aria-label="Delete spar"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>}
      </Card>
    </div>
  );
}
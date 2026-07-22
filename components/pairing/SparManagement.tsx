"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, EmptyState, Field, Pill, PrimaryButton, SecondaryButton, SectionHeader } from "./ui";
import type { Participant } from "./types";
import { benchPositions } from "@/types/pairing";
import {
  getSparRolesForApSide,
  getSparRolesForPosition,
  sparRolesByApSide,
  sparRolesByPosition,
  type ApSide,
  type SparDebateFormat,
  type SparLeaderboardResponse,
  type SparSpeakingRole,
} from "@/types/spar";

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

function RankDoodle({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="1st place trophy">
        <path d="M12 6h16v6a8 8 0 0 1-16 0V6Z" fill="#facc15" stroke="#78350f" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 8H8a4 4 0 0 0 4 4M28 8h4a4 4 0 0 1-4 4" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 20v4h6v-4" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="13" y="24" width="14" height="4" rx="1" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
        <rect x="11" y="28" width="18" height="4" rx="1" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
        <path d="M18 9l1.2 2.2 2.4.4-1.7 1.7.4 2.4L18 14.6l-2.2 1.1.4-2.4-1.7-1.7 2.4-.4L18 9Z" fill="#fef3c7" stroke="#78350f" strokeWidth="1" strokeLinejoin="round" />
      </svg>
    );
  }
  if (rank === 2) {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="2nd place medal">
        <path d="M14 6l3 8M26 6l-3 8" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="24" r="9" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
        <circle cx="20" cy="24" r="5.5" fill="#e2e8f0" stroke="#334155" strokeWidth="1.2" />
        <text x="20" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="#334155" fontFamily="ui-sans-serif, system-ui">2</text>
      </svg>
    );
  }
  if (rank === 3) {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="3rd place medal">
        <path d="M14 6l3 8M26 6l-3 8" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="24" r="9" fill="#d97706" stroke="#7c2d12" strokeWidth="1.5" />
        <circle cx="20" cy="24" r="5.5" fill="#f59e0b" stroke="#7c2d12" strokeWidth="1.2" />
        <text x="20" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="#7c2d12" fontFamily="ui-sans-serif, system-ui">3</text>
      </svg>
    );
  }
  const label = String(rank);
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={`rank ${rank}`}>
      <path d="M20 5c4 0 8 1.4 11 4.2 3.1 3 4.2 6.9 3.9 10.8-.3 3.9-2 7.6-5 10-3.3 2.6-7.2 3.4-11 3-3.8-.3-7.4-2-9.8-5-2.5-3-3.5-6.8-3-10.5.5-3.7 2.5-7.1 5.6-9.2C14.4 6.1 17.1 5 20 5Z" fill="#e0e7ff" stroke="#4338ca" strokeWidth="1.6" strokeLinejoin="round" strokeDasharray="0.1 0" />
      <path d="M10.5 12c1.5-1.5 3-2.6 4.8-3.4M32 15.5c.4 1.5.5 3 .3 4.5" stroke="#4338ca" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <text x="20" y={label.length > 1 ? 25 : 26} textAnchor="middle" fontSize={label.length > 2 ? 10 : label.length > 1 ? 13 : 15} fontWeight="800" fill="#3730a3" fontFamily="ui-sans-serif, system-ui">
        {label}
      </text>
    </svg>
  );
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
  const [debateFormat, setDebateFormat] = useState<SparDebateFormat>("BP");
  const [bpPosition, setBpPosition] = useState<(typeof benchPositions)[number]>("OG");
  const [apSide, setApSide] = useState<ApSide>("GOV");
  const [isIronMan, setIsIronMan] = useState(false);
  const [teammateKey, setTeammateKey] = useState("");
  const [secondTeammateKey, setSecondTeammateKey] = useState("");
  const rolesForPosition = getSparRolesForPosition(bpPosition);
  const rolesForApSide = getSparRolesForApSide(apSide);
  const activeRoles = debateFormat === "AP" ? rolesForApSide : rolesForPosition;
  const [selectedRole, setSelectedRole] = useState<SparSpeakingRole>(activeRoles[0]);
  const [firstScore, setFirstScore] = useState("");
  const [secondScore, setSecondScore] = useState("");
  const [thirdScore, setThirdScore] = useState("");
  const [teamRank, setTeamRank] = useState("1");
  const [leaderboard, setLeaderboard] = useState<SparLeaderboardResponse>(DEFAULT_LEADERBOARD);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const roles = debateFormat === "AP" ? sparRolesByApSide[apSide] : sparRolesByPosition[bpPosition];
    setSelectedRole(roles[0]);
    setTeamRank("1");
    setSecondScore("");
    setThirdScore("");
    setSecondTeammateKey("");
  }, [apSide, bpPosition, debateFormat]);

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

  const firstTeammate = teammateOptions.find((option) => option.key === teammateKey) ?? null;
  const secondTeammate = teammateOptions.find((option) => option.key === secondTeammateKey) ?? null;
  const rankOptions = debateFormat === "AP" ? [1, 2] : [1, 2, 3, 4];

  async function loadSparData() {
    setLoading(true);
    setError(null);
    try {
      const leaderboardResponse = await fetch("/api/spar/leaderboard", { cache: "no-store" });
      if (!leaderboardResponse.ok) throw new Error("Could not load spar leaderboard.");
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
  /* eslint-enable react-hooks/set-state-in-effect */

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const teammates = isIronMan
      ? []
      : [firstTeammate, secondTeammate]
          .filter((teammate): teammate is NonNullable<typeof teammate> => teammate !== null)
          .map((teammate) => ({ id: teammate.id, role: teammate.role }));
    const speakerScores = isIronMan
      ? activeRoles.map((role, index) => ({ speakingRole: role, speakerScore: Number([firstScore, secondScore, thirdScore][index]) }))
      : [{ speakingRole: selectedRole, speakerScore: Number(firstScore) }];

    try {
      const response = await fetch("/api/spar/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sparDate: new Date(`${sparDate}T00:00:00.000Z`).toISOString(),
          motionType,
          motionText: motionText.trim() || null,
          debateFormat,
          bpPosition: debateFormat === "BP" ? bpPosition : null,
          apSide: debateFormat === "AP" ? apSide : null,
          isIronMan,
          teammateId: debateFormat === "BP" && !isIronMan ? firstTeammate?.id ?? null : null,
          teammateRole: debateFormat === "BP" && !isIronMan ? firstTeammate?.role ?? null : null,
          teammates,
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
      setThirdScore("");
      setMotionText("");
      await loadSparData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Spar submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Spars" subtitle="Submit practice rounds and track spar ranking." right={<SecondaryButton type="button" disabled={loading} onClick={() => void loadSparData()}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</SecondaryButton>} />
      {(message || error) && <div className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"}`}>{error ?? message}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="p-4 sm:p-6">
          <SectionHeader title="Submit Spar" />
          <form onSubmit={submit} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Date"><input className={inputClass} type="date" value={sparDate} max={todayInputValue()} onChange={(event) => setSparDate(event.target.value)} required /></Field>
            <Field label="Debate Format"><select className={selectClass} value={debateFormat} onChange={(event) => { setDebateFormat(event.target.value as SparDebateFormat); setIsIronMan(false); setTeammateKey(""); }}><option value="BP">BP</option><option value="AP">AP</option></select></Field>
            <Field label="Motion Type"><input className={inputClass} value={motionType} onChange={(event) => setMotionType(event.target.value)} placeholder="e.g. International Relations" required /></Field>
            <div className="sm:col-span-2"><Field label="Motion Text"><input className={inputClass} value={motionText} onChange={(event) => setMotionText(event.target.value)} placeholder="Optional full motion" /></Field></div>
            {debateFormat === "BP" ? <Field label="BP Position"><select className={selectClass} value={bpPosition} onChange={(event) => setBpPosition(event.target.value as typeof bpPosition)}>{benchPositions.map((position) => <option key={position}>{position}</option>)}</select></Field> : <Field label="AP Side"><select className={selectClass} value={apSide} onChange={(event) => setApSide(event.target.value as ApSide)}><option value="GOV">Gov</option><option value="OPP">Opp</option></select></Field>}
            <Field label={debateFormat === "AP" ? "Teammate 1" : "Teammate"}><select className={selectClass} value={isIronMan ? "iron" : teammateKey} onChange={(event) => { const value = event.target.value; setIsIronMan(value === "iron"); setTeammateKey(value === "iron" ? "" : value); }}><option value="">{debateFormat === "AP" ? "Solo / no teammate" : "Select teammate"}</option><option value="iron">Iron Man</option>{teammateOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></Field>
            {debateFormat === "AP" && !isIronMan && <Field label="Teammate 2"><select className={selectClass} value={secondTeammateKey} onChange={(event) => setSecondTeammateKey(event.target.value)}><option value="">Optional teammate</option>{teammateOptions.filter((option) => option.key !== teammateKey).map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></Field>}
            {!isIronMan && <Field label="Speaking Role"><select className={selectClass} value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as SparSpeakingRole)}>{activeRoles.map((role) => <option key={role}>{role}</option>)}</select></Field>}
            <Field label={isIronMan ? `${activeRoles[0]} Score` : "Speaker Score"}><input className={inputClass} type="number" min="50" max="100" step="0.1" value={firstScore} onChange={(event) => setFirstScore(event.target.value)} placeholder="50-100" required /></Field>
            {isIronMan && <Field label={`${activeRoles[1]} Score`}><input className={inputClass} type="number" min="50" max="100" step="0.1" value={secondScore} onChange={(event) => setSecondScore(event.target.value)} placeholder="50-100" required /></Field>}
            {isIronMan && debateFormat === "AP" && <Field label={`${activeRoles[2]} Score`}><input className={inputClass} type="number" min="50" max="100" step="0.1" value={thirdScore} onChange={(event) => setThirdScore(event.target.value)} placeholder="50-100" required /></Field>}
            <Field label="Team Rank"><select className={selectClass} value={teamRank} onChange={(event) => setTeamRank(event.target.value)}>{rankOptions.map((rank) => <option key={rank} value={rank}>{rank}</option>)}</select></Field>
            <div className="flex pt-2 sm:col-span-2"><PrimaryButton type="submit" disabled={submitting || (debateFormat === "BP" && !isIronMan && !teammateKey)}>{submitting ? "Submitting..." : "Submit Spar"}</PrimaryButton></div>
          </form>
        </Card>

        <Card className="relative min-h-[360px] overflow-hidden p-4 sm:p-6">
          <div aria-hidden className="pointer-events-none absolute -left-10 top-16 h-44 w-44 rounded-full border border-indigo-400/20 opacity-60 dark:border-indigo-300/20" />
          <div aria-hidden className="pointer-events-none absolute -right-20 bottom-14 h-24 w-80 -rotate-12 rounded-full border border-sky-400/20 bg-sky-400/[0.04] shadow-[0_0_40px_rgba(59,130,246,0.12)] dark:border-sky-300/15 dark:bg-sky-300/[0.04]" />
          <div aria-hidden className="pointer-events-none absolute right-28 top-10 h-16 w-56 rotate-20 rounded-full border border-sky-400/20 bg-sky-400/[0.04] dark:border-sky-300/15" />
          <div className="relative">
            <SectionHeader title="Spar Leaderboard" subtitle={leaderboard.myRank ? `Your rank: #${leaderboard.myRank.rank}` : undefined} />
            {loading ? <EmptyState title="Loading" body="Fetching spar rankings." /> : leaderboard.rankings.length === 0 ? <EmptyState title="No rankings yet" body="Submit a spar to start the board." /> : <div className="space-y-2">{leaderboard.rankings.map((entry) => <div key={`${entry.userRole}:${entry.userId}`} className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/60 px-3 py-3 text-sm shadow-sm shadow-slate-950/5 dark:bg-white/[0.045]"><div className="flex h-10 w-10 items-center justify-center"><RankDoodle rank={entry.rank} /></div><div className="min-w-0"><span className="block truncate font-semibold text-slate-900 dark:text-slate-100">{entry.userName}</span><div className="text-xs text-slate-500">{entry.totalSpars} spars - streak {entry.currentStreak}</div></div><Pill tone="blue">{entry.userRole}</Pill></div>)}</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

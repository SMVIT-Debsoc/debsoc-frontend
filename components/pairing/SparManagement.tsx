"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Church,
  Globe2,
  Landmark,
  Leaf,
  Loader2,
  Newspaper,
  Palette,
  Scale,
  Trophy,
  UsersRound,
  VenusAndMars,
  WandSparkles,
  RefreshCw,
  Trash2,
} from "lucide-react";
import SearchableDropdown from "@/components/smoothui/components/searchable-dropdown";
import { Card, EmptyState, Field, Pill, PrimaryButton, SecondaryButton, SectionHeader } from "./ui";
import type { Participant } from "./types";
import { benchPositions } from "@/types/pairing";
import { sparMotionCategories } from "@/types/spar-motions";
import {
  getSparRolesForApSide,
  getSparRolesForPosition,
  sparRolesByApSide,
  sparRolesByPosition,
  type ApSide,
  type SparDebateFormat,
  type SparLeaderboardResponse,
  type SparHistoryResponse,
  type SparSpeakingRole,
} from "@/types/spar";

const DEFAULT_LEADERBOARD: SparLeaderboardResponse = { rankings: [], myRank: null, totalParticipants: 0, pagination: { page: 1, limit: 20, totalPages: 0 } };
const DEFAULT_HISTORY: SparHistoryResponse = { records: [], pagination: { page: 1, limit: 20, totalPages: 0, totalRecords: 0 } };

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400";
const selectClass = `${inputClass} appearance-none pr-9`;

const motionCategoryIcons = {
  "economics-development": <Landmark className="h-4 w-4 shrink-0" aria-hidden="true" />,
  feminism: <VenusAndMars className="h-4 w-4 shrink-0" aria-hidden="true" />,
  religion: <Church className="h-4 w-4 shrink-0" aria-hidden="true" />,
  "philosophy-medical-ethics": <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />,
  education: <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />,
  "family-parenting-children": <UsersRound className="h-4 w-4 shrink-0" aria-hidden="true" />,
  environment: <Leaf className="h-4 w-4 shrink-0" aria-hidden="true" />,
  art: <Palette className="h-4 w-4 shrink-0" aria-hidden="true" />,
  sports: <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />,
  media: <Newspaper className="h-4 w-4 shrink-0" aria-hidden="true" />,
  culture: <Globe2 className="h-4 w-4 shrink-0" aria-hidden="true" />,
  "international-relations": <Globe2 className="h-4 w-4 shrink-0" aria-hidden="true" />,
  hypotheticals: <WandSparkles className="h-4 w-4 shrink-0" aria-hidden="true" />,
} satisfies Record<(typeof sparMotionCategories)[number]["id"], React.ReactNode>;

const motionOptions = sparMotionCategories.map((category) => ({
  description: category.motionCount > 0 ? `${category.description} (${category.motionCount} motions)` : category.description,
  icon: motionCategoryIcons[category.id],
  id: category.id,
  label: category.label,
  searchTerms: category.searchTerms,
  value: category.label,
}));

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function participantRoleForApi(account: Participant["account"]) {
  if (account === "Cabinet") return "cabinet";
  return account;
}

function formatSparDate(value: string) { return value.slice(0, 10); }
function formatSparScores(record: SparHistoryResponse["records"][number]) { return record.speakerScores.map((score) => `${score.speakingRole.replace("_", " ")} ${score.speakerScore}`).join(", "); }
function formatSparPosition(record: SparHistoryResponse["records"][number]) { return `${record.debateFormat === "AP" ? `AP ${record.apSide ?? ""}` : `BP ${record.bpPosition ?? ""}`}${record.isIronMan ? " - Iron Man" : ""}`; }

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
  const [history, setHistory] = useState<SparHistoryResponse>(DEFAULT_HISTORY);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingSparId, setDeletingSparId] = useState<string | null>(null);
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
  const teammateDropdownItems = useMemo(() => [
    {
      id: "iron",
      label: "Iron Man",
      value: "iron",
      description: "Submit this practice round as a solo Iron Man spar.",
      searchTerms: ["solo", "iron man"],
    },
    ...teammateOptions.map((option) => ({
      id: option.key,
      label: option.label,
      value: option.key,
      description: option.role,
      searchTerms: [option.role],
    })),
  ], [teammateOptions]);

  const firstTeammate = teammateOptions.find((option) => option.key === teammateKey) ?? null;
  const secondTeammate = teammateOptions.find((option) => option.key === secondTeammateKey) ?? null;
  const selectedMotionCategory = sparMotionCategories.find((category) => category.id === motionType) ?? null;
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

  async function loadHistory() {
    setHistoryLoading(true); setHistoryError(null);
    try { const response = await fetch("/api/spar/history", { cache: "no-store" }); if (!response.ok) throw new Error("Could not load spar history."); setHistory(await response.json()); }
    catch (caught) { setHistoryError(caught instanceof Error ? caught.message : "Could not load spar history."); }
    finally { setHistoryLoading(false); }
  }

  async function removeSpar(sparId: string) {
    if (deletingSparId !== null) return;
    if (!window.confirm("Delete this Spar record? This cannot be undone.")) return;

    setDeletingSparId(sparId);
    setHistoryError(null);
    try {
      const response = await fetch(`/api/spar/${encodeURIComponent(sparId)}`, { method: "DELETE" });
      const body = await response.json().catch(() => null) as { message?: unknown } | null;
      if (!response.ok) {
        throw new Error(typeof body?.message === "string" ? body.message : "Spar delete failed.");
      }
      setMessage("Spar deleted.");
      await Promise.all([loadHistory(), loadSparData()]);
    } catch (caught) {
      setHistoryError(caught instanceof Error ? caught.message : "Spar delete failed.");
    } finally {
      setDeletingSparId(null);
    }
  }

  useEffect(() => {
    void loadSparData();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMotionCategory) {
      setError("Select an approved motion category before submitting.");
      return;
    }
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
          motionType: selectedMotionCategory.label,
          motionText: null,
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

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1.25fr)]">
        <Card className="min-w-0 overflow-hidden border border-black/10 bg-white/[0.08] p-4 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-[#151515]/80 dark:shadow-black/20 sm:p-6">
          <div className="mb-6 border-b border-black/10 pb-5 dark:border-white/10">
            <SectionHeader title="Submit Spar" subtitle="Record a practice round with validated debate details and scores." />
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Fields marked as required must be completed before your round can be submitted.</p>
          </div>
          <form onSubmit={submit} className="grid min-w-0 gap-x-5 gap-y-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Round details</p>
            </div>
            <Field label="Date"><input className={inputClass} type="date" value={sparDate} max={todayInputValue()} onChange={(event) => setSparDate(event.target.value)} required /></Field>
            <Field label="Debate Format"><select className={selectClass} value={debateFormat} onChange={(event) => { setDebateFormat(event.target.value as SparDebateFormat); setIsIronMan(false); setTeammateKey(""); }}><option value="BP">BP</option><option value="AP">AP</option></select></Field>
            <div className="space-y-3 lg:col-span-2">
              <Field label="Motion Type">
                <SearchableDropdown
                  emptyMessage="No motions found"
                  items={motionOptions}
                  label="Select a motion"
                  placeholder="Search motions..."
                  value={motionType}
                  onSelect={(item) => setMotionType(item.id)}
                />
              </Field>
              {selectedMotionCategory && <p aria-live="polite" className="text-xs text-slate-600 dark:text-slate-400">Selected category: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMotionCategory.label}</span> · {selectedMotionCategory.description}</p>}
            </div>
            <div className="pt-1 lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Debate setup</p>
            </div>
            {debateFormat === "BP" ? <Field label="BP Position"><select className={selectClass} value={bpPosition} onChange={(event) => setBpPosition(event.target.value as typeof bpPosition)}>{benchPositions.map((position) => <option key={position}>{position}</option>)}</select></Field> : <Field label="AP Side"><select className={selectClass} value={apSide} onChange={(event) => setApSide(event.target.value as ApSide)}><option value="GOV">Gov</option><option value="OPP">Opp</option></select></Field>}
            <Field label={debateFormat === "AP" ? "Teammate 1" : "Teammate"}>
              <SearchableDropdown
                emptyMessage="No teammates found"
                items={teammateDropdownItems}
                label={debateFormat === "AP" ? "Teammate 1" : "Teammate"}
                placeholder={debateFormat === "AP" ? "Solo / no teammate" : "Search teammates..."}
                value={isIronMan ? "iron" : teammateKey}
                onSelect={(item) => {
                  const value = item.id;
                  setIsIronMan(value === "iron");
                  setTeammateKey(value === "iron" ? "" : value);
                }}
                clearable
                onClear={() => {
                  setIsIronMan(false);
                  setTeammateKey("");
                }}
              />
            </Field>
            {debateFormat === "AP" && !isIronMan && <Field label="Teammate 2">
              <SearchableDropdown
                emptyMessage="No teammates found"
                items={teammateDropdownItems.filter((option) => option.id !== "iron" && option.id !== teammateKey)}
                label="Teammate 2"
                placeholder="Optional teammate"
                value={secondTeammateKey}
                onSelect={(item) => setSecondTeammateKey(item.id)}
                clearable
                onClear={() => setSecondTeammateKey("")}
              />
            </Field>}
            {!isIronMan && <Field label="Speaking Role"><select className={selectClass} value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as SparSpeakingRole)}>{activeRoles.map((role) => <option key={role}>{role}</option>)}</select></Field>}
            <div className="pt-1 lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Speaker scores and result</p>
            </div>
            <Field label={isIronMan ? `${activeRoles[0]} Score` : "Speaker Score"}><input className={inputClass} type="number" min="50" max="100" step="0.1" value={firstScore} onChange={(event) => setFirstScore(event.target.value)} placeholder="50-100" required /></Field>
            {isIronMan && <Field label={`${activeRoles[1]} Score`}><input className={inputClass} type="number" min="50" max="100" step="0.1" value={secondScore} onChange={(event) => setSecondScore(event.target.value)} placeholder="50-100" required /></Field>}
            {isIronMan && debateFormat === "AP" && <Field label={`${activeRoles[2]} Score`}><input className={inputClass} type="number" min="50" max="100" step="0.1" value={thirdScore} onChange={(event) => setThirdScore(event.target.value)} placeholder="50-100" required /></Field>}
            <Field label="Team Rank"><select className={selectClass} value={teamRank} onChange={(event) => setTeamRank(event.target.value)}>{rankOptions.map((rank) => <option key={rank} value={rank}>{rank}</option>)}</select></Field>
            <div className="flex justify-end border-t border-black/10 pt-5 lg:col-span-2 dark:border-white/10"><PrimaryButton type="submit" disabled={submitting || (debateFormat === "BP" && !isIronMan && !teammateKey)} className="min-h-[48px] min-w-[200px] w-full rounded-2xl !bg-emerald-600 px-7 py-3 !text-white shadow-lg shadow-emerald-950/15 hover:!bg-emerald-800 focus-visible:ring-emerald-400/70 dark:!bg-emerald-600 dark:hover:!bg-emerald-800 lg:w-auto">{submitting ? "Submitting..." : "Submit Spar"}</PrimaryButton></div>
          </form>
        </Card>

        <Card className="min-w-0 self-start overflow-hidden border border-black/10 bg-white/[0.06] p-4 shadow-lg shadow-slate-950/5 dark:border-white/10 dark:bg-[#151515]/75 dark:shadow-black/20 sm:p-5">
          <div>
            <SectionHeader title="Spar Leaderboard" subtitle={leaderboard.myRank ? `Your rank: #${leaderboard.myRank.rank}` : "Recent practice rankings"} />
            {loading ? <EmptyState title="Loading" body="Fetching spar rankings." /> : leaderboard.rankings.length === 0 ? <EmptyState title="No rankings yet" body="Submit a spar to start the board." /> : <div className="space-y-2">{leaderboard.rankings.map((entry) => <div key={`${entry.userRole}:${entry.userId}`} className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/60 px-3 py-3 text-sm shadow-sm shadow-slate-950/5 dark:bg-white/[0.045]"><div className="flex h-10 w-10 items-center justify-center"><RankDoodle rank={entry.rank} /></div><div className="min-w-0"><span className="block truncate font-semibold text-slate-900 dark:text-slate-100">{entry.userName}</span><div className="text-xs text-slate-500">{entry.totalSpars} spars - streak {entry.currentStreak}</div></div><Pill tone="blue">{entry.userRole}</Pill></div>)}</div>}
          </div>
        </Card>
      </div>
      <section className="overflow-hidden rounded-[24px] border border-black/10 bg-white/[0.04] dark:border-white/10" aria-labelledby="spar-history-heading">
        <button type="button" aria-expanded={historyOpen} aria-controls="spar-history-panel" onClick={() => { const next = !historyOpen; setHistoryOpen(next); if (next && history.records.length === 0 && !historyLoading) void loadHistory(); }} className="flex min-h-[52px] w-full items-center justify-between px-4 text-left text-sm font-medium text-slate-800 transition hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 dark:text-slate-200 dark:hover:bg-white/[0.06]"><span id="spar-history-heading">{historyOpen ? "Hide Spar History" : "Show Spar History"}</span><span aria-hidden>{historyOpen ? "−" : "+"}</span></button>
        <div id="spar-history-panel" aria-hidden={!historyOpen} className={`pairing-history-panel overflow-hidden ${historyOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}`}>
          {historyOpen && <div className="border-t border-black/10 p-4 dark:border-white/10"><div className="mb-3 flex items-center justify-between"><p className="text-xs text-slate-500">Your submitted practice rounds</p>{historyError && <button type="button" onClick={() => void loadHistory()} className="text-xs font-medium text-red-700 underline dark:text-red-300">Retry</button>}</div>{historyLoading ? <EmptyState title="Loading history" body="Fetching your submitted spars." /> : historyError ? <p className="text-sm text-red-700 dark:text-red-300">{historyError}</p> : history.records.length === 0 ? <EmptyState title="No spars yet" body="Your submitted spars will appear here." /> : <div className="space-y-2">{history.records.map((record) => <div key={record.id} className="rounded-xl border border-black/10 p-3 text-sm dark:border-white/10"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="block truncate font-medium">{record.motionType}</span><span className="text-xs text-slate-500">{formatSparDate(record.sparDate)}</span></div><button type="button" onClick={() => void removeSpar(record.id)} disabled={deletingSparId !== null} aria-label={`Delete Spar from ${formatSparDate(record.sparDate)}`} title="Delete Spar" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-400/10"><span aria-hidden>{deletingSparId === record.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</span></button></div><p className="mt-1 text-xs text-slate-500">{formatSparPosition(record)} · rank {record.teamRank} · {formatSparScores(record)}</p></div>)}</div>}</div>}
        </div>
      </section>
    </div>
  );
}

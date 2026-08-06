"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  Check,
  Church,
  CircleDot,
  Globe2,
  History,
  Landmark,
  Leaf,
  Loader2,
  ListChecks,
  Medal,
  Newspaper,
  Palette,
  Scale,
  Sparkles,
  Trophy,
  UsersRound,
  VenusAndMars,
  WandSparkles,
  RefreshCw,
  Trash2,
} from "lucide-react";
import SearchableDropdown from "@/components/smoothui/components/searchable-dropdown";
import ElasticSlider from "./ElasticSlider";
import { Card, EmptyState, Field, Pill, PrimaryButton, SecondaryButton, SectionHeader } from "./ui";
import { CardSkeleton, ListSkeleton } from "./Loading";
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
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";
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
function formatSparScores(record: SparHistoryResponse["records"][number]) { return record.speakerScores.filter((score) => Number.isFinite(score.speakerScore)).map((score) => `${score.speakingRole.replace("_", " ")} ${score.speakerScore}`).join(", "); }
function formatSparPosition(record: SparHistoryResponse["records"][number]) {
  const format = record.debateFormat === "AP" ? record.apSide ? `AP ${record.apSide}` : "AP" : record.bpPosition ? `BP ${record.bpPosition}` : "BP";
  return record.isIronMan ? `${format} · Iron Man` : format;
}

function scoreNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  const hasValidPrecision = Math.abs(parsed * 10 - Math.round(parsed * 10)) <= Number.EPSILON;
  return Number.isFinite(parsed) && parsed >= 50 && parsed <= 100 && hasValidPrecision ? parsed : null;
}

function scoreValidationMessage(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 50 || parsed > 100) return "Enter a score from 50 to 100.";
  if (Math.abs(parsed * 10 - Math.round(parsed * 10)) > Number.EPSILON) return "Use score increments of 0.1.";
  return null;
}

function displayInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "D";
}

function RankDoodle({ rank }: { rank: number }) {
  return (
    <span className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full bg-primary/10 px-2 text-primary" aria-label={`rank ${rank}`}>
      {rank <= 3 ? <Trophy size={18} aria-hidden="true" /> : <Medal size={18} aria-hidden="true" />}
      {rank > 3 && <span className="text-xs font-semibold">{rank}</span>}
    </span>
  );
}

function SegmentButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>{active && <Check size={14} className="mr-1.5 inline" aria-hidden="true" />}{label}</button>;
}

function SparStatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Trophy }) {
  return <div className="rounded-2xl border border-border bg-card/70 p-3"><div className="flex items-center gap-2 text-muted-foreground"><Icon size={15} aria-hidden="true" /><span className="text-xs">{label}</span></div><p className="mt-1 text-xl font-semibold tracking-tight text-foreground">{value}</p></div>;
}

function ScoreField({
  label,
  value,
  onChange,
  fineTuneLabel,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  fineTuneLabel: string;
}) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const error = scoreValidationMessage(value);
  const sliderValue = scoreNumber(value);

  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="block text-xs font-medium text-foreground">{label}</label>
      <input
        id={inputId}
        type="number"
        min="50"
        max="100"
        step="0.1"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        required
        inputMode="decimal"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hintId}
        className={`${inputClass} mt-1 h-12 text-base font-semibold tabular-nums ${error ? "border-destructive/70 focus:border-destructive focus:ring-destructive/30" : ""}`}
        placeholder="e.g. 78.5"
      />
      <p id={error ? errorId : hintId} className={`mt-1 text-[11px] ${error ? "text-destructive" : "text-muted-foreground"}`} role={error ? "alert" : undefined}>
        {error ?? "50–100, in 0.1 increments"}
      </p>
      <div className="mt-2">
        <ElasticSlider
          value={sliderValue}
          min={50}
          max={100}
          step={0.1}
          onValueChange={(nextValue) => onChange(nextValue.toFixed(1))}
          ariaLabel={fineTuneLabel}
          error={Boolean(error)}
        />
      </div>
    </div>
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
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
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
  const summaryRows = [
    { label: "Date", value: sparDate },
    { label: "Format", value: debateFormat },
    { label: "Motion", value: selectedMotionCategory?.label },
    { label: debateFormat === "BP" ? "Position" : "Side", value: debateFormat === "BP" ? bpPosition : apSide },
    { label: "Teammate", value: isIronMan ? "Iron Man" : firstTeammate?.label },
    { label: "Role", value: isIronMan ? undefined : selectedRole },
    { label: "Score", value: firstScore },
    { label: isIronMan ? "Second score" : "Team rank", value: isIronMan ? secondScore : teamRank },
    ...(isIronMan && debateFormat === "AP" ? [{ label: "Third score", value: thirdScore }] : []),
    ...(isIronMan ? [{ label: "Team rank", value: teamRank }] : []),
  ].filter((row): row is { label: string; value: string } => Boolean(row.value && row.value !== "0"));
  const statCards = [
    leaderboard.myRank && leaderboard.myRank.rank > 0 ? { label: "Current rank", value: `#${leaderboard.myRank.rank}`, icon: Trophy } : null,
    leaderboard.myRank && leaderboard.myRank.totalSpars > 0 ? { label: "Total spars", value: String(leaderboard.myRank.totalSpars), icon: CircleDot } : null,
    leaderboard.myRank && leaderboard.myRank.currentStreak > 0 ? { label: "Practice streak", value: String(leaderboard.myRank.currentStreak), icon: Sparkles } : null,
  ].filter((stat): stat is { label: string; value: string; icon: typeof Trophy } => stat !== null);
  const visibleHistory = showAllHistory ? history.records : history.records.slice(0, 5);
  const hasMoreLoadedHistory = history.records.length > 5;

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
    void loadHistory();
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
      await Promise.all([loadSparData(), loadHistory()]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Spar submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-primary/20 bg-card/75 p-5 shadow-lg shadow-primary/5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><div className="flex items-center gap-2 text-primary"><Award size={19} aria-hidden="true" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Spar Practice</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Record the round. Learn from the next one.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Capture a real practice debate, review your performance, and keep your live practice ranking moving.</p></div><SecondaryButton type="button" disabled={loading} onClick={() => void loadSparData()}><RefreshCw size={15} className={loading ? "motion-safe:animate-spin" : ""} aria-hidden="true" /> Refresh data</SecondaryButton></div>
        {statCards.length > 0 && <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{statCards.map((stat) => <SparStatCard key={stat.label} {...stat} />)}</div>}
      </section>
      {(message || error) && <div role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"} className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-chart-3/30 bg-chart-3/10 text-chart-3"}`}>{error ?? message}</div>}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1.25fr)]">
        <Card className="min-w-0 overflow-visible p-4 sm:p-6">
          <div className="mb-6 border-b border-border pb-5">
            <SectionHeader title="Record Spar" subtitle="Build a complete practice-round record using the live validation and submission flow." />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Required fields are checked before the existing spar request is submitted.</p>
          </div>
          <form onSubmit={submit} className="grid min-w-0 gap-x-5 gap-y-5 lg:grid-cols-2">
            <div className="lg:col-span-2"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Round information</p></div>
            <Field label="Date"><input className={inputClass} type="date" value={sparDate} max={todayInputValue()} onChange={(event) => setSparDate(event.target.value)} required /></Field>
            <Field label="Debate format"><div className="flex min-h-11 gap-1 rounded-xl border border-border bg-muted/50 p-1"><SegmentButton label="BP" active={debateFormat === "BP"} onClick={() => { setDebateFormat("BP"); setIsIronMan(false); setTeammateKey(""); }} /><SegmentButton label="AP" active={debateFormat === "AP"} onClick={() => { setDebateFormat("AP"); setIsIronMan(false); setTeammateKey(""); }} /></div></Field>
            <div className="space-y-3 lg:col-span-2"><Field label="Motion"><SearchableDropdown emptyMessage="No motions found" items={motionOptions} label="Select a motion" placeholder="Search motions…" value={motionType} onSelect={(item) => setMotionType(item.id)} /></Field>{selectedMotionCategory && <p aria-live="polite" className="text-xs text-muted-foreground">Selected category: <span className="font-semibold text-foreground">{selectedMotionCategory.label}</span> · {selectedMotionCategory.description}</p>}</div>
            <div className="pt-1 lg:col-span-2"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Debate information</p></div>
            <Field label={debateFormat === "BP" ? "BP position" : "AP side"}><div className="flex min-h-11 flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-1">{(debateFormat === "BP" ? benchPositions : ["GOV", "OPP"] as const).map((option) => <SegmentButton key={option} label={option} active={(debateFormat === "BP" ? bpPosition : apSide) === option} onClick={() => debateFormat === "BP" ? setBpPosition(option as typeof bpPosition) : setApSide(option as ApSide)} />)}</div></Field>
            <Field label={debateFormat === "AP" ? "Teammate 1" : "Teammate"}>
              <SearchableDropdown
                emptyMessage="No teammates found"
                items={teammateDropdownItems}
                label={debateFormat === "AP" ? "Teammate 1" : "Teammate"}
                placeholder={debateFormat === "AP" ? "Solo / no teammate" : "Search teammates…"}
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
            {debateFormat === "AP" && !isIronMan && teammateOptions.length > 0 && <Field label="Teammate 2">
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
            {!isIronMan && <Field label="Speaking role"><div className="flex min-h-11 flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-1">{activeRoles.map((role) => <SegmentButton key={role} label={role.replace("_", " ")} active={selectedRole === role} onClick={() => setSelectedRole(role)} />)}</div></Field>}
            <div className="pt-1 lg:col-span-2"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Performance</p></div>
            <div className="lg:col-span-2"><ScoreField label={isIronMan ? `${activeRoles[0]} score` : "Speaker score"} value={firstScore} onChange={setFirstScore} fineTuneLabel={isIronMan ? `${activeRoles[0]} score` : "Speaker score"} /></div>
            {isIronMan && <div><ScoreField key={`second-score-${activeRoles[1]}`} label={`${activeRoles[1]} score`} value={secondScore} onChange={setSecondScore} fineTuneLabel={`${activeRoles[1]} score`} /></div>}
            {isIronMan && debateFormat === "AP" && <div><ScoreField key={`third-score-${activeRoles[2]}`} label={`${activeRoles[2]} score`} value={thirdScore} onChange={setThirdScore} fineTuneLabel={`${activeRoles[2]} score`} /></div>}
            <Field label="Team rank"><select className={selectClass} value={teamRank} onChange={(event) => setTeamRank(event.target.value)}>{rankOptions.map((rank) => <option key={rank} value={rank}>{rank}</option>)}</select></Field>
            <div className="lg:col-span-2"><div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 text-primary"><ListChecks size={16} aria-hidden="true" /><h3 className="text-sm font-semibold">Review summary</h3></div>{summaryRows.length > 0 ? <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">{summaryRows.map((row) => <div key={row.label} className="min-w-0"><dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{row.label}</dt><dd className="truncate text-sm font-medium text-foreground">{row.value}</dd></div>)}</dl> : <p className="mt-2 text-xs text-muted-foreground">Complete the round details to review the submission.</p>}</div></div>
            <div className="sticky bottom-2 z-10 -mx-1 flex justify-end border-t border-border bg-card/95 px-1 pt-5 backdrop-blur lg:col-span-2"><PrimaryButton type="submit" variant="success" disabled={submitting || (debateFormat === "BP" && !isIronMan && !teammateKey)} className="min-h-[48px] w-full rounded-2xl !bg-chart-3 px-7 py-3 !text-white shadow-lg shadow-chart-3/20 hover:brightness-90 focus-visible:ring-chart-3 sm:w-auto">{submitting ? <><Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> Recording…</> : <><Sparkles size={16} aria-hidden="true" /> Record Spar</>}</PrimaryButton></div>
          </form>
        </Card>

        <Card className="min-w-0 self-start p-4 sm:p-5"><SectionHeader title="Practice leaderboard" subtitle={leaderboard.myRank ? `Your current rank: #${leaderboard.myRank.rank}` : "Current all-practice ranking"} />{loading ? <CardSkeleton lines={4} /> : leaderboard.rankings.length === 0 ? <EmptyState title="No rankings yet" body="Record a spar to create the first live practice ranking." /> : <div className="space-y-2">{leaderboard.rankings.map((entry) => <div key={`${entry.userRole}:${entry.userId}`} className="rounded-2xl border border-border bg-muted/35 p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transform-none"><div className="flex min-w-0 items-center gap-3"><RankDoodle rank={entry.rank} /><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden="true">{displayInitials(entry.userName)}</div><div className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{entry.userName}</span>{(entry.totalSpars > 0 || entry.currentStreak > 0) && <span className="mt-0.5 block text-xs text-muted-foreground">{entry.totalSpars > 0 ? `${entry.totalSpars} practice rounds` : ""}{entry.currentStreak > 0 ? ` · ${entry.currentStreak} round streak` : ""}</span>}</div><Pill tone="blue">{entry.userRole}</Pill></div></div>)}</div>}</Card>
      </div>
      <section className="rounded-[24px] border border-border bg-card/70 p-4 sm:p-5" aria-labelledby="spar-history-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><History size={18} className="text-primary" aria-hidden="true" /><div><h2 id="spar-history-heading" className="text-lg font-semibold text-foreground">Recent Spar History</h2><p className="mt-0.5 text-sm text-muted-foreground">Your submitted practice rounds, newest first.</p></div></div>{hasMoreLoadedHistory && <SecondaryButton type="button" onClick={() => setShowAllHistory((current) => !current)} className="min-h-10 px-3 text-xs">{showAllHistory ? "Show recent" : "View all loaded"}</SecondaryButton>}</div>{historyLoading ? <div className="mt-4"><ListSkeleton count={3} /></div> : historyError ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert"><span>{historyError}</span><SecondaryButton type="button" onClick={() => void loadHistory()} className="min-h-10 px-3 text-xs"><RefreshCw size={14} aria-hidden="true" /> Retry</SecondaryButton></div> : history.records.length === 0 ? <div className="mt-4"><EmptyState title="No spars recorded yet" body="Record your first practice debate to start tracking your improvement." /></div> : <div className="mt-4 grid gap-3 md:grid-cols-2">{visibleHistory.map((record) => <article key={record.id} className="rounded-2xl border border-border bg-muted/30 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{record.motionType}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays size={13} aria-hidden="true" /> {formatSparDate(record.sparDate)}</p></div><button type="button" onClick={() => void removeSpar(record.id)} disabled={deletingSparId !== null} aria-label={`Delete Spar from ${formatSparDate(record.sparDate)}`} title="Delete Spar" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"><span aria-hidden="true">{deletingSparId === record.id ? <Loader2 size={16} className="motion-safe:animate-spin" /> : <Trash2 size={16} />}</span></button></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Format</dt><dd className="mt-0.5 font-medium text-foreground">{formatSparPosition(record)}</dd></div>{formatSparScores(record) && <div><dt className="text-muted-foreground">Scores</dt><dd className="mt-0.5 font-medium text-foreground">{formatSparScores(record)}</dd></div>}<div><dt className="text-muted-foreground">Team rank</dt><dd className="mt-0.5 font-medium text-foreground">{record.teamRank}</dd></div></dl></article>)}</div>}</section>
    </div>
  );
}

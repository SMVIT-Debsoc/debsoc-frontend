"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Crown,
  Gauge,
  Gavel,
  Mic2,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Target,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import { Card, EmptyState, PrimaryButton, SecondaryButton } from "./ui";
import type { Participant, ProgressProfile, ProgressSummary } from "./types";
import DebsocOverlayScrollbar from "./DebsocOverlayScrollbar";

type RosterProps = {
  participants: Participant[];
  progressSummaries: ProgressSummary[];
  loading: boolean;
  error: string | null;
};

type ProfileTab = "overview" | "strengths" | "performance";
type RoleFilter = "all" | "Member" | "Cabinet" | "Speaker" | "Adjudicator" | "Chair";
type SortMode = "active" | "alphabetical";

export default function Roster({ participants, progressSummaries, loading, error }: RosterProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("active");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProgressProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileRetry, setProfileRetry] = useState(0);
  const [profileTab, setProfileTab] = useState<ProfileTab>("overview");

  const progressByParticipantId = useMemo(() => new Map(progressSummaries.map((summary) => [summary.participantId, summary])), [progressSummaries]);
  const visibleParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = participants.filter((participant) => {
      if (!participant.isVerified) return false;
      if (query && !participant.name.toLowerCase().includes(query)) return false;
      const summary = progressByParticipantId.get(participant.id);
      if (roleFilter === "Member" || roleFilter === "Cabinet") return participant.account === roleFilter;
      if (roleFilter === "Speaker") return Boolean(summary?.sessionsSpoken);
      if (roleFilter === "Adjudicator") return Boolean(summary?.sessionsAdjudicated);
      if (roleFilter === "Chair") return Boolean(summary?.sessionsChaired);
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortMode === "alphabetical") return a.name.localeCompare(b.name);
      const activity = (progressByParticipantId.get(b.id)?.sessionsSpoken ?? 0) + (progressByParticipantId.get(b.id)?.sessionsAdjudicated ?? 0) + (progressByParticipantId.get(b.id)?.sessionsChaired ?? 0);
      const otherActivity = (progressByParticipantId.get(a.id)?.sessionsSpoken ?? 0) + (progressByParticipantId.get(a.id)?.sessionsAdjudicated ?? 0) + (progressByParticipantId.get(a.id)?.sessionsChaired ?? 0);
      return activity - otherActivity || a.name.localeCompare(b.name);
    });
  }, [participants, progressByParticipantId, roleFilter, search, sortMode]);

  const selectedParticipant = selectedParticipantId ? participants.find((participant) => participant.id === selectedParticipantId) ?? null : null;

  useEffect(() => {
    if (!selectedParticipantId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setProfileLoading(true);
      setProfileError(null);
      setSelectedProfile(null);
      fetch(`/api/progress/members/${selectedParticipantId}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("profile-request-failed");
          return (await response.json()) as ProgressProfile;
        })
        .then((profile) => {
          if (!controller.signal.aborted) setSelectedProfile(profile);
        })
        .catch(() => {
          if (!controller.signal.aborted) setProfileError("Couldn’t load this profile. Try again.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setProfileLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [profileRetry, selectedParticipantId]);

  useEffect(() => {
    if (!selectedParticipantId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProfile();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedParticipantId]);

  function openProfile(participantId: string) {
    setProfileTab("overview");
    setProfileRetry(0);
    setSelectedProfile(null);
    setProfileError(null);
    setSelectedParticipantId(participantId);
  }

  function closeProfile() {
    setSelectedParticipantId(null);
    setSelectedProfile(null);
    setProfileError(null);
  }

  if (loading) return <EmptyState title="Loading members" body="Fetching live member and cabinet records." />;
  if (error) return <EmptyState title="Members unavailable" body="We couldn’t load the member directory. Try again in a moment." />;

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Debate community</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Members & Cabinet</h1><p className="mt-1 text-sm text-muted-foreground">Meet the people building their debate practice inside DebSoc.</p></div><span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Users size={16} aria-hidden="true" /> {visibleParticipants.length} visible profiles</span></div>
      <Card className="p-3 sm:p-4"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]"><label className="relative block min-w-0"><span className="sr-only">Search members</span><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members" className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25" /></label><label className="min-w-0"><span className="sr-only">Filter members</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"><option value="all">All profiles</option><option value="Member">Member</option><option value="Cabinet">Cabinet</option><option value="Speaker">Speaker</option><option value="Adjudicator">Adjudicator</option><option value="Chair">Chair</option></select></label><label className="min-w-0"><span className="sr-only">Sort members</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"><option value="active">Most Active</option><option value="alphabetical">Alphabetical</option></select></label></div></Card>
      {visibleParticipants.length === 0 ? <ProfileEmptyState title="No matching members" body="Try a different search or filter." /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleParticipants.map((participant) => <MemberCard key={participant.id} participant={participant} summary={progressByParticipantId.get(participant.id)} onView={() => openProfile(participant.id)} />)}</div>}
      {selectedParticipantId && typeof document !== "undefined" && createPortal(<ProfileDialog participant={selectedParticipant} profile={selectedProfile} loading={profileLoading} error={profileError} tab={profileTab} onTabChange={setProfileTab} onRetry={() => setProfileRetry((value) => value + 1)} onClose={closeProfile} />, document.body)}
    </div>
  );
}

function MemberCard({ participant, summary, onView }: { participant: Participant; summary?: ProgressSummary; onView: () => void }) {
  const activity = summary ? summary.sessionsSpoken + summary.sessionsAdjudicated + summary.sessionsChaired : 0;
  return <Card className="flex min-h-[210px] min-w-0 flex-col p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none sm:p-5"><div className="flex items-start gap-3"><ProfileAvatar name={participant.name} seed={participant.id} className="h-11 w-11 shrink-0" initialsClassName="text-sm" /><div className="min-w-0 flex-1"><h2 className="truncate text-base font-semibold text-foreground">{participant.name}</h2><RoleBadge account={participant.account} /></div></div>{activity > 0 ? <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Activity size={15} className="text-primary" aria-hidden="true" /> {activity} debate {activity === 1 ? "session" : "sessions"} recorded</p> : <p className="mt-5 text-sm text-muted-foreground">No practice history available yet.</p>}{summary?.sessionsSpoken ? <p className="mt-2 text-xs text-muted-foreground">{summary.sessionsSpoken} speaking {summary.sessionsSpoken === 1 ? "round" : "rounds"}</p> : null}{summary?.sessionsChaired ? <p className="mt-1 text-xs text-muted-foreground">{summary.sessionsChaired} chaired {summary.sessionsChaired === 1 ? "session" : "sessions"}</p> : null}<PrimaryButton type="button" onClick={onView} className="mt-auto w-full">View Profile</PrimaryButton></Card>;
}

function RoleBadge({ account }: { account: Participant["account"] }) {
  const Icon = account === "President" ? Crown : account === "Cabinet" ? ShieldCheck : User;
  return <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"><Icon size={13} aria-hidden="true" />{account}</span>;
}

function ProfileDialog({ participant, profile, loading, error, tab, onTabChange, onRetry, onClose }: { participant: Participant | null; profile: ProgressProfile | null; loading: boolean; error: string | null; tab: ProfileTab; onTabChange: (tab: ProfileTab) => void; onRetry: () => void; onClose: () => void }) {
  const attendance = profile && profile.attendance.totalCount > 0 ? profile.attendance : null;
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={onClose}><div className="flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border border-border bg-card text-foreground shadow-2xl sm:max-h-[88vh] sm:rounded-[28px]" role="dialog" aria-modal="true" aria-labelledby="member-profile-title" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6"><div className="flex min-w-0 items-center gap-3"><ProfileAvatar name={participant?.name ?? "Member"} seed={participant?.id ?? "profile"} className="h-12 w-12 shrink-0" initialsClassName="text-base" /><div className="min-w-0"><h2 id="member-profile-title" className="truncate text-xl font-semibold">{participant?.name ?? "Member profile"}</h2><div className="mt-1 flex flex-wrap items-center gap-2"><RoleBadge account={participant?.account ?? "Member"} />{attendance && <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/15 px-2.5 py-1 text-xs font-medium text-chart-3"><CalendarCheck2 size={13} aria-hidden="true" /> {attendance.attendancePercentage}% attendance</span>}</div></div></div><button type="button" onClick={onClose} aria-label="Close member profile" title="Close" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X size={18} aria-hidden="true" /></button></header><nav className="flex gap-1 border-b border-border px-4 pt-2" aria-label="Member profile sections">{([ ["overview", "Overview"], ["strengths", "Strengths"], ["performance", "Performance"] ] as const).map(([key, label]) => <button key={key} type="button" onClick={() => onTabChange(key)} aria-current={tab === key ? "page" : undefined} className={`relative min-h-11 rounded-t-xl px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${tab === key ? "text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{label}{tab === key && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />}</button>)}</nav><DebsocOverlayScrollbar className="min-h-0 flex-1" contentStyle={{ padding: "1.25rem" }}>{loading ? <ProfileEmptyState title="Loading profile" body="Fetching this member’s real debate progress." /> : error ? <div className="flex min-h-48 flex-col items-center justify-center text-center"><p role="alert" className="text-sm text-destructive">{error}</p><SecondaryButton type="button" onClick={onRetry} className="mt-4">Try again</SecondaryButton></div> : profile ? tab === "overview" ? <OverviewTab profile={profile} /> : tab === "strengths" ? <StrengthsTab profile={profile} /> : <PerformanceTab profile={profile} /> : <ProfileEmptyState title="No profile data yet" body="Participate in debates to start building this profile." />}</DebsocOverlayScrollbar></div></div>;
}

function OverviewTab({ profile }: { profile: ProgressProfile }) {
  const summary = profile.summary;
  const cards: Array<{ label: string; value: string | number; icon: LucideIcon; helper?: string }> = [];
  if (profile.attendance.totalCount > 0) cards.push({ label: "Attendance", value: `${profile.attendance.attendancePercentage}%`, icon: CalendarCheck2, helper: `${profile.attendance.presentCount} sessions joined` });
  if (summary.sessionsSpoken > 0) cards.push({ label: "Sessions Spoken", value: summary.sessionsSpoken, icon: Mic2 });
  if (summary.sessionsAdjudicated > 0) cards.push({ label: "Sessions Judged", value: summary.sessionsAdjudicated, icon: Gavel });
  if (summary.sessionsChaired > 0) cards.push({ label: "Sessions Chaired", value: summary.sessionsChaired, icon: ShieldCheck });
  if (summary.scoredSpeakerSessions > 0) cards.push({ label: "Average Speaker Score", value: (summary.speakerTotalScore / summary.scoredSpeakerSessions).toFixed(1), icon: Trophy });
  if (summary.speakerStrength > 0) cards.push({ label: "Speaking Confidence", value: summary.speakerStrength.toFixed(2), icon: Gauge });
  if (cards.length === 0) return <ProfileEmptyState title="No overview data yet" body="Join and complete debate sessions to build your profile." />;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <MetricCard key={card.label} {...card} />)}</div>;
}

function StrengthsTab({ profile }: { profile: ProgressProfile }) {
  const groups = [{ title: "Strengths", icon: Sparkles, items: profile.verdict.strengths }, { title: "Things Improving", icon: Activity, items: profile.verdict.weaknesses }, { title: "Practice Opportunities", icon: Target, items: profile.verdict.gaps }, { title: "Favourite Roles", icon: Users, items: profile.verdict.roleAptitude }, { title: "Pairing Compatibility", icon: CheckCircle2, items: profile.verdict.compatibility }].filter((group) => group.items.length > 0);
  if (groups.length === 0) return <ProfileEmptyState title="No strengths yet" body="Complete more debate activity to unlock meaningful profile insights." />;
  return <div className="grid gap-4 md:grid-cols-2">{groups.map((group) => <StrengthCard key={group.title} title={group.title} icon={group.icon} items={group.items} />)}</div>;
}

function PerformanceTab({ profile }: { profile: ProgressProfile }) {
  const motionRows = profile.motionTypeScores.filter((row) => row.observationCount > 0).map((row) => ({ label: row.motionType, score: row.score, observations: row.observationCount }));
  const roleRows = profile.roleScores.filter((row) => row.observationCount > 0).map((row) => ({ label: friendlyRole(row.role), score: row.score, observations: row.observationCount }));
  if (motionRows.length === 0 && roleRows.length === 0) return <ProfileEmptyState title="No performance data available yet" body="Participate in scored debate sessions to start building performance history." />;
  return <div className="grid gap-4 md:grid-cols-2">{motionRows.length > 0 && <PerformanceCard title="Best Motion Categories" icon={BarChart3} rows={motionRows} />}{roleRows.length > 0 && <PerformanceCard title="Preferred Roles" icon={Mic2} rows={roleRows} />}</div>;
}

function MetricCard({ label, value, icon: Icon, helper }: { label: string; value: string | number; icon: LucideIcon; helper?: string }) {
  return <div className="rounded-2xl border border-border bg-muted/35 p-4"><Icon size={18} className="text-primary" aria-hidden="true" /><p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>{helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}</div>;
}

function StrengthCard({ title, icon: Icon, items }: { title: string; icon: LucideIcon; items: string[] }) {
  return <article className="rounded-2xl border border-border bg-muted/25 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon size={16} className="text-primary" aria-hidden="true" />{title}</h3><ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm leading-5 text-muted-foreground">{item}</li>)}</ul></article>;
}

function PerformanceCard({ title, icon: Icon, rows }: { title: string; icon: LucideIcon; rows: Array<{ label: string; score: number; observations: number }> }) {
  const maxScore = Math.max(...rows.map((row) => row.score), 1);
  return <section className="rounded-2xl border border-border bg-muted/25 p-4" aria-labelledby={`performance-${title}`}><h3 id={`performance-${title}`} className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon size={16} className="text-primary" aria-hidden="true" />{title}</h3><p className="mt-1 text-xs text-muted-foreground">Scores from completed observations.</p><ul className="mt-4 space-y-4" aria-label={title}>{rows.map((row) => <li key={row.label}><div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-foreground">{row.label}</span><span className="shrink-0 font-medium tabular-nums text-muted-foreground">{row.score.toFixed(1)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.max(0, Math.min(100, (row.score / maxScore) * 100))}%` }} /></div><p className="mt-1 text-[11px] text-muted-foreground">{row.observations} {row.observations === 1 ? "observation" : "observations"}</p></li>)}</ul></section>;
}

function ProfileEmptyState({ title, body }: { title: string; body: string }) {
  return <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><User size={19} aria-hidden="true" /></span><h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p></div>;
}

function friendlyRole(role: string) {
  const labels: Record<string, string> = { PM: "Prime Minister", DPM: "Deputy Prime Minister", LO: "Leader of Opposition", DLO: "Deputy Leader of Opposition", MG: "Member of Government", GW: "Government Whip", MO: "Member of Opposition", OW: "Opposition Whip" };
  return labels[role] ?? role;
}

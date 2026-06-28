"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Users,
  ListChecks,
  Wand2,
  Send,
  ClipboardList,
  RefreshCw,
  Check,
  Star,
  AlertTriangle,
  ChevronDown,
  Crown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  initialAttendance,
  findParticipant,
  sampleProposal,
  scoringStatus,
} from "./mock";
import type {
  AttendanceEntry,
  Objective,
  Proposal,
  SessionRole,
} from "./mock";
import {
  Card,
  ConfidenceDots,
  Field,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StateBadge,
} from "./ui";

type StepKey = "prepare" | "setup" | "review" | "publish" | "post";
const STEPS: { key: StepKey; label: string }[] = [
  { key: "prepare", label: "Prepare" },
  { key: "setup", label: "Setup" },
  { key: "review", label: "Generate & Review" },
  { key: "publish", label: "Publish" },
  { key: "post", label: "Post-session" },
];

export default function SessionWorkspace() {
  const [step, setStep] = useState<StepKey>("prepare");
  const [attendance, setAttendance] =
    useState<AttendanceEntry[]>(initialAttendance);

  const [motionType, setMotionType] = useState("IR");
  const [motionText, setMotionText] = useState(
    "This House would tax large language model providers per query."
  );
  const [objective, setObjective] = useState<Objective>("BALANCED");

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [generating, setGenerating] = useState(false);

  const [published, setPublished] = useState(false);

  const counts = useMemo(() => countRoles(attendance), [attendance]);

  const lifecycleState = published
    ? "Published"
    : proposal?.status === "Approved"
    ? "Approved"
    : proposal
    ? "Generated"
    : "Preparation";

  const unlockedState: Record<StepKey, boolean> = {
    prepare: true,
    setup: counts.speakers > 0,
    review: counts.speakers >= 8 && counts.adjudicators >= 1,
    publish: !!proposal && proposal.status !== "Generated" ? true : !!proposal && proposal.status === "Approved",
    post: published,
  };

  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const prevStep = STEPS[currentIndex - 1];
  const nextStep = STEPS[currentIndex + 1];
  const canGoNext = nextStep && unlockedState[nextStep.key as StepKey];

  return (
    <div className="pb-28">
      <SectionHeader
        title="Session Workspace"
        subtitle="27 Jun 2026"
        right={<StateBadge state={lifecycleState} />}
      />



      <div className="mt-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {step === "prepare" && (
              <Prepare attendance={attendance} setAttendance={setAttendance} />
            )}
            {step === "setup" && (
              <Setup
                motionType={motionType}
                setMotionType={setMotionType}
                motionText={motionText}
                setMotionText={setMotionText}
                objective={objective}
                setObjective={setObjective}
              />
            )}
            {step === "review" && (
              <Review
                proposal={proposal}
                setProposal={setProposal}
                generating={generating}
                onGenerate={() => {
                  setGenerating(true);
                  setTimeout(() => {
                    setProposal({ ...sampleProposal, status: "Generated" });
                    setGenerating(false);
                  }, 700);
                }}
                objective={objective}
              />
            )}
            {step === "publish" && (
              <Publish
                proposal={proposal}
                published={published}
                onPublish={() => setPublished(true)}
                onBackToReview={() => setStep("review")}
              />
            )}
            {step === "post" && <PostSession />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 py-5 px-4 border-t border-slate-200 flex items-center justify-center gap-4 bg-white/95 backdrop-blur-md shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        {prevStep && (
          <SecondaryButton onClick={() => setStep(prevStep.key)} className="px-6 py-2.5 text-base">
            Previous
          </SecondaryButton>
        )}
        {nextStep && (
          <PrimaryButton
            onClick={() => setStep(nextStep.key)}
            disabled={!canGoNext}
            className="px-10 py-2.5 text-base shadow-md font-semibold"
          >
            Next step
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}


// ── Step 1: Prepare ──────────────────────────────────────────────────────
function countRoles(rows: AttendanceEntry[]) {
  const speakers = rows.filter((r) => r.present && r.role === "Speaker").length;
  const adjudicators = rows.filter(
    (r) => r.present && r.role === "Adjudicator"
  ).length;
  const rooms = Math.floor(speakers / 8);
  const leftover = speakers % 8;
  const adjCovers = adjudicators >= rooms; // need ≥1 per room
  return { speakers, adjudicators, rooms, leftover, adjCovers };
}

function Prepare({
  attendance,
  setAttendance,
}: {
  attendance: AttendanceEntry[];
  setAttendance: (rows: AttendanceEntry[]) => void;
}) {
  const counts = countRoles(attendance);
  const [modalRole, setModalRole] = useState<SessionRole | null>(null);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-4 flex flex-col gap-4">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <Users size={16} /> Mark present & assign session role
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => setModalRole("Speaker")}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-slate-700 hover:text-blue-700 group"
          >
            <div className="bg-slate-100 group-hover:bg-blue-100 p-3 rounded-full mb-3 transition-colors">
              <Users size={24} className="text-slate-500 group-hover:text-blue-600" />
            </div>
            <span className="font-semibold text-lg">Select Speakers</span>
            <span className="text-sm text-slate-500 group-hover:text-blue-500 mt-1">
              {counts.speakers} selected
            </span>
          </button>

          <button 
            type="button"
            onClick={() => setModalRole("Adjudicator")}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all text-slate-700 hover:text-amber-700 group"
          >
            <div className="bg-slate-100 group-hover:bg-amber-100 p-3 rounded-full mb-3 transition-colors">
              <ClipboardList size={24} className="text-slate-500 group-hover:text-amber-600" />
            </div>
            <span className="font-semibold text-lg">Select Adjudicators</span>
            <span className="text-sm text-slate-500 group-hover:text-amber-500 mt-1">
              {counts.adjudicators} selected
            </span>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
           <h4 className="text-sm font-medium text-slate-700 mb-3">Current Roster Preview</h4>
           <div className="flex flex-col gap-2">
              <div className="text-sm">
                <span className="font-medium text-slate-900">Speakers:</span>{" "}
                <span className="text-slate-600">
                  {attendance.filter(r => r.present && r.role === "Speaker").length > 0 
                    ? attendance.filter(r => r.present && r.role === "Speaker").map(r => findParticipant(r.participantId)?.name).join(", ")
                    : "None selected"}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-slate-900">Adjudicators:</span>{" "}
                <span className="text-slate-600">
                  {attendance.filter(r => r.present && r.role === "Adjudicator").length > 0 
                    ? attendance.filter(r => r.present && r.role === "Adjudicator").map(r => findParticipant(r.participantId)?.name).join(", ")
                    : "None selected"}
                </span>
              </div>
           </div>
        </div>
      </Card>

      <Card className="p-4 h-fit">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <ListChecks size={16} /> Feasibility
        </h3>
        <div className="space-y-2 text-sm">
          <Row label="Speakers" value={counts.speakers} />
          <Row label="Adjudicators" value={counts.adjudicators} />
          <Row
            label="Rooms (floor(speakers/8))"
            value={counts.rooms}
            hint="Each room needs 8 speakers + ≥1 adjudicator + exactly 1 chair."
          />
          <Row
            label="Leftover speakers"
            value={counts.leftover}
            warn={counts.leftover > 0}
          />
          <Row
            label="Adjudicator coverage"
            value={counts.adjCovers ? "OK" : "Not enough"}
            warn={!counts.adjCovers}
          />
        </div>
        <p className="text-[12px] text-slate-500 mt-3 leading-snug">
          Fix the pool here — generation will fail explicitly if rooms can&apos;t form.
        </p>
      </Card>

      <SelectionModal
        isOpen={!!modalRole}
        onClose={() => setModalRole(null)}
        title={modalRole ? `Select ${modalRole}s` : ""}
        role={modalRole}
        attendance={attendance}
        setAttendance={setAttendance}
      />
    </div>
  );
}

function SelectionModal({
  isOpen,
  onClose,
  title,
  role,
  attendance,
  setAttendance,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  role: SessionRole | null;
  attendance: AttendanceEntry[];
  setAttendance: (rows: AttendanceEntry[]) => void;
}) {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleParticipant = (id: string) => {
    setAttendance(
      attendance.map((r) => {
        if (r.participantId === id) {
          if (r.role === role && r.present) {
            return { ...r, present: false, role: null };
          } else {
            return { ...r, present: true, role };
          }
        }
        return r;
      })
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1.5">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search name…"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 bg-slate-50/30">
              <div className="space-y-2">
                {attendance
                  .map((row) => ({ row, p: findParticipant(row.participantId)! }))
                  .filter(({ p }) => p.name.toLowerCase().includes(filter.toLowerCase()))
                  .map(({ row, p }) => {
                    const isSelected = row.present && row.role === role;
                    const isOtherRole = row.present && row.role !== null && row.role !== role;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 border border-slate-200 bg-white rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer" onClick={() => toggleParticipant(p.id)}>
                        <div>
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.account}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isOtherRole && (
                             <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                               Currently {row.role}
                             </span>
                          )}
                          <input type="checkbox" checked={isSelected} readOnly className="h-4 w-4 text-blue-600 rounded border-slate-300 cursor-pointer pointer-events-none" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end bg-white">
              <PrimaryButton onClick={onClose}>Done</PrimaryButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: number | string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-slate-600">
        <div>{label}</div>
        {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
      </div>
      <div
        className={`font-semibold ${
          warn ? "text-amber-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ── Step 2: Setup ────────────────────────────────────────────────────────
function Setup({
  motionType,
  setMotionType,
  motionText,
  setMotionText,
  objective,
  setObjective,
}: {
  motionType: string;
  setMotionType: (s: string) => void;
  motionText: string;
  setMotionText: (s: string) => void;
  objective: Objective;
  setObjective: (o: Objective) => void;
}) {
  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-4">Session inputs</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Motion type">
          <select
            value={motionType}
            onChange={(e) => setMotionType(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          >
            {["IR", "Policy", "Moral", "Economy", "Feminism", "Finance"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pairing objective" hint="Shifts engine weighting via multipliers.">
          <div className="flex gap-2">
            {(["DEVELOPMENT", "BALANCED", "COMPETITIVE"] as Objective[]).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setObjective(o)}
                className={`flex-1 text-sm py-2 rounded-md border ${
                  objective === o
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {o[0] + o.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Motion">
          <textarea
            value={motionText}
            onChange={(e) => setMotionText(e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </Field>
        <Field
          label="Session-only inputs (optional)"
          hint="Strict = hard rule; soft = high-priority preference."
        >
          <div className="text-sm text-slate-600 space-y-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Time constraint (member leaves early)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Event team-up (lock A and B together)
            </label>
          </div>
        </Field>
      </div>
    </Card>
  );
}

// ── Step 3: Generate & Review ────────────────────────────────────────────
function Review({
  proposal,
  setProposal,
  generating,
  onGenerate,
  objective,
}: {
  proposal: Proposal | null;
  setProposal: (p: Proposal) => void;
  generating: boolean;
  onGenerate: () => void;
  objective: Objective;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [rating, setRating] = useState(0);

  if (!proposal) {
    return (
      <Card className="p-6 text-center">
        <Wand2 className="mx-auto text-slate-400" size={28} />
        <p className="mt-3 text-slate-700 font-medium">No proposal yet.</p>
        <p className="text-sm text-slate-500 mb-4">
          Engine objective is <strong>{objective}</strong>. Generation explores many
          candidates, scores them, keeps the top 5, and picks one with weighted
          randomness.
        </p>
        <PrimaryButton onClick={onGenerate} disabled={generating}>
          {generating ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Generate proposal
            </>
          )}
        </PrimaryButton>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-900">
              Proposal v{proposal.version}
            </div>
            <div className="text-sm text-slate-500">
              Top-band rank {proposal.topBandRank} of {proposal.topBandSize} ·
              objective {proposal.objective} · score{" "}
              {proposal.proposalScore.toFixed(2)}
              <button
                type="button"
                onClick={() => setShowBreakdown((v) => !v)}
                className="ml-2 text-blue-700 hover:underline"
              >
                Score breakdown {showBreakdown ? "▴" : "▾"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              onClick={() =>
                setProposal({ ...proposal, status: "Approved" })
              }
              disabled={proposal.status === "Approved"}
            >
              <Check size={16} />
              {proposal.status === "Approved" ? "Approved" : "Approve"}
            </PrimaryButton>
            <SecondaryButton onClick={() => alert("Override editor not built in this concept UI.")}>
              Override
            </SecondaryButton>
            <SecondaryButton onClick={onGenerate}>
              <RefreshCw size={16} />
              Regenerate
            </SecondaryButton>
          </div>
        </div>

        {showBreakdown && (
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <BreakdownRow label="Room balance" value={0.83} />
            <BreakdownRow label="Adjudicator avg" value={0.74} />
            <BreakdownRow label="Chair score" value={0.81} />
            <BreakdownRow label="Team quality (agg)" value={0.78} />
            <BreakdownRow label="Experience distribution" value={0.71} />
            <BreakdownRow label="Repetition penalty" value={-0.04} />
          </div>
        )}
      </Card>

      {/* Rooms */}
      <div className="grid lg:grid-cols-2 gap-4">
        {proposal.rooms.map((room) => (
          <Card key={room.index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Room {room.index}</div>
              <div className="text-xs text-slate-500">
                balance {room.balanceScore.toFixed(2)} · difficulty{" "}
                {room.difficulty.toFixed(2)}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {room.teams.map((team) => (
                <div
                  key={team.bench}
                  className="border border-slate-200 rounded-md p-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{team.bench}</div>
                    <div className="text-xs text-slate-500">
                      team {team.score.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-slate-700">
                    {team.speakers
                      .map(
                        (s) =>
                          `${findParticipant(s.participantId)?.name} (${s.role})`
                      )
                      .join(" · ")}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={14} className="text-amber-600" />
                <span className="font-medium">Chair:</span>
                {(() => {
                  const chair = room.adjudicators.find((a) => a.isChair);
                  if (!chair) return " —";
                  return ` ${findParticipant(chair.participantId)?.name} (${chair.chairAssignmentScore?.toFixed(
                    2
                  )})`;
                })()}
              </div>
              <div className="text-slate-700">
                <span className="font-medium">Panel:</span>{" "}
                {room.adjudicators
                  .filter((a) => !a.isChair)
                  .map((a) => findParticipant(a.participantId)?.name)
                  .join(", ") || "—"}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Leftovers + reserves + rating */}
      <Card className="p-4">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-slate-900">
              Leftover & reserves
            </div>
            <div className="text-slate-600">
              Unassigned (kept visible, never silently dropped):{" "}
              {proposal.unassigned.length} ·{" "}
              Reserves: {proposal.reserves.length}
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium mb-1">Unassigned</div>
            <ul className="text-slate-700 space-y-0.5">
              {proposal.unassigned.map((u) => (
                <li key={u.participantId}>
                  • {findParticipant(u.participantId)?.name}{" "}
                  <span className="text-slate-400">({u.reason})</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">
              Resolve options
              <span className="text-xs font-normal text-slate-500 ml-1">
                (then regenerate)
              </span>
            </div>
            <ul className="text-slate-700 space-y-0.5">
              <li>• Convert some speakers → adjudicators</li>
              <li>• Add more speakers</li>
              <li>• Remove some speakers</li>
              <li>• Accept a revised room count</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm">
            <div className="font-medium">Rate this proposal</div>
            <div className="text-slate-500">
              Helps the engine learn (stored for batch tuning, not applied
              immediately).
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={n <= rating ? "text-amber-500" : "text-slate-300"}
                aria-label={`${n} star`}
              >
                <Star size={20} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-1.5">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium">
        {value >= 0 ? value.toFixed(2) : value.toFixed(2)}
      </span>
    </div>
  );
}

// ── Step 4: Publish ──────────────────────────────────────────────────────
function Publish({
  proposal,
  published,
  onPublish,
  onBackToReview,
}: {
  proposal: Proposal | null;
  published: boolean;
  onPublish: () => void;
  onBackToReview: () => void;
}) {
  if (!proposal || proposal.status !== "Approved") {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 mt-0.5" size={18} />
          <div>
            <div className="font-medium">Approve a proposal first.</div>
            <div className="text-sm text-slate-600">
              Publish is blocked until an approved proposal exists.
            </div>
            <SecondaryButton className="mt-3" onClick={onBackToReview}>
              Back to Review
            </SecondaryButton>
          </div>
        </div>
      </Card>
    );
  }

  if (published) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Check className="text-emerald-600 mt-0.5" size={18} />
          <div>
            <div className="font-medium">Published.</div>
            <div className="text-sm text-slate-600">
              Visible to member/cabinet/president. Attendance finalized. Room
              assignments are now official. {proposal.unassigned.length}{" "}
              leftover participants remain visible.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="font-semibold mb-1">
        Publish proposal v{proposal.version} as the OFFICIAL pairing?
      </div>
      <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1 my-3">
        <li>Becomes visible to member, cabinet, and president</li>
        <li>Attendance is finalized automatically</li>
        <li>Room assignments become official</li>
        <li>{proposal.unassigned.length} leftover participants stay visible</li>
      </ul>
      <PrimaryButton onClick={onPublish}>
        <Send size={16} />
        Publish
      </PrimaryButton>
    </Card>
  );
}

// ── Step 5: Post-session ─────────────────────────────────────────────────
function PostSession() {
  const [open, setOpen] = useState(true);
  const s = scoringStatus;
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2 font-semibold">
            <ClipboardList size={16} />
            Scoring status
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Pill tone={s.status === "Complete" ? "emerald" : "amber"}>
              {s.status}
            </Pill>
            <ChevronDown
              size={16}
              className={`transition ${open ? "rotate-180" : ""}`}
            />
          </div>
        </button>
        {open && (
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <StatRow
              label="Speaker forms"
              value={`${s.speakerFormsSubmitted} / ${s.speakerFormsExpected}`}
            />
            <StatRow
              label="Chair forms"
              value={`${s.chairFormsSubmitted} / ${s.chairFormsExpected}`}
            />
            <div className="sm:col-span-2 mt-2">
              <div className="font-medium mb-1">Pending speakers</div>
              <div className="text-slate-700">
                {s.pendingSpeakerIds.length === 0
                  ? "—"
                  : s.pendingSpeakerIds
                      .map((id) => findParticipant(id)?.name)
                      .join(", ")}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="font-medium mb-1">Pending chairs</div>
              <div className="text-slate-700">
                {s.pendingChairIds.length === 0
                  ? "—"
                  : s.pendingChairIds
                      .map((id) => findParticipant(id)?.name)
                      .join(", ")}
              </div>
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-2">
              <PrimaryButton onClick={() => alert("Nudge sent (mock).")}>
                Nudge pending
              </PrimaryButton>
              <SecondaryButton
                onClick={() => alert("Scoring closed (mock).")}
              >
                Close scoring
              </SecondaryButton>
            </div>
          </div>
        )}
        <p className="text-[12px] text-slate-500 mt-3">
          Read-only oversight is visible to cabinet, president, and TechHead.
          Submission content stays private; the leaderboards are the derived
          public output. Close scoring once everything is in.
        </p>
      </Card>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

// Re-use ConfidenceDots in case we want it later
export { ConfidenceDots };

"use client";

import React, { useMemo, useState } from "react";
import { ClipboardList, ListChecks, Send, Users, Wand2 } from "lucide-react";
import { Card, EmptyState, Field, SectionHeader, StateBadge } from "./ui";
import type { Participant, SessionRow } from "./types";

type StepKey = "prepare" | "setup" | "review" | "publish" | "post";

type SessionWorkspaceProps = {
  userName: string;
  participants: Participant[];
  sessions: SessionRow[];
  loading: boolean;
  error: string | null;
};

const STEPS: { key: StepKey; label: string }[] = [
  { key: "prepare", label: "Prepare" },
  { key: "setup", label: "Setup" },
  { key: "review", label: "Generate & Review" },
  { key: "publish", label: "Publish" },
  { key: "post", label: "Post-session" },
];

export default function SessionWorkspace({
  userName,
  participants,
  sessions,
  loading,
  error,
}: SessionWorkspaceProps) {
  const [step, setStep] = useState<StepKey>("prepare");
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<string[]>([]);
  const [selectedAdjudicatorIds, setSelectedAdjudicatorIds] = useState<string[]>([]);
  const [motionType, setMotionType] = useState("");
  const [motionText, setMotionText] = useState("");
  const [objective, setObjective] = useState("BALANCED");

  const latestSession = sessions[0] ?? null;
  const counts = useMemo(() => {
    const speakers = selectedSpeakerIds.length;
    const adjudicators = selectedAdjudicatorIds.length;
    const rooms = Math.floor(speakers / 8);
    const leftover = speakers % 8;
    return {
      speakers,
      adjudicators,
      rooms,
      leftover,
      adjudicatorCoverage: adjudicators >= Math.max(rooms, 1),
    };
  }, [selectedAdjudicatorIds.length, selectedSpeakerIds.length]);

  if (loading) {
    return <EmptyState title="Loading workspace" body="Fetching live session and roster data." />;
  }

  if (error) {
    return <EmptyState title="Workspace unavailable" body={error} />;
  }

  return (
    <div className="pb-10">
      <SectionHeader
        title="Session Workspace"
        subtitle={latestSession ? latestSession.date : "No existing sessions yet"}
        right={<StateBadge state={latestSession?.state ?? "Preparation"} />}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {STEPS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setStep(entry.key)}
            className={`rounded-lg border px-4 py-3 text-left text-sm ${
              step === entry.key
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Step
            </div>
            <div className="mt-1 font-semibold">{entry.label}</div>
          </button>
        ))}
      </div>

      {step === "prepare" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Users size={16} /> Live roster
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <RosterPicker
                title="Speakers"
                ids={selectedSpeakerIds}
                participants={participants}
                accent="blue"
                onToggle={(id) => {
                  setSelectedSpeakerIds((current) =>
                    current.includes(id)
                      ? current.filter((value) => value !== id)
                      : [...current, id],
                  );
                  setSelectedAdjudicatorIds((current) => current.filter((value) => value !== id));
                }}
              />
              <RosterPicker
                title="Adjudicators"
                ids={selectedAdjudicatorIds}
                participants={participants}
                accent="amber"
                onToggle={(id) => {
                  setSelectedAdjudicatorIds((current) =>
                    current.includes(id)
                      ? current.filter((value) => value !== id)
                      : [...current, id],
                  );
                  setSelectedSpeakerIds((current) => current.filter((value) => value !== id));
                }}
              />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <ListChecks size={16} /> Feasibility
            </h3>
            <div className="space-y-2 text-sm">
              <MetricRow label="Speakers" value={counts.speakers} />
              <MetricRow label="Adjudicators" value={counts.adjudicators} />
              <MetricRow label="Rooms possible" value={counts.rooms} />
              <MetricRow label="Leftover speakers" value={counts.leftover} />
              <MetricRow
                label="Chair default"
                value={userName || "Current user"}
              />
              <MetricRow
                label="Adjudicator coverage"
                value={counts.adjudicatorCoverage ? "OK" : "Needs more adjudicators"}
              />
            </div>
          </Card>
        </div>
      )}

      {step === "setup" && (
        <Card className="p-4">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <ClipboardList size={16} /> Session-only inputs
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Motion type">
              <input
                value={motionType}
                onChange={(event) => setMotionType(event.target.value)}
                placeholder="IR / Policy / Moral / ..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Pairing objective">
              <select
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="BALANCED">Balanced</option>
                <option value="COMPETITIVE">Competitive</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Motion text">
                <textarea
                  value={motionText}
                  onChange={(event) => setMotionText(event.target.value)}
                  rows={4}
                  placeholder="Enter the session motion for the eventual pairing request."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {step === "review" && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Wand2 size={16} /> Generate & Review
          </h3>
          <EmptyState
            title="Proposal generation is not wired yet"
            body="The frontend is now using the live roster and session history, but the documented pairing generation and proposal review routes from docs/14 have not been implemented in this backend yet. This screen is ready to call them once those route handlers land."
          />
        </Card>
      )}

      {step === "publish" && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Send size={16} /> Publish
          </h3>
          <EmptyState
            title="Publish flow pending backend route"
            body="The UI no longer shows a fake approved proposal. Publishing will be enabled once the official approve and publish endpoints exist so this screen can read a real proposal state instead of fixtures."
          />
        </Card>
      )}

      {step === "post" && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <ClipboardList size={16} /> Post-session scoring
          </h3>
          <EmptyState
            title="Scoring-status route not connected yet"
            body="The pairing-specific post-session oversight view still depends on documented scoring-status endpoints that are not present in the current backend. Once those routes exist, this tab can swap from a placeholder to real completion tracking."
          />
        </Card>
      )}
    </div>
  );
}

function RosterPicker({
  title,
  ids,
  participants,
  accent,
  onToggle,
}: {
  title: string;
  ids: string[];
  participants: Participant[];
  accent: "blue" | "amber";
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-700">{title}</div>
      <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {participants.map((participant) => {
          const selected = ids.includes(participant.id);
          return (
            <button
              key={participant.id}
              type="button"
              onClick={() => onToggle(participant.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                selected
                  ? accent === "blue"
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-amber-500 bg-amber-50 text-amber-900"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <span>{participant.name}</span>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {participant.account}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

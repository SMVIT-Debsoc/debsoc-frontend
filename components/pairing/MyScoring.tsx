"use client";

import React, { useState } from "react";
import { Card, PrimaryButton, SectionHeader, Pill, Field } from "./ui";
import { findParticipant, myScoringTasks } from "./mock";
import type { ScoringTask } from "./mock";

export default function MyScoring() {
  return (
    <div>
      <SectionHeader
        title="My Scoring Tasks"
        subtitle="The form you get is decided by your role in that session — not your account role."
      />
      <div className="space-y-4">
        {myScoringTasks.map((t) => (
          <TaskCard key={t.sessionId} task={t} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: ScoringTask }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <div className="font-semibold">
            {task.date} · {task.motionType}
          </div>
          <div className="text-sm text-slate-600">
            You were:{" "}
            <Pill
              tone={
                task.sessionRole === "Chair"
                  ? "blue"
                  : task.sessionRole === "Speaker"
                  ? "emerald"
                  : "slate"
              }
            >
              {task.sessionRole}
            </Pill>
          </div>
        </div>
        {task.submitted && (
          <Pill tone="emerald">Already submitted</Pill>
        )}
      </div>

      {task.submitted ? (
        <p className="text-sm text-slate-500">
          Thanks — your submission is in. Updates aren&apos;t allowed after the
          window closes.
        </p>
      ) : task.sessionRole === "Speaker" ? (
        <SpeakerForm task={task} />
      ) : task.sessionRole === "Chair" ? (
        <ChairForm task={task} />
      ) : (
        <p className="text-sm text-slate-600">
          Nothing to submit — non-chair adjudicators don&apos;t fill a form.
        </p>
      )}
    </Card>
  );
}

function SpeakerForm({ task }: { task: ScoringTask }) {
  const [chairScore, setChairScore] = useState<number | "">("");
  const [teamDynamics, setTeamDynamics] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const chair = task.assignedChairId
    ? findParticipant(task.assignedChairId)
    : null;

  if (submitted) {
    return (
      <p className="text-sm text-emerald-700">
        Submitted. (Mocked — no backend call.)
      </p>
    );
  }

  return (
    <form
      className="grid sm:grid-cols-2 gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (chairScore === "") return;
        setSubmitted(true);
      }}
    >
      <Field
        label={`Score your chair${chair ? ` — ${chair.name}` : ""} (0–10)`}
      >
        <input
          type="number"
          min={0}
          max={10}
          value={chairScore}
          onChange={(e) =>
            setChairScore(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          required
        />
      </Field>
      <Field
        label="Rate your team dynamics (0–10, optional)"
        hint="Secondary signal — partner dynamics is primarily results-based."
      >
        <input
          type="number"
          min={0}
          max={10}
          value={teamDynamics}
          onChange={(e) =>
            setTeamDynamics(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <PrimaryButton type="submit">Submit</PrimaryButton>
      </div>
    </form>
  );
}

function ChairForm({ task }: { task: ScoringTask }) {
  const [section, setSection] = useState<"adj" | "spk">("adj");
  const [adjScores, setAdjScores] = useState<Record<string, number | "">>({});
  const [spkScores, setSpkScores] = useState<Record<string, number | "">>({});
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-sm text-emerald-700">
        Submitted. (Mocked — no backend call.)
      </p>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setSection("adj")}
          className={`px-3 py-1.5 text-sm rounded-md border ${
            section === "adj"
              ? "bg-slate-900 border-slate-900 text-white"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          1. Score adjudicators
        </button>
        <button
          type="button"
          onClick={() => setSection("spk")}
          className={`px-3 py-1.5 text-sm rounded-md border ${
            section === "spk"
              ? "bg-slate-900 border-slate-900 text-white"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          2. Enter speaker scores
        </button>
      </div>

      {section === "adj" && (
        <div className="space-y-2">
          {(task.roomAdjudicators ?? []).length === 0 && (
            <p className="text-sm text-slate-500">
              No panel adjudicators in this room.
            </p>
          )}
          {(task.roomAdjudicators ?? []).map((id) => {
            const p = findParticipant(id);
            if (!p) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-3 border border-slate-200 rounded-md p-2"
              >
                <div className="flex-1 text-sm">{p.name}</div>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={adjScores[id] ?? ""}
                  onChange={(e) =>
                    setAdjScores({
                      ...adjScores,
                      [id]:
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value),
                    })
                  }
                  placeholder="0–10"
                  className="w-24 border border-slate-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
            );
          })}
        </div>
      )}

      {section === "spk" && (
        <div className="space-y-2">
          {(task.roomSpeakers ?? []).map((s) => {
            const p = findParticipant(s.participantId);
            if (!p) return null;
            return (
              <div
                key={s.participantId}
                className="flex items-center gap-3 border border-slate-200 rounded-md p-2"
              >
                <div className="flex-1 text-sm">
                  {p.name}{" "}
                  <span className="text-slate-400 text-xs">
                    {s.bench} · {s.role}
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={spkScores[s.participantId] ?? ""}
                  onChange={(e) =>
                    setSpkScores({
                      ...spkScores,
                      [s.participantId]:
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value),
                    })
                  }
                  placeholder="raw score"
                  className="w-28 border border-slate-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <PrimaryButton type="button" onClick={() => setSubmitted(true)}>
          Submit chair form
        </PrimaryButton>
      </div>
    </div>
  );
}

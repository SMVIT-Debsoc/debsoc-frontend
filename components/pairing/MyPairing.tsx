"use client";

import React from "react";
import { Crown, Users } from "lucide-react";
import { Card, SectionHeader, StateBadge } from "./ui";
import { myPairing, sampleProposal, findParticipant } from "./mock";

export default function MyPairing() {
  const m = myPairing;
  const room = sampleProposal.rooms.find((r) => r.index === m.roomIndex);

  return (
    <div>
      <SectionHeader
        title="My Pairing"
        subtitle={`${m.date} · Motion type: ${m.motionType}`}
        right={<StateBadge state={m.state} />}
      />

      <Card className="p-5 border-blue-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
          You are
        </div>
        <div className="text-lg font-semibold mb-4 text-slate-900">{m.sessionRole}</div>

        {m.sessionRole === "Speaker" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-sm">
            <Stat label="Room" value={`Room ${m.roomIndex}`} />
            <Stat label="Speaking role" value={m.speakingRole ?? "—"} />
            <Stat label="Team" value={m.bench ?? "—"} />
            <Stat label="Teammate" value={m.teammate ?? "—"} />
            <Stat label="Chair" value={m.chair ?? "—"} />
            <Stat label="Motion" value={m.motion} wide />
          </div>
        )}

        {m.sessionRole === "Adjudicator" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-sm">
            <Stat label="Room" value={`Room ${m.roomIndex}`} />
            <Stat label="Role" value="Panel adjudicator" />
            <Stat label="Chair" value={m.chair ?? "—"} />
            <Stat label="Motion" value={m.motion} wide />
          </div>
        )}

        {m.sessionRole === "Chair" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-sm">
            <Stat label="Room" value={`Room ${m.roomIndex}`} />
            <Stat label="Role" value="Chair" />
            <Stat label="Motion" value={m.motion} wide />
          </div>
        )}
      </Card>

      {room && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" /> Room {room.index} Full Roster
          </h3>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Debate Teams</h4>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {room.teams.map((team) => (
                  <Card key={team.bench} className="p-3 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-[13px] text-slate-800">{team.bench}</span>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-slate-700">
                      {team.speakers.map((s) => (
                        <div key={s.participantId} className="flex flex-col">
                          <span className="font-medium">{findParticipant(s.participantId)?.name}</span>
                          <span className="text-[11px] text-slate-500 uppercase tracking-wide">{s.role}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Adjudication Panel</h4>
              <Card className="p-3 border-slate-200 shadow-sm">
                <div className="flex flex-col gap-3 text-sm text-slate-700">
                  {room.adjudicators.map((a) => (
                    <div key={a.participantId} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 last:pb-0">
                      <span className="flex items-center gap-2 font-medium">
                        {a.isChair ? <Crown size={16} className="text-amber-500" /> : <div className="w-4" />}
                        {findParticipant(a.participantId)?.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-md ${a.isChair ? 'bg-amber-100 text-amber-800 font-semibold' : 'bg-slate-100 text-slate-600'}`}>
                        {a.isChair ? "Chair" : "Panel"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      <p className="text-[12px] text-slate-500 mt-6 pt-4 border-t border-slate-200">
        Reads only the official published pairing. If a draft exists, it stays
        invisible here.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-full" : ""}>
      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
        {label}
      </div>
      <div className="font-medium text-[13px] text-slate-900 leading-snug">{value}</div>
    </div>
  );
}

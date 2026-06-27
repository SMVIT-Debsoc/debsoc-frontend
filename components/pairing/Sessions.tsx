"use client";

import React, { useState, useEffect } from "react";
import { Card, SectionHeader, StateBadge } from "./ui";
import { sessions, type SessionRow, sampleProposal, findParticipant } from "./mock";
import { Calendar, X, FileText, Users, Activity, Crown, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sessions() {
  const [viewSession, setViewSession] = useState<SessionRow | null>(null);

  return (
    <div>
      <SectionHeader
        title="Sessions"
        subtitle="History of sessions and their lifecycle state."
      />
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="py-2 px-4 font-medium">Date</th>
              <th className="py-2 px-4 font-medium">Motion type</th>
              <th className="py-2 px-4 font-medium">State</th>
              <th className="py-2 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-3 px-4 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  {s.date}
                </td>
                <td className="py-3 px-4">{s.motionType}</td>
                <td className="py-3 px-4">
                  <StateBadge state={s.state} />
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    className="text-blue-700 hover:underline text-sm font-medium"
                    onClick={() => setViewSession(s)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      
      <SessionDetailModal 
        session={viewSession} 
        onClose={() => setViewSession(null)} 
      />
    </div>
  );
}

function SessionDetailModal({
  session,
  onClose,
}: {
  session: SessionRow | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (session) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [session]);

  return (
    <AnimatePresence>
      {session && (
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
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600" />
                  {session.date}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-slate-500 font-medium">Session Details</span>
                  <span className="text-slate-300">•</span>
                  <StateBadge state={session.state} />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-2 self-start"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 bg-slate-50/50">
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4 bg-white">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-0.5">Motion Type</div>
                    <div className="text-base font-bold text-slate-900">{session.motionType}</div>
                  </div>
                </Card>
                <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-4 bg-white">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-0.5">Attendance</div>
                    <div className="text-base font-bold text-slate-900">23 Present</div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Activity size={16} className="text-slate-500" />
                    Lifecycle Status
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This session is currently in the <strong className="text-slate-800">{session.state}</strong> state. 
                    {session.state === "Generated" && " An admin is reviewing the engine's pairings."}
                    {session.state === "Scored" && " The session is complete and feedback has been recorded."}
                    {session.state === "Published" && " The official pairing is live and visible to all participants."}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
                  <strong className="font-semibold block mb-1">Concept UI Note</strong>
                  This is a mocked view for the frontend layout. In the real system, this modal will display the exact motion text, comprehensive historical data, and provide direct links to the pairing workspace or leaderboards.
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">
                    Motion
                  </h4>
                  <p className="text-sm text-slate-800 italic">
                    "This House would tax large language model providers per query."
                  </p>
                </div>

                <div className="pt-2">
                  <h3 className="font-bold text-slate-900 mb-3">Full Pairing ({sampleProposal.rooms.length} Rooms)</h3>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {sampleProposal.rooms.map((room) => (
                      <Card key={room.index} className="p-4 bg-white shadow-sm border-slate-200">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                          <div className="font-bold text-slate-800">Room {room.index}</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {room.teams.map((team) => (
                            <div
                              key={team.bench}
                              className="border border-slate-200 rounded-md p-2 bg-slate-50/50"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold text-[13px]">{team.bench}</div>
                              </div>
                              <div className="text-slate-700 text-xs">
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
                        <div className="mt-3 pt-3 border-t border-slate-100 text-[13px]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Crown size={14} className="text-amber-600" />
                            <span className="font-semibold text-slate-800">Chair:</span>
                            {(() => {
                              const chair = room.adjudicators.find((a) => a.isChair);
                              if (!chair) return " —";
                              return ` ${findParticipant(chair.participantId)?.name}`;
                            })()}
                          </div>
                          <div className="text-slate-700 flex items-start gap-2">
                            <span className="font-semibold text-slate-800 mt-0.5">Panel:</span>{" "}
                            <span className="leading-snug">
                              {room.adjudicators
                                .filter((a) => !a.isChair)
                                .map((a) => findParticipant(a.participantId)?.name)
                                .join(", ") || "—"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900">
                        Leftovers (Not Assigned)
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {sampleProposal.unassigned.length} participants could not be placed in this round.
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <ul className="text-slate-700 grid sm:grid-cols-2 gap-2 mt-2">
                      {sampleProposal.unassigned.map((u) => (
                        <li key={u.participantId} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="font-medium text-slate-800">{findParticipant(u.participantId)?.name}</span>{" "}
                          <span className="text-xs text-slate-400">({u.reason})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

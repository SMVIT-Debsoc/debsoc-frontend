"use client";

import React from "react";
import { Card, SectionHeader, StateBadge } from "./ui";
import { sessions } from "./mock";
import { Calendar } from "lucide-react";

export default function Sessions() {
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
                    className="text-blue-700 hover:underline text-sm"
                    onClick={() => alert(`Session detail not built in this concept UI.`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import { Card, EmptyState, Pill, SectionHeader } from "./ui";
import type { Participant } from "./types";

type RosterProps = {
  participants: Participant[];
  loading: boolean;
  error: string | null;
};

export default function Roster({ participants, loading, error }: RosterProps) {
  const [filter, setFilter] = useState("");

  const filteredParticipants = useMemo(
    () =>
      participants.filter((participant) =>
        participant.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [filter, participants],
  );

  if (loading) {
    return <EmptyState title="Loading roster" body="Fetching live members, cabinet, and president records." />;
  }

  if (error) {
    return <EmptyState title="Roster unavailable" body={error} />;
  }

  return (
    <div>
      <SectionHeader
        title="Members & Cabinet"
        subtitle="Live participant roster from the current backend. Pairing progress verdicts will replace this fallback summary once the progress endpoints exist."
        right={
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search…"
            className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        }
      />

      {filteredParticipants.length === 0 ? (
        <EmptyState title="No matching participants" body="Try a different search term." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Account</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => (
                <tr key={participant.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{participant.name}</td>
                  <td className="px-4 py-3">
                    <Pill
                      tone={
                        participant.account === "President"
                          ? "blue"
                          : participant.account === "Cabinet"
                            ? "amber"
                            : "slate"
                      }
                    >
                      {participant.account}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{participant.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Pill tone={participant.isVerified ? "emerald" : "red"}>
                      {participant.isVerified ? "Verified" : "Pending"}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

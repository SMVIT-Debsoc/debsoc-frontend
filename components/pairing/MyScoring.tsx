"use client";

import React from "react";
import { EmptyState, SectionHeader } from "./ui";

export default function MyScoring({ role }: { role: string }) {
  return (
    <div>
      <SectionHeader
        title="My Scoring Tasks"
        subtitle="This tab now avoids mock scoring forms until the backend exposes real role-based scoring tasks."
      />
      <EmptyState
        title="Scoring tasks are not wired yet"
        body={
          role === "President"
            ? "The current backend has no pairing scoring-task endpoint for president participation yet."
            : "The pairing-specific scoring task APIs from the documented backend are not implemented yet, so this screen no longer renders fake forms."
        }
      />
    </div>
  );
}

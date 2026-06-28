"use client";

import React from "react";
import AdminPairingDashboard from "./AdminPairingDashboard";
import ParticipantPairingDashboard from "./ParticipantPairingDashboard";

export default function PairingDashboard({ role }: { role: string }) {
  const isAdmin = role === "Cabinet" || role === "President";

  if (isAdmin) {
    return <AdminPairingDashboard />;
  }
  
  return <ParticipantPairingDashboard />;
}

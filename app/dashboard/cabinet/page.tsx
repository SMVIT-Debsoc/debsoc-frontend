import React from "react";
import CabinetDashboard from "@/components/CabinetDashboard";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/server/dev-session";

export default async function CabinetDashboardPage() {
  const session = await getAppSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "cabinet") {
    redirect("/dashboard");
  }

  if (!session.user.isVerified) {
    redirect("/unverified");
  }

  return <CabinetDashboard />;
}

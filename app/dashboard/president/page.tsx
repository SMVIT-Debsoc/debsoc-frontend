import React from "react";
import PresidentDashboard from "@/components/PresidentDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function PresidentDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "President") {
    redirect("/dashboard");
  }

  return <PresidentDashboard />;
}

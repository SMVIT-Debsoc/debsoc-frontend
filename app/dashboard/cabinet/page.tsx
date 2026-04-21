import React from "react";
import CabinetDashboard from "@/components/CabinetDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function CabinetDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "Cabinet") {
    redirect("/dashboard");
  }

  return <CabinetDashboard />;
}

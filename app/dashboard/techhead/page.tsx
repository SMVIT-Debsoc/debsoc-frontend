import React from "react";
import TechHeadDashboard from "@/components/TechHeadDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function TechHeadDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TechHead") {
    redirect("/dashboard");
  }

  return <TechHeadDashboard />;
}

import React from "react";
import TechHeadDashboard from "@/components/TechHeadDashboard";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/server/dev-session";
import { isDevelopmentDebassMockEnabled } from "@/lib/dev/debass-mock";

export default async function TechHeadDashboardPage() {
  const session = await getAppSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TechHead") {
    redirect("/dashboard");
  }

  return <TechHeadDashboard developmentDebassMockEnabled={isDevelopmentDebassMockEnabled()} />;
}

import MemberDashboard from '@/components/MemberDashboard';
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/server/dev-session";

export default async function DashboardPage() {
  const session = await getAppSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TechHead" && !session.user.isVerified) {
    redirect("/unverified");
  }

  if (session.user.role === "TechHead") {
    redirect("/dashboard/techhead");
  }

  if (session.user.role === "cabinet") {
    redirect("/dashboard/cabinet");
  }

  if (session.user.role === "President") {
    redirect("/dashboard/president");
  }

  return <MemberDashboard />;
}

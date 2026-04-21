import MemberDashboard from '@/components/MemberDashboard';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "TechHead") {
    redirect("/dashboard/techhead");
  }

  if (session.user.role === "Cabinet") {
    redirect("/dashboard/cabinet");
  }

  // Currently defaults to MemberDashboard for others
  return <MemberDashboard />;
}

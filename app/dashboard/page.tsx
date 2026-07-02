import { redirect } from "next/navigation";
import PairingDashboard from "@/components/pairing/PairingDashboard";
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

  return (
    <PairingDashboard
      role={session.user.role}
      userName={session.user.name ?? ""}
    />
  );
}

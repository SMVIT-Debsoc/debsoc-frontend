import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import PairingDashboard from "@/components/pairing/PairingDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TechHead" && !session.user.isVerified) {
    redirect("/unverified");
  }

  return (
    <PairingDashboard
      role={session.user.role}
      userName={session.user.name ?? ""}
    />
  );
}

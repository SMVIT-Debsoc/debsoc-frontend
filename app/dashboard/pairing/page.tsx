import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import PairingDashboard from "@/components/pairing/PairingDashboard";

export const metadata = {
  title: "Pairing — Debsoc",
};

export default async function PairingDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Any logged-in role can view the pairing dashboard. The UI itself shows
  // role-appropriate surfaces (admin workspace for cabinet/president,
  // participant surfaces for everyone who debates).
  if (!session.user.isVerified && session.user.role !== "TechHead") {
    redirect("/unverified");
  }

  return (
    <PairingDashboard
      role={session.user.role}
      userName={session.user.name ?? ""}
    />
  );
}

import { redirect } from "next/navigation";
import PairingDashboard from "@/components/pairing/PairingDashboard";
import { getAppSession } from "@/lib/server/dev-session";
import { prisma } from "@/lib/server/prisma";

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

  let position: string | null = null;
  if (session.user.role === "cabinet" && session.user.id) {
    const record = await prisma.cabinet.findUnique({
      where: { id: session.user.id },
      select: { position: true },
    });
    position = record?.position ?? null;
  }

  return (
    <PairingDashboard
      role={session.user.role}
      userName={session.user.name ?? ""}
      position={position}
    />
  );
}

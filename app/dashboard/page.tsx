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
  if (session.user.role === "cabinet") {
    try {
      const record = await prisma.cabinet.findFirst({
        where: {
          OR: [
            ...(session.user.id ? [{ id: session.user.id }] : []),
            ...(session.user.email ? [{ email: session.user.email }] : []),
          ],
        },
        select: { position: true },
      });
      position = record?.position?.trim() || null;
    } catch (caught) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[dashboard] Continuing without cabinet position because lookup failed.", caught);
      }
    }
  }

  return (
    <PairingDashboard
      role={session.user.role}
      userName={session.user.name ?? ""}
      userId={session.user.id ?? null}
      position={position}
    />
  );
}

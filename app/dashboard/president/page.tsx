import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/server/dev-session";

export default async function PresidentDashboardPage() {
  const session = await getAppSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "President") {
    redirect("/dashboard");
  }

  if (!session.user.isVerified) {
    redirect("/unverified");
  }

  redirect("/dashboard");
}

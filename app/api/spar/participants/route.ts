import { requireSessionUser } from "@/lib/server/guards";
import { ok } from "@/lib/server/http";
import { getSparParticipants } from "@/lib/server/spar/spar-service";
import { demoParticipants, isDemoDataEnabled } from "@/lib/server/demo-data";

export async function GET() {
  const sessionResult = await requireSessionUser({ roles: ["Member", "cabinet", "President"], requireVerified: true });
  if ("response" in sessionResult) return sessionResult.response;

  if (isDemoDataEnabled()) return ok(demoParticipants());

  return ok(await getSparParticipants());
}

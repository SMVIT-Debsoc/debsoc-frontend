import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { unverifyEntity } from "@/lib/server/debsoc-service";

export async function POST(request: Request) {
  const guard = await requireSessionUser({ roles: ["TechHead"] });
  if ("response" in guard) return guard.response;

  try {
    const body = await parseJson<{ memberId?: string }>(request);
    return ok(await unverifyEntity("member", body.memberId ?? ""));
  } catch (err) {
    return error(err instanceof Error ? err.message : "Internal server error", 400);
  }
}

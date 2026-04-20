import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { deleteEntity } from "@/lib/server/debsoc-service";

export async function DELETE(request: Request) {
  const guard = await requireSessionUser({ roles: ["TechHead"] });
  if ("response" in guard) return guard.response;

  try {
    const body = await parseJson<{ id?: string }>(request);
    return ok(await deleteEntity("cabinet", body.id ?? ""));
  } catch (err) {
    return error(err instanceof Error ? err.message : "Internal server error", 400);
  }
}

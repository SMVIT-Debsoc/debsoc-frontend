import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { changeEntityRole } from "@/lib/server/debsoc-service";

type RoleKey = "president" | "cabinet" | "member";
const ALLOWED: RoleKey[] = ["president", "cabinet", "member"];

export async function POST(request: Request) {
  const guard = await requireSessionUser({ roles: ["TechHead"] });
  if ("response" in guard) return guard.response;

  try {
    const body = await parseJson<{
      id?: string;
      fromRole?: string;
      toRole?: string;
      position?: string;
    }>(request);

    const fromRole = body.fromRole?.toLowerCase() as RoleKey | undefined;
    const toRole = body.toRole?.toLowerCase() as RoleKey | undefined;

    if (!fromRole || !ALLOWED.includes(fromRole)) {
      return error("Invalid source role", 400);
    }
    if (!toRole || !ALLOWED.includes(toRole)) {
      return error("Invalid target role", 400);
    }
    if (!body.id) return error("User ID is required", 400);

    const result = await changeEntityRole(fromRole, toRole, body.id, {
      position: body.position,
      techHeadId: guard.user.id,
    });
    return ok(result);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Internal server error", 400);
  }
}

import { error, ok, parseJson } from "@/lib/server/http";
import { registerRole } from "@/lib/server/debsoc-service";

export async function POST(request: Request) {
  try {
    return ok(
      await registerRole("Member", await parseJson<{ name?: string; email?: string; password?: string }>(request)),
      { status: 201 },
    );
  } catch (err) {
    return error(err instanceof Error ? err.message : "Internal server error", 400);
  }
}

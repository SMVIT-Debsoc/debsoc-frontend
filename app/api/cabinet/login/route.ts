import { error, ok, parseJson } from "@/lib/server/http";
import { loginRole } from "@/lib/server/debsoc-service";

export async function POST(request: Request) {
  try {
    return ok(await loginRole("cabinet", await parseJson<{ email?: string; password?: string }>(request)));
  } catch (err) {
    return error(err instanceof Error ? err.message : "Internal server error", 401);
  }
}

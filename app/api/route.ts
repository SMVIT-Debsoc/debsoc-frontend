import { ok } from "@/lib/server/http";

export async function GET() {
  return ok({ message: "Debsoc Backend API", version: "nextjs-migrated" });
}

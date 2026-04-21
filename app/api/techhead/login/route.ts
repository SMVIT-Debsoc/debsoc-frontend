import { error } from "@/lib/server/http";

export async function POST() {
  return error("Password login is disabled. Use Google OAuth with NextAuth.", 410);
}

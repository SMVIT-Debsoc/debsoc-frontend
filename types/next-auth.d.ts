import type { DefaultSession } from "next-auth";
import type { DebsocRole } from "@/lib/server/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: DebsocRole;
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    role: DebsocRole;
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: DebsocRole;
    isVerified?: boolean;
  }
}

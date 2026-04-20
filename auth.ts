import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { findRoleUserByEmail } from "@/lib/server/auth-models";
import { prisma } from "@/lib/server/prisma";
import type { DebsocRole } from "@/lib/server/roles";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        return false;
      }

      const roleUser = await findRoleUserByEmail(user.email);
      return Boolean(roleUser);
    },
    async session({ session }) {
      if (session.user?.email) {
        const roleUser = await findRoleUserByEmail(session.user.email);
        if (roleUser) {
          session.user.id = roleUser.id;
          session.user.role = roleUser.role as DebsocRole;
          session.user.isVerified = roleUser.isVerified;
          session.user.name = roleUser.name;
          session.user.email = roleUser.email;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

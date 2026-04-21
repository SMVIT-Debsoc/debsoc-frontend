import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ensureRoleUserByEmail } from "@/lib/server/auth-models";
import type { DebsocRole } from "@/lib/server/roles";

const isProduction = process.env.NODE_ENV === "production";
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;

if (isProduction && !nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is required in production.");
}

if (isProduction && !nextAuthUrl) {
  throw new Error("NEXTAUTH_URL is required in production.");
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  session: {
    strategy: "jwt",
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

      const roleUser = await ensureRoleUserByEmail(user.email, user.name);
      if (!roleUser) {
        return false;
      }

      user.id = roleUser.id;
      user.role = roleUser.role;
      user.isVerified = roleUser.isVerified;
      user.email = roleUser.email;
      user.name = roleUser.name;

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id && user.role) {
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.email = user.email;
        token.name = user.name;
      }

      if ((!token.id || !token.role) && user?.email) {
        const roleUser = await ensureRoleUserByEmail(user.email, user.name);
        if (roleUser) {
          token.id = roleUser.id;
          token.role = roleUser.role;
          token.isVerified = roleUser.isVerified;
          token.email = roleUser.email;
          token.name = roleUser.name;
        }
      }

      if (token.role && token.id) {
        token.role = token.role as DebsocRole;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role && token.email) {
        session.user.id = token.id;
        session.user.role = token.role as DebsocRole;
        session.user.isVerified = Boolean(token.isVerified);
        session.user.email = token.email;
        session.user.name = token.name ?? session.user.name ?? "";
      }

      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

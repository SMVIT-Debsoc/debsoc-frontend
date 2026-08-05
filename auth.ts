import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ensureRoleUserByEmail, createOrPromoteToTechHead, findRoleUserByEmail } from "@/lib/server/auth-models";
import type { DebsocRole } from "@/lib/server/roles";
import { PRODUCTION_SITE_URL } from "@/lib/site";
import { cookies } from "next/headers";

const isProduction = process.env.NODE_ENV === "production";
export const isAuthBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const configuredNextAuthUrl = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");
const nextAuthUrl = isProduction
  ? PRODUCTION_SITE_URL
  : configuredNextAuthUrl || "http://localhost:3000";

// Auth.js reads NEXTAUTH_URL from the environment when it builds OAuth URLs.
// Supply a safe default without requiring Vercel to expose it during `next build`.
if (process.env.NEXTAUTH_URL !== nextAuthUrl) {
  process.env.NEXTAUTH_URL = nextAuthUrl;
}

function getRuntimeAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET;

  if (isProduction && !secret) {
    throw new Error("Authentication is unavailable: NEXTAUTH_SECRET is required at runtime.");
  }

  return secret;
}

export const authOptions: NextAuthOptions = {
  // Lazy evaluation keeps static page-data collection build-safe while still
  // failing clearly and securely when production authentication is requested.
  get secret() {
    return getRuntimeAuthSecret();
  },
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

      const cookieStore = await cookies();
      const promotionKey = cookieStore.get("debsoc_promotion_key")?.value;
      const requestedRole = cookieStore.get("debsoc_requested_role")?.value as DebsocRole | undefined;
      const requestedPosition = cookieStore.get("debsoc_requested_position")?.value;
      const expectedKey = process.env.TECH_HEAD_SECRET_KEY;

      let roleUser;
      if (promotionKey && expectedKey && promotionKey === expectedKey) {
          roleUser = await createOrPromoteToTechHead(user.email, user.name || "Tech Head");
      } else {
          roleUser = await ensureRoleUserByEmail(user.email, user.name, requestedRole, requestedPosition);
      }

      if (!roleUser) {
        return false;
      }

      user.id = roleUser.id;
      user.role = roleUser.role;
      user.isVerified = roleUser.isVerified;
      user.email = roleUser.email;
      user.name = roleUser.name;

      if (user.role !== "TechHead" && !user.isVerified) {
        return "/unverified";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.email = user.email;
        token.name = user.name;
      }

      if ((!token.id || !token.role) && token.email) {
        const roleUser = await findRoleUserByEmail(token.email);
        if (roleUser) {
          token.id = roleUser.id;
          token.role = roleUser.role;
          token.isVerified = roleUser.isVerified;
          token.email = roleUser.email;
          token.name = roleUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role && token.email) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isVerified = Boolean(token.isVerified);
        session.user.email = token.email;
        session.user.name = token.name ?? session.user.name ?? "";
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

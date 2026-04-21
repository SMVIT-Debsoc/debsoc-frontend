import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ensureRoleUserByEmail, findRoleUserById, createOrPromoteToTechHead, findRoleUserByEmail } from "@/lib/server/auth-models";
import type { DebsocRole } from "@/lib/server/roles";
import { cookies } from "next/headers";

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
      console.log("[AUTH] signIn callback triggered", { email: user.email, provider: account?.provider });
      
      if (account?.provider !== "google" || !user.email) {
        console.log("[AUTH] signIn rejected: Not Google or missing email");
        return false;
      }

      const cookieStore = await cookies();
      const promotionKey = cookieStore.get("debsoc_promotion_key")?.value;
      const requestedRole = cookieStore.get("debsoc_requested_role")?.value as DebsocRole | undefined;
      const requestedPosition = cookieStore.get("debsoc_requested_position")?.value;
      const expectedKey = process.env.TECH_HEAD_SECRET_KEY;

      console.log("[AUTH] Promotion check", { 
        hasKey: !!promotionKey, 
        hasExpected: !!expectedKey,
        match: promotionKey === expectedKey && !!expectedKey,
        requestedRole
      });

      let roleUser;
      if (promotionKey && expectedKey && promotionKey === expectedKey) {
          console.log("[AUTH] Attempting promotion to TechHead...");
          roleUser = await createOrPromoteToTechHead(user.email, user.name || "Tech Head");
      } else {
          roleUser = await ensureRoleUserByEmail(user.email, user.name, requestedRole, requestedPosition);
      }

      if (!roleUser) {
        console.log("[AUTH] signIn rejected: No roleUser found/created");
        return false;
      }

      console.log("[AUTH] roleUser identified", { role: roleUser.role, isVerified: roleUser.isVerified });

      user.id = roleUser.id;
      user.role = roleUser.role;
      user.isVerified = roleUser.isVerified;
      user.email = roleUser.email;
      user.name = roleUser.name;

      if (user.role !== "TechHead" && !user.isVerified) {
        console.log("[AUTH] Redirecting unverified user to /unverified");
        return "/unverified";
      }

      console.log("[AUTH] signIn successful for role:", user.role);
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        console.log("[AUTH] jwt callback - initial user found", { id: user.id, role: (user as any).role });
        token.id = user.id;
        token.role = (user as any).role;
        token.isVerified = (user as any).isVerified;
        token.email = user.email;
        token.name = user.name;
      }

      if ((!token.id || !token.role) && token.email) {
        console.log("[AUTH] jwt callback - re-fetching roleUser for email:", token.email);
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
      console.log("[AUTH] session callback triggered", { role: token.role });
      if (session.user && token.id && token.role && token.email) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isVerified = Boolean(token.isVerified);
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

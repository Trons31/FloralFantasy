import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const superAdminEmails = new Set(
  (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

function isRestrictedSuperAdminMode() {
  return superAdminEmails.size > 0;
}

function isAllowedSuperAdminEmail(email?: string | null) {
  if (!email) return false;
  if (!isRestrictedSuperAdminMode()) return true;
  return superAdminEmails.has(email.trim().toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (!isAllowedSuperAdminEmail(credentials.email)) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } }).catch(() => null);
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        if (isRestrictedSuperAdminMode() && user.role !== "SUPER_ADMIN") {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "SUPER_ADMIN" },
          }).catch(() => null);
          return { id: user.id, email: user.email, name: user.name, role: "SUPER_ADMIN" };
        }
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;
      if (!isAllowedSuperAdminEmail(user.email)) return false;

      const existing = await prisma.user.findUnique({ where: { email: user.email } }).catch(() => null);
      if (existing) {
        if (isRestrictedSuperAdminMode() && existing.role !== "SUPER_ADMIN") {
          await prisma.user.update({
            where: { id: existing.id },
            data: { role: "SUPER_ADMIN" },
          }).catch(() => null);
        }
        return true;
      }

      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name || "Usuario Google",
          password: crypto.randomBytes(24).toString("hex"),
          role: "SUPER_ADMIN",
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
      }
      return session;
    },
  },
};

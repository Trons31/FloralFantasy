import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } }).catch(() => null);
        if (!user) return null;
        if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;

        const authEmail = user.email ?? token.email;
        if (authEmail) {
          const dbUser = await prisma.user.findUnique({
            where: { email: authEmail },
            select: { role: true, name: true, email: true },
          }).catch(() => null);

          token.role = dbUser?.role ?? (user as any).role ?? token.role;
          token.name = dbUser?.name ?? token.name;
          token.email = dbUser?.email ?? token.email;
        } else {
          token.role = (user as any).role ?? token.role;
        }
      } else if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { role: true, name: true, email: true },
        }).catch(() => null);

        token.role = dbUser?.role ?? token.role;
        token.name = dbUser?.name ?? token.name;
        token.email = dbUser?.email ?? token.email;
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

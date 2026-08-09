import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const parent = await db.parent.findUnique({ where: { email } });
        if (!parent) return null;

        const valid = await bcrypt.compare(password, parent.passwordHash);
        if (!valid) return null;

        return { id: parent.id, email: parent.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.parentId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.parentId = token.parentId as string;
      return session;
    },
  },
});

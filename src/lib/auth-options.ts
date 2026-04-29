import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Email и пароль",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email }
        });

        if (!user || user.isBanned) return null;

        const isValidPassword = await compare(password, user.passwordHash);
        if (!isValidPassword) return null;

        await db.actionLog.create({
          data: {
            actorId: user.id,
            type: "LOGIN",
            entity: "User",
            entityId: user.id,
            metadata: { email: user.email }
          }
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          role: user.role,
          department: user.department
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.department = user.department;
        token.avatarUrl = user.image;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.department = token.department;
        session.user.avatarUrl = token.avatarUrl;
      }

      return session;
    }
  }
};

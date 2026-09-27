import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { isRole, type Role } from "@/lib/constants";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور ٦ أحرف على الأقل"),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "حساب تجريبي",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const profile = await db.profile.findUnique({ where: { email: email.toLowerCase() } });
        if (!profile) return null;
        const ok = await verifyPassword(password, profile.passwordHash);
        if (!ok) return null;
        // update last login event (non-blocking failure tolerated)
        try {
          await db.analyticsEvent.create({
            data: { type: "login", profileId: profile.id, metaJson: "{}" },
          });
        } catch {}
        return {
          id: profile.id,
          email: profile.email,
          name: profile.nickname,
          role: profile.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role ?? "reader";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.role = (isRole(token.role) ? token.role : "reader") as Role;
      }
      return session;
    },
  },
};

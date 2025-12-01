import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validators";
import { safeEmail } from "@/lib/sanitizer";
import bcrypt from "bcrypt";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth({
  // 開発環境のホスト検証エラー(UntrustedHost)を回避
  // 本番では AUTH_URL/NEXTAUTH_URL を正しく設定してください
  trustHost: true,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse({
          email: safeEmail(raw?.email),
          password: raw?.password
        });
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return { id: user.id, email: user.email, userType: user.userType };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        // authorize で userType を返しているため、ここで付与
        (token as any).userType = (user as any).userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        // 型 augment は別途typesで拡張済み。安全のため any 経由で取得
        (session.user as any).userType = (token as any).userType;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
});

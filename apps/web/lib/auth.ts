import { cache } from "react";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // GitHub 은 OAuth2(비 OIDC) 프로바이더라 @auth/core 가 issuer 를 모르면
      // 플레이스홀더 "https://authjs.dev" 를 씁니다.
      // (@auth/core/lib/actions/callback/oauth/callback.js: provider.issuer ?? "https://authjs.dev")
      // GitHub 이 콜백에 iss 파라미터를 보내기 시작하면서 이 값과 대조에 실패해
      // 로그인이 CallbackRouteError 로 끊겼습니다. 실제 발급자를 명시해 맞춥니다.
      issuer: "https://github.com",
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) return false;

      const provider = account.provider; // "github" | "google"

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? "Anonymous",
            image: user.image,
            provider,
          },
        });
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

// 한 요청 안에서 Header / 좋아요 / 댓글이 각각 auth() 를 부르면
// 쿠키 읽기와 JWT 검증이 그 횟수만큼 반복됩니다. React cache 로 요청 단위 dedupe.
export const getSession = cache(() => auth());

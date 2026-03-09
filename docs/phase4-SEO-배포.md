# Phase 4: SEO, OG 이미지, RSS, 배포 준비

> 동적 OG 이미지, sitemap/robots.txt(DB 기반), RSS 피드, JSON-LD, About 페이지

## 목차

1. [동적 OG 이미지](#1-동적-og-이미지)
2. [sitemap.xml (DB 기반)](#2-sitemapxml-db-기반)
3. [robots.txt](#3-robotstxt)
4. [RSS 피드](#4-rss-피드)
5. [OpenGraph 메타데이터](#5-opengraph-메타데이터)
6. [JSON-LD 구조화 데이터](#6-json-ld-구조화-데이터)
7. [About 페이지](#7-about-페이지)
8. [Scroll to Top 버튼](#8-scroll-to-top-버튼)
9. [Vercel 배포](#9-vercel-배포)

---

## 1. 동적 OG 이미지

OG(Open Graph) 이미지는 링크를 공유할 때 미리보기로 표시되는 이미지다. 매 포스트마다 다른 이미지를 보여주기 위해 동적으로 생성한다.

### app/api/og/route.tsx

```tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Dev Blog";
  const description = searchParams.get("description") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          backgroundColor: "#09090b",
          color: "#fafafa",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 28, color: "#a1a1aa" }}>
            {description}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 60, right: 80, fontSize: 24, color: "#71717a" }}>
          Dev Blog
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

**핵심:**
- `runtime = "edge"` — Edge Runtime에서 실행. 이미지 생성이 빠르고 Vercel의 Edge Network에서 캐시된다.
- `ImageResponse` — Next.js 내장. JSX로 이미지를 그린다. Satori라는 라이브러리가 내부적으로 JSX를 SVG로 변환하고 PNG로 렌더링한다.
- 크기: 1200×630px — OG 이미지의 표준 사이즈.

**사용법:**
```
/api/og?title=제목&description=설명
```

**주의사항:**
- Satori는 완전한 CSS를 지원하지 않는다. `display: flex`만 사용 가능하고, Tailwind 클래스는 쓸 수 없다. 인라인 style만 사용한다.
- 한글 폰트를 커스텀으로 넣으려면 폰트 파일을 fetch해서 `ImageResponse`의 옵션에 전달해야 한다. 기본 폰트로도 한글은 표시된다.

---

## 2. sitemap.xml (DB 기반)

검색 엔진이 사이트 구조를 파악할 수 있도록 sitemap을 생성한다.

### app/sitemap.ts

```ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devlog.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const tags = await prisma.tag.findMany({
    select: { slug: true },
  });

  const postEntries = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const tagEntries = tags.map((tag) => ({
    url: `${BASE_URL}/tags/${tag.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/tags`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...postEntries,
    ...tagEntries,
  ];
}
```

**Next.js의 sitemap 컨벤션:**
- `app/sitemap.ts`에서 함수를 export하면 Next.js가 자동으로 `/sitemap.xml` 경로를 생성한다.
- 별도의 API Route를 만들 필요 없다.
- `MetadataRoute.Sitemap` 타입이 반환 형식을 보장한다.

**DB 기반의 장점:**
- 정적 파일과 달리 글을 추가/삭제할 때마다 자동으로 반영된다.
- `lastModified`로 검색 엔진에 콘텐츠 업데이트 시점을 알려준다.

**priority 설정:**
- 1.0: 홈 (가장 중요)
- 0.9: 블로그 목록
- 0.8: 개별 포스트
- 0.5~0.6: 태그, About

---

## 3. robots.txt

### app/robots.ts

```ts
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devlog.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

- `/admin/` — 어드민 페이지는 크롤링 제외.
- `/api/` — API 엔드포인트도 크롤링 제외 (OG 이미지 등).
- `sitemap` — 검색 엔진에 sitemap 위치를 알려준다.

`sitemap.ts`와 마찬가지로 `app/robots.ts`에서 export하면 `/robots.txt`가 자동 생성된다.

---

## 4. RSS 피드

RSS를 통해 사용자가 RSS 리더(Feedly 등)로 블로그를 구독할 수 있다.

### app/api/rss/route.ts

```ts
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devlog.vercel.app";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
    },
  });

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt ?? ""}]]></description>
      <pubDate>${post.publishedAt?.toUTCString()}</pubDate>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Dev Blog</title>
    <link>${BASE_URL}</link>
    <description>개발과 기술에 대한 블로그</description>
    <language>ko</language>
    <atom:link href="${BASE_URL}/api/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
```

**포인트:**
- `<![CDATA[...]]>` — 제목이나 설명에 특수 문자(`<`, `>`, `&`)가 있어도 XML 파싱 에러가 발생하지 않도록.
- `atom:link rel="self"` — RSS 피드 자체의 URL. RSS 2.0 스펙 권장사항.
- `Cache-Control: s-maxage=3600` — Vercel의 CDN에서 1시간 캐시. 매 요청마다 DB를 조회하지 않는다.
- `take: 20` — 최근 20개의 글만 포함.

---

## 5. OpenGraph 메타데이터

### 전역 메타데이터 — app/layout.tsx

```tsx
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devlog.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Dev Blog",
    template: "%s | Dev Blog",
  },
  description: "개발과 기술에 대한 블로그",
  openGraph: {
    title: "Dev Blog",
    description: "개발과 기술에 대한 블로그",
    url: BASE_URL,
    siteName: "Dev Blog",
    locale: "ko_KR",
    type: "website",
    images: [`${BASE_URL}/api/og?title=Dev+Blog`],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    types: {
      "application/rss+xml": `${BASE_URL}/api/rss`,
    },
  },
};
```

**핵심:**
- `metadataBase` — 상대 URL을 절대 URL로 변환하는 기준. OG 이미지 등에서 사용.
- `title.template: "%s | Dev Blog"` — 하위 페이지에서 `title: "About"`으로 설정하면 `About | Dev Blog`가 된다.
- `openGraph.images` — 동적 OG 이미지 API를 가리킨다.
- `alternates.types` — RSS 피드 자동 발견(auto-discovery). 브라우저나 RSS 리더가 자동으로 피드를 찾는다.

### 포스트별 메타데이터 — app/blog/[slug]/page.tsx

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, status: "published" },
    select: { title: true, excerpt: true },
  });

  if (!post) return {};

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devlog.vercel.app";

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      images: [
        `${BASE_URL}/api/og?title=${encodeURIComponent(post.title)}`,
      ],
    },
  };
}
```

- 각 포스트마다 제목이 들어간 OG 이미지가 동적으로 생성된다.
- `type: "article"` — 포스트 페이지는 article 타입. 전역은 website 타입.
- `encodeURIComponent` — 제목에 한글이나 특수문자가 있어도 URL-safe하게 인코딩.

---

## 6. JSON-LD 구조화 데이터

JSON-LD는 검색 엔진(특히 Google)이 콘텐츠를 더 잘 이해할 수 있도록 구조화된 데이터를 제공하는 형식이다. Google 검색 결과에 리치 스니펫(게시일, 설명 등)이 표시될 수 있다.

### app/blog/[slug]/page.tsx (PostPage 컴포넌트 내부)

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.excerpt ?? undefined,
  datePublished: post.publishedAt?.toISOString(),
  dateModified: post.updatedAt.toISOString(),
  url: `${BASE_URL}/blog/${post.slug}`,
  image: `${BASE_URL}/api/og?title=${encodeURIComponent(post.title)}`,
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    {/* 페이지 본문 */}
  </>
);
```

**포인트:**
- `@type: "BlogPosting"` — schema.org의 블로그 포스팅 타입.
- `datePublished` / `dateModified` — ISO 8601 형식. Google이 콘텐츠 신선도를 판단하는 데 사용.
- `<script type="application/ld+json">` — HTML의 `<head>`가 아니라 `<body>` 어디에 넣어도 된다. Google은 둘 다 인식한다.
- Server Component에서 렌더링되므로 초기 HTML에 바로 포함된다.

---

## 7. About 페이지

### app/about/page.tsx

```tsx
export const metadata = {
  title: "About",
  description: "블로그 소개",
};

export default function AboutPage() {
  return (
    <div className="prose prose-gray max-w-none dark:prose-invert">
      <h1>About</h1>
      <p>안녕하세요! 개발과 기술에 대한 이야기를 기록하는 블로그입니다.</p>

      <h2>기술 스택</h2>
      <ul>
        <li>Next.js 15 (App Router, Turbopack)</li>
        <li>React 19 (Server Components)</li>
        <li>Tailwind CSS v4</li>
        <li>Supabase (PostgreSQL)</li>
        <li>Prisma ORM</li>
        <li>Vercel</li>
      </ul>

      <h2>Contact</h2>
      <ul>
        <li>GitHub: <a href="https://github.com/Bong-HoonLee">@Bong-HoonLee</a></li>
        <li>Email: <a href="mailto:devpeaceb@gmail.com">devpeaceb@gmail.com</a></li>
      </ul>
    </div>
  );
}
```

- `prose` 클래스 덕분에 별도 스타일링 없이 깔끔한 타이포그래피가 적용된다.
- 순수 Server Component. 클라이언트 JS 0.

---

## 8. Scroll to Top 버튼

### components/ui/scroll-to-top.tsx

```tsx
"use client";

import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 z-40 rounded-full bg-gray-200 p-3 shadow-lg hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      aria-label="맨 위로"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
```

**포인트:**
- `{ passive: true }` — 스크롤 이벤트 리스너에 passive 옵션. 브라우저가 스크롤 성능을 최적화할 수 있다.
- `window.scrollY > 400` — 400px 이상 스크롤했을 때만 버튼 표시.
- `behavior: "smooth"` — 부드러운 스크롤 애니메이션.
- `fixed bottom-8 right-8` — 화면 오른쪽 하단에 고정.

**ESLint 에러가 나지 않는 이유:**

ThemeToggle에서는 `useEffect` 안에서 `setState`를 직접 호출해서 에러가 났다. 하지만 여기서는 `setVisible`이 이벤트 콜백(`handleScroll`) 안에서 호출되므로 "외부 시스템 구독 → 콜백에서 setState"  패턴에 해당한다. 이 패턴은 React의 권장 사용법이므로 ESLint가 통과시킨다.

---

## 9. Vercel 배포

### 배포 방법

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. **New Project** → `Bong-HoonLee/devlog` 레포 선택
3. **Framework Preset**: Next.js (자동 감지)
4. **Root Directory**: `apps/web` (모노레포이므로 반드시 설정!)
5. **Environment Variables** 추가:

```
DATABASE_URL=postgresql://postgres.xxx:비밀번호@...6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:비밀번호@...5432/postgres
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=생성한_시크릿
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

6. **Deploy** 클릭

### 배포 후 추가 설정

**OAuth 콜백 URL 업데이트:**

배포되면 Vercel이 URL(예: `devlog-xxx.vercel.app`)을 부여한다. GitHub OAuth App과 Google OAuth 클라이언트의 콜백 URL을 업데이트해야 한다:

- GitHub: `https://your-domain.vercel.app/api/auth/callback/github`
- Google: `https://your-domain.vercel.app/api/auth/callback/google`

**어드민 계정 설정:**

1. 배포된 사이트에서 로그인 (GitHub 또는 Google)
2. Supabase 대시보드 → Table Editor → User 테이블
3. 본인 계정의 `role` 값을 `"user"` → `"admin"`으로 변경
4. 이제 `/admin`에 접근 가능

---

## 10. 실제 배포에서 만난 문제들과 해결

배포 가이드대로 하면 끝날 것 같지만, 실제로는 여러 문제를 만났다. 로컬에서는 잘 되는데 Vercel에서만 실패하는 케이스들이다.

### 10-1. Turborepo 환경변수 미전달

**증상:** Vercel 빌드 시 환경변수를 읽지 못함.

**원인:** Turborepo는 기본적으로 빌드 태스크에 환경변수를 전달하지 않는다. 명시적으로 선언해야 한다.

**해결:** `turbo.json`의 `build` 태스크에 `env` 배열 추가.

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"],
      "env": [
        "DATABASE_URL", "DIRECT_URL",
        "NEXTAUTH_SECRET", "NEXTAUTH_URL",
        "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET",
        "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
        "NEXT_PUBLIC_SITE_URL"
      ]
    }
  }
}
```

**교훈:** Turborepo 모노레포에서는 환경변수를 turbo.json에 선언하지 않으면 빌드 캐시에도 영향을 준다. 환경변수가 바뀌어도 캐시가 무효화되지 않는 문제가 생길 수 있다.

### 10-2. Prisma Client 미생성

**증상:** `@prisma/client did not initialize yet. Please run "prisma generate"`

**원인:** 모노레포 구조에서 Prisma schema가 `apps/web/prisma/schema.prisma`에 있는데, Prisma의 postinstall 스크립트가 이 경로를 자동으로 찾지 못한다.

**해결:** `apps/web/package.json`의 build 스크립트에 `prisma generate`를 추가.

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

**교훈:** 모노레포에서 Prisma를 사용하면 schema 경로가 기본 위치(`prisma/schema.prisma`)가 아닐 수 있다. 빌드 전에 반드시 `prisma generate`를 실행해야 한다.

### 10-3. TypeScript implicit any 타입 에러

**증상:** 로컬 빌드는 성공하는데 Vercel에서 `Parameter 'xxx' implicitly has an 'any' type` 에러 발생.

**원인:** 로컬에서는 `prisma generate`로 생성된 타입이 캐시되어 있어서 `.map()` 콜백의 파라미터 타입이 자동 추론된다. 하지만 Vercel의 clean build 환경에서는 타입 체크 시점에 Prisma 타입이 아직 준비되지 않을 수 있다.

**해결:** Prisma 쿼리 결과에 대한 `.map()`, `.filter()` 콜백에 명시적 타입 어노테이션 추가.

```tsx
// Before (로컬에서만 동작)
posts.map((post) => ({ ... }))

// After (Vercel에서도 동작)
posts.map((post: { slug: string; updatedAt: Date }) => ({ ... }))
```

**영향 받은 파일들:**
- `app/api/rss/route.ts` — RSS 피드의 post 매핑
- `app/sitemap.ts` — sitemap의 post, tag 매핑
- `app/tags/page.tsx` — 태그 필터링
- `app/page.tsx`, `app/blog/page.tsx` — 포스트 목록
- `app/blog/[slug]/page.tsx` — 태그 표시
- `app/tags/[tag]/page.tsx` — 태그별 포스트
- `components/comments/comment-list.tsx` — 댓글 목록
- 기타 모든 `.map()` 콜백

**교훈:** TypeScript strict mode에서 Prisma를 사용할 때, 특히 모노레포 + CI 환경에서는 타입 추론에 의존하지 말고 명시적으로 타입을 지정하는 것이 안전하다.

### 10-4. Edge Function 크기 제한 초과

**증상:** `The Edge Function "middleware" size is 1.01 MB and your plan size limit is 1 MB`

**원인:** middleware에서 NextAuth의 `auth()` 함수를 import하면, NextAuth + Prisma + jose 등 전체 번들이 Edge Function에 포함된다. Vercel Hobby 플랜의 Edge Function 크기 제한은 1MB.

**처음 시도한 해결:** middleware에서 `auth()` 대신 `getToken()`(next-auth/jwt)으로 교체. 140KB → 45.7KB로 감소.

```ts
// middleware.ts (경량화 버전)
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.redirect(new URL("/auth/signin", req.url));
  if (token.role !== "admin") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}
```

### 10-5. Edge Runtime에서 JWT 토큰 검증 실패

**증상:** middleware에서 `getToken()`이 토큰을 제대로 읽지 못해, 로그인 후에도 `/admin` 접근 시 로그인 페이지로 리다이렉트됨.

**원인:** NextAuth v5(beta)의 `getToken()`이 Edge Runtime에서 JWT 쿠키를 안정적으로 파싱하지 못하는 문제.

**최종 해결:** middleware를 완전히 제거하고, admin layout(Server Component)에서 `auth()`로 인증 체크.

```tsx
// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/");
  return <div>{children}</div>;
}
```

**교훈:** Edge Runtime은 제약이 많다. 인증 체크처럼 DB 접근이 필요한 로직은 Server Component(Node.js Runtime)에서 처리하는 것이 더 안정적이다. middleware는 단순한 리다이렉트나 헤더 조작 정도에만 사용하는 것이 좋다.

### 10-6. NextAuth v5 환경변수 네이밍

**증상:** GitHub/Google 로그인 클릭 시 500 에러 또는 404 에러.

**원인:** NextAuth v5는 Provider를 옵션 없이 사용하면(`[GitHub, Google]`) 환경변수를 `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` 형식으로 찾는다. 하지만 우리는 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`으로 설정했다.

**해결:** Provider에 환경변수를 명시적으로 전달.

```ts
// lib/auth.ts
providers: [
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  }),
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
],
```

**교훈:** NextAuth v5(beta)는 아직 안정 버전이 아니라 문서와 실제 동작이 다를 수 있다. 환경변수 자동 감지에 의존하지 말고 명시적으로 전달하는 것이 안전하다.

### 10-7. Google OAuth "앱 게시" 필요

**증상:** Google 로그인 시 `The OAuth client was not found` (401 에러).

**원인:** Google Cloud Console에서 OAuth 동의 화면의 게시 상태가 "테스트"로 되어 있으면, 테스트 사용자로 등록된 계정만 로그인 가능. 프로덕션 배포 시에는 "앱 게시"가 필요.

**해결:** Google Cloud Console → OAuth 동의 화면 → Audience → **Publish App** 클릭.

**교훈:** Google OAuth는 개발/테스트 단계에서는 테스트 모드로 충분하지만, 실제 배포 시 반드시 앱을 게시해야 한다.

---

## 배포 트러블슈팅 요약

| 문제 | 원인 | 해결 |
|------|------|------|
| 환경변수 미전달 | Turborepo 기본 설정 | turbo.json에 env 배열 추가 |
| Prisma Client 미생성 | 모노레포 경로 문제 | build 스크립트에 prisma generate 추가 |
| implicit any 타입 에러 | Vercel clean build 환경 | .map() 콜백에 명시적 타입 |
| Edge Function 크기 초과 | NextAuth 번들 크기 | middleware 제거, layout에서 인증 |
| JWT 토큰 검증 실패 | Edge Runtime 제약 | Server Component에서 auth() 사용 |
| OAuth 500/404 에러 | NextAuth v5 env 네이밍 | Provider에 명시적 전달 |
| Google OAuth 401 | 앱 미게시 | Publish App 클릭 |

---

## Phase 4 완료 요약

| 항목 | 상태 |
|------|------|
| 동적 OG 이미지 (Edge Runtime) | ✅ |
| sitemap.xml (DB 기반, 자동 생성) | ✅ |
| robots.txt | ✅ |
| RSS 피드 (캐싱 포함) | ✅ |
| OpenGraph 메타데이터 (전역 + 포스트별) | ✅ |
| JSON-LD 구조화 데이터 | ✅ |
| About 페이지 | ✅ |
| Scroll to Top 버튼 | ✅ |
| Vercel 배포 가이드 | ✅ |

### 이 시점의 프로젝트 구조 (Phase 3에서 추가된 부분)

```
apps/web/
├── app/
│   ├── about/page.tsx          ← About 페이지
│   ├── api/
│   │   ├── og/route.tsx        ← 동적 OG 이미지 (Edge)
│   │   └── rss/route.ts        ← RSS 피드
│   ├── sitemap.ts              ← sitemap.xml 자동 생성
│   ├── robots.ts               ← robots.txt 자동 생성
│   ├── layout.tsx              ← OpenGraph, RSS 메타데이터 추가
│   └── blog/[slug]/page.tsx    ← JSON-LD, OG 이미지 추가
└── components/
    └── ui/
        └── scroll-to-top.tsx   ← 맨 위로 스크롤 버튼
```

### 전체 프로젝트 빌드 결과

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      175 B         105 kB
├ ○ /about                                 142 B         102 kB
├ ○ /admin                                 142 B         102 kB
├ ○ /admin/posts                           175 B         105 kB
├ ƒ /admin/posts/[id]                    1.02 kB         103 kB
├ ○ /admin/posts/new                     1.02 kB         103 kB
├ ƒ /api/auth/[...nextauth]                142 B         102 kB
├ ƒ /api/og                                142 B         102 kB
├ ƒ /api/rss                               142 B         102 kB
├ ○ /auth/signin                           142 B         102 kB
├ ○ /blog                                  175 B         105 kB
├ ƒ /blog/[slug]                         7.18 kB         112 kB
├ ○ /robots.txt                            142 B         102 kB
├ ○ /sitemap.xml                           142 B         102 kB
├ ○ /tags                                  175 B         105 kB
└ ƒ /tags/[tag]                            175 B         105 kB
```

모든 정적 페이지(○)는 142~175B의 극소량 JS만 로드된다. Server Component 중심 설계의 효과.

# Phase 1: 기반 구축

> Turborepo + pnpm 모노레포, Next.js 15, Tailwind v4, Prisma + Supabase 연동까지

## 목차

1. [환경 확인](#1-환경-확인)
2. [pnpm 설치](#2-pnpm-설치)
3. [모노레포 구조 잡기](#3-모노레포-구조-잡기)
4. [Next.js 앱 생성](#4-nextjs-앱-생성)
5. [Tailwind CSS v4 + 다크모드 설정](#5-tailwind-css-v4--다크모드-설정)
6. [기본 레이아웃 구현](#6-기본-레이아웃-구현)
7. [Prisma 스키마 설계](#7-prisma-스키마-설계)
8. [의존성 설치와 삽질](#8-의존성-설치와-삽질)
9. [Supabase 프로젝트 생성 및 연동](#9-supabase-프로젝트-생성-및-연동)
10. [DB 마이그레이션](#10-db-마이그레이션)
11. [빌드 테스트와 삽질](#11-빌드-테스트와-삽질)
12. [Git 초기화 및 GitHub 연동](#12-git-초기화-및-github-연동)

---

## 1. 환경 확인

프로젝트를 시작하기 전에 Node.js 버전을 확인한다.

```bash
node -v
# v20.16.0
```

Node.js 20 이상이면 OK. Next.js 15는 Node.js 18.17 이상을 요구한다.

---

## 2. pnpm 설치

이 프로젝트는 패키지 매니저로 **pnpm**을 사용한다. npm보다 빠르고, 모노레포 워크스페이스를 네이티브로 지원한다.

```bash
npm install -g pnpm
pnpm -v
# 10.31.0
```

---

## 3. 모노레포 구조 잡기

프로젝트 루트에 3개의 설정 파일을 만든다.

### package.json (루트)

```json
{
  "name": "my-blog",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "pnpm@10.31.0"
}
```

- `private: true` — 루트 패키지는 npm에 배포하지 않는다.
- `turbo` — Turborepo가 모노레포 내 여러 앱/패키지의 빌드를 병렬로 처리해준다.
- `packageManager` — pnpm 버전을 명시해서 팀원 간 일관성을 유지한다.

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

pnpm에게 "apps/와 packages/ 하위의 폴더들이 각각 독립 패키지야"라고 알려주는 파일이다.

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

- `build`의 `dependsOn: ["^build"]` — 의존하는 패키지를 먼저 빌드한다.
- `dev`의 `persistent: true` — dev 서버는 끝나지 않는 프로세스이므로 이 설정이 필요하다.
- `outputs` — 빌드 캐시 대상. `.next/cache`는 제외한다.

### .gitignore

```
node_modules/
.next/
.turbo/
dist/
.env
.env.local
.env.production.local
*.tsbuildinfo
```

**중요:** `.env`와 `.env.local`은 반드시 gitignore에 포함해야 한다. DB 비밀번호, OAuth 시크릿 등 민감한 정보가 들어가기 때문.

---

## 4. Next.js 앱 생성

`create-next-app`을 사용하지 않고 직접 구조를 잡았다. 이유는 모노레포 안에 넣어야 하기 때문.

### 디렉토리 생성

```bash
mkdir -p apps/web
```

### apps/web/package.json

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "next-themes": "^0.4",
    "framer-motion": "^11",
    "@prisma/client": "^6"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "postcss": "^8",
    "prisma": "^6",
    "eslint": "^9",
    "eslint-config-next": "^15",
    "@eslint/eslintrc": "^3"
  }
}
```

**포인트:**
- `next dev --turbopack` — Turbopack을 사용하면 dev 서버 시작이 훨씬 빠르다.
- `next-themes` — 다크모드 구현용.
- `@prisma/client`는 dependencies에, `prisma` CLI는 devDependencies에 넣는다.

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- `strict: true` — TypeScript strict mode. 타입 안전성을 위해 반드시 켠다.
- `paths: { "@/*": ["./*"] }` — `@/components/...` 같은 절대 경로 import를 가능하게 한다.

### next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

나중에 이미지 도메인, 리다이렉트 등 설정을 추가할 예정.

### postcss.config.mjs

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Tailwind CSS v4**부터는 `tailwind.config.ts`가 아니라 **PostCSS 플러그인**으로 설정한다. 기존의 `tailwindcss` 플러그인 대신 `@tailwindcss/postcss`를 사용한다.

---

## 5. Tailwind CSS v4 + 다크모드 설정

### app/globals.css

```css
@import "tailwindcss";

@theme {
  --font-sans: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont,
    system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo",
    "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;

  --color-primary: #2563eb;
  --color-primary-dark: #3b82f6;
}

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100;
  font-family: var(--font-sans);
}
```

**Tailwind v4의 변경점:**
- `tailwind.config.ts` 대신 CSS 안에서 `@theme` 블록으로 커스텀 변수를 정의한다.
- `@import "tailwindcss"` 한 줄로 Tailwind를 불러온다 (기존의 `@tailwind base/components/utilities` 대신).
- `dark:` 클래스는 네이티브로 동작한다.

---

## 6. 기본 레이아웃 구현

### 다크모드 토글 — `components/ui/theme-toggle.tsx`

```tsx
"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="테마 전환"
    >
      {theme === "dark" ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
```

**삽질 포인트: `useEffect` → `useSyncExternalStore`**

처음에는 흔히 쓰는 패턴으로 작성했다:

```tsx
// ❌ 이렇게 하면 ESLint 에러 발생
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
```

React 19 + eslint-plugin-react-hooks v7에서 `react-hooks/set-state-in-effect` 규칙이 추가되어 **useEffect 안에서 직접 setState 호출을 금지**한다.

화살표 함수로 감싸도(`() => { setMounted(true); }`) 동일하게 에러가 발생한다.

해결법: `useSyncExternalStore`를 사용한다. 서버에서는 `false`, 클라이언트에서는 `true`를 반환하는 구독 패턴으로 hydration mismatch 없이 마운트 여부를 판단할 수 있다.

### Header — `components/layout/header.tsx`

```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/blog", label: "Blog" },
  { href: "/tags", label: "Tags" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Dev Blog
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
```

- `sticky top-0` + `backdrop-blur-sm` — 스크롤해도 헤더가 상단에 고정되며 반투명 블러 효과.
- `bg-white/80` — 80% 불투명도. 스크롤 시 뒤 콘텐츠가 살짝 비쳐보인다.
- Header는 Server Component다. `"use client"` 없이도 동작한다. ThemeToggle만 Client Component.

### Footer — `components/layout/footer.tsx`

```tsx
export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Dev Blog. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

### 루트 레이아웃 — `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dev Blog",
    template: "%s | Dev Blog",
  },
  description: "개발과 기술에 대한 블로그",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**핵심:**
- `suppressHydrationWarning` — next-themes가 `<html>`에 class를 주입할 때 hydration 경고를 방지한다. 반드시 필요.
- `ThemeProvider`의 `attribute="class"` — Tailwind의 `dark:` 클래스 기반 다크모드와 연동.
- `enableSystem` — 사용자 OS 설정(다크/라이트)을 따른다.
- `flex min-h-screen flex-col` + `flex-1` — Footer가 항상 하단에 위치하도록 하는 레이아웃 트릭.

### 메인 페이지 — `app/page.tsx`

```tsx
export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Dev Blog</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          개발과 기술에 대한 이야기를 기록합니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">최근 포스트</h2>
        <p className="text-gray-500 dark:text-gray-400">
          아직 작성된 포스트가 없습니다.
        </p>
      </section>
    </div>
  );
}
```

---

## 7. Prisma 스키마 설계

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String
  excerpt     String?
  status      String    @default("draft")
  publishedAt DateTime?
  viewCount   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  tags        PostTag[]
  comments    Comment[]
  likes       Like[]
  series      Series?   @relation(fields: [seriesId], references: [id])
  seriesId    String?
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  slug  String    @unique
  posts PostTag[]
}

model PostTag {
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId  String

  @@id([postId, tagId])
}

model Series {
  id          String  @id @default(cuid())
  title       String
  slug        String  @unique
  description String?
  posts       Post[]
}

model User {
  id            String         @id @default(cuid())
  name          String
  email         String         @unique
  image         String?
  provider      String
  role          String         @default("user")
  comments      Comment[]
  reactions     Reaction[]
  likes         Like[]
  notifications Notification[]
  createdAt     DateTime       @default(now())
}

model Comment {
  id            String         @id @default(cuid())
  content       String
  post          Post           @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId        String
  user          User           @relation(fields: [userId], references: [id])
  userId        String
  parent        Comment?       @relation("CommentThread", fields: [parentId], references: [id])
  parentId      String?
  replies       Comment[]      @relation("CommentThread")
  reactions     Reaction[]
  notifications Notification[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Reaction {
  id        String   @id @default(cuid())
  emoji     String
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())

  @@unique([commentId, userId, emoji])
}

model Notification {
  id        String   @id @default(cuid())
  type      String
  isRead    Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId String
  createdAt DateTime @default(now())
}

model Like {
  id        String   @id @default(cuid())
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())

  @@unique([postId, userId])
}
```

**설계 포인트:**
- `directUrl` — Supabase의 Transaction Pooler(pgbouncer)를 사용할 때, 마이그레이션은 직접 연결(Direct URL)로 해야 한다. `url`은 Pooler용, `directUrl`은 마이그레이션용.
- `PostTag` — Post와 Tag의 다대다(M:N) 관계를 명시적 조인 테이블로 구현. `@@id([postId, tagId])`로 복합 기본키.
- `Comment`의 자기참조 — `parent`/`replies`로 대댓글(쓰레드) 구현. `parentId`가 null이면 최상위 댓글.
- `@@unique([commentId, userId, emoji])` — 같은 댓글에 같은 유저가 같은 이모지를 중복으로 남기지 못하게.
- `@@unique([postId, userId])` — 같은 글에 같은 유저가 좋아요를 중복으로 누르지 못하게.
- `onDelete: Cascade` — 글이 삭제되면 관련 댓글, 좋아요도 함께 삭제.

### Prisma 클라이언트 싱글턴 — `lib/prisma.ts`

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**왜 싱글턴이 필요한가?**

Next.js dev 서버는 핫 리로드할 때마다 모듈을 다시 로드한다. 그때마다 `new PrismaClient()`가 호출되면 DB 연결이 계속 쌓인다. `globalThis`에 저장해두면 기존 인스턴스를 재사용한다.

### 유틸리티 — `lib/utils.ts`

```ts
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
```

- `formatDate` — "2026년 3월 9일" 형식의 한국어 날짜.
- `slugify` — 글 제목을 URL-safe한 slug로 변환. 한글도 허용.

---

## 8. 의존성 설치와 삽질

```bash
pnpm install
```

### 삽질: pnpm 빌드 스크립트 차단

pnpm v10부터 보안상의 이유로 패키지의 postinstall 스크립트를 기본적으로 차단한다. 설치 후 이런 경고가 나왔다:

```
╭ Warning ──────────────────────────────────────────────────╮
│ Ignored build scripts: @prisma/client@6.19.2,             │
│ @prisma/engines@6.19.2, prisma@6.19.2, sharp@0.34.5,     │
│ unrs-resolver@1.11.1.                                     │
│ Run "pnpm approve-builds" to pick which dependencies      │
│ should be allowed to run scripts.                         │
╰───────────────────────────────────────────────────────────╯
```

`pnpm approve-builds`는 대화형(interactive) 명령이라 CLI에서 사용이 불편했다. 대신 `package.json`에 직접 허용 목록을 추가했다:

```json
{
  "pnpm": {
    "onlyBuiltDependencies": [
      "@prisma/client",
      "@prisma/engines",
      "prisma",
      "sharp",
      "unrs-resolver"
    ]
  }
}
```

이렇게 하면 명시한 패키지들의 빌드 스크립트가 실행된다. 다시 설치:

```bash
pnpm install
```

이번에는 Prisma의 postinstall이 정상 실행된다.

### 삽질: ESLint 플러그인 누락

첫 빌드 시 ESLint 에러가 발생했다:

```
Failed to load plugin 'react-hooks' declared in eslint-config-next
Cannot find module 'eslint-plugin-react-hooks'
```

`eslint-config-next`가 내부적으로 `eslint-plugin-react-hooks`를 필요로 하는데, pnpm의 strict 의존성 관리 때문에 자동으로 설치되지 않았다. 직접 추가:

```bash
pnpm --filter web add -D eslint-plugin-react-hooks eslint-plugin-import
```

---

## 9. Supabase 프로젝트 생성 및 연동

### Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com) 접속 → 로그인
2. New Project 생성
3. **Enable automatic RLS** 옵션 활성화 (보안을 위해 권장)
4. Database password 설정 → **이 비밀번호를 꼭 기억해야 한다**

### Connection String 찾기

프로젝트 생성 후 대시보드 상단의 **Connect** 버튼을 클릭하면 3가지 연결 문자열이 나온다:

- **Direct Connection** — 직접 연결 (IPv6)
- **Session Pooler** (port 5432) — 장기 연결용
- **Transaction Pooler** (port 6543) — **서버리스 환경에 적합. 우리는 이걸 사용**

> ⚠️ "Project Settings > Database"에서 Connection string을 찾으려 하면 안 보일 수 있다. **대시보드 상단의 Connect 버튼**이 정확한 위치다.

### .env.local 설정

```env
# Supabase / PostgreSQL
DATABASE_URL="postgresql://postgres.[프로젝트ref]:[비밀번호]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[프로젝트ref]:[비밀번호]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

**포인트:**
- `DATABASE_URL` (Transaction Pooler, port 6543) — `?pgbouncer=true` 파라미터가 필수. Prisma가 pgbouncer 모드에 맞게 동작한다.
- `DIRECT_URL` (Session Pooler, port 5432) — 마이그레이션 전용. pgbouncer를 거치지 않고 직접 연결.

---

## 10. DB 마이그레이션

### 삽질: Prisma가 .env.local을 못 읽는다

```bash
npx prisma migrate dev --name init
# Error: Environment variable not found: DIRECT_URL.
```

**Prisma는 `.env.local`이 아니라 `.env` 파일만 읽는다.** Next.js는 `.env.local`을 읽지만 Prisma CLI는 별도 프로세스라서 `.env`만 인식한다.

해결법: `.env.local`을 `.env`로 복사한다.

```bash
cp .env.local .env
```

다시 마이그레이션:

```bash
npx prisma migrate dev --name init
```

```
Applying migration `20260308170230_init`
Your database is now in sync with your schema.
✔ Generated Prisma Client
```

성공! Supabase PostgreSQL에 모든 테이블이 생성되었다.

---

## 11. 빌드 테스트와 삽질

```bash
pnpm --filter web build
```

### 삽질: ThemeToggle ESLint 에러 (위 6번에서 상세 설명)

`useEffect` 안에서 `setState` 직접 호출 → `useSyncExternalStore` 패턴으로 교체하여 해결.

### 최종 빌드 결과

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      132 B         102 kB
└ ○ /_not-found                            994 B         103 kB

○  (Static)  prerendered as static content
```

빌드 성공!

---

## 12. Git 초기화 및 GitHub 연동

### Git 초기화

```bash
git init
git add -A
git commit -m "init: devlog 프로젝트 초기화 (Next.js, Tailwind, Prisma)"
```

### GitHub CLI 설치

```bash
# Windows
winget install --id GitHub.cli -e

# 설치 확인
gh --version
```

### GitHub 로그인

```bash
gh auth login --web -p https
```

브라우저가 열리며 인증 코드를 입력하라고 나온다. 표시된 코드를 https://github.com/login/device 에 입력하면 로그인 완료.

### 레포지토리 생성 & 푸시

```bash
gh repo create Bong-HoonLee/devlog --public --description "개발 블로그 & 포트폴리오" --source . --push
```

이 한 줄로:
1. GitHub에 `devlog` 레포가 생성되고
2. 로컬의 `.`을 소스로 연결하고
3. 자동으로 push까지 된다.

결과: https://github.com/Bong-HoonLee/devlog

---

## Phase 1 완료 요약

| 항목 | 상태 |
|------|------|
| Turborepo + pnpm 모노레포 | ✅ |
| Next.js 15 (App Router, Turbopack) | ✅ |
| Tailwind CSS v4 + 다크모드 | ✅ |
| Prisma 스키마 설계 | ✅ |
| Supabase 연동 + DB 마이그레이션 | ✅ |
| 기본 레이아웃 (Header, Footer) | ✅ |
| Git + GitHub 연동 | ✅ |

### 이 시점의 프로젝트 구조

```
my-blog/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── header.tsx
│       │   │   └── footer.tsx
│       │   └── ui/
│       │       └── theme-toggle.tsx
│       ├── lib/
│       │   ├── prisma.ts
│       │   └── utils.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── .env.local
│       ├── .env
│       ├── .env.example
│       ├── next.config.ts
│       ├── postcss.config.mjs
│       ├── tsconfig.json
│       └── package.json
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── CLAUDE.md
```

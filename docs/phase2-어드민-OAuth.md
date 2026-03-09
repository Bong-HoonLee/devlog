# Phase 2: 어드민 시스템 & OAuth 인증

> NextAuth.js v5로 GitHub/Google 로그인, 어드민 보호 미들웨어, 글 CRUD Server Actions

## 목차

1. [NextAuth.js v5 설치](#1-nextauthjs-v5-설치)
2. [NextAuth 설정](#2-nextauth-설정)
3. [타입 확장](#3-타입-확장)
4. [API 라우트 연결](#4-api-라우트-연결)
5. [어드민 보호 미들웨어](#5-어드민-보호-미들웨어)
6. [로그인 페이지](#6-로그인-페이지)
7. [글 CRUD Server Actions](#7-글-crud-server-actions)
8. [어드민 페이지 구현](#8-어드민-페이지-구현)
9. [OAuth 설정 (GitHub + Google)](#9-oauth-설정-github--google)
10. [빌드 테스트와 삽질](#10-빌드-테스트와-삽질)

---

## 1. NextAuth.js v5 설치

```bash
pnpm --filter web add next-auth@beta @auth/prisma-adapter
```

NextAuth v5는 아직 beta 태그다. `next-auth@beta`로 설치해야 v5가 들어온다. 그냥 `next-auth`로 설치하면 v4가 깔린다.

> `@auth/prisma-adapter`도 설치했지만, 우리는 커스텀 User 모델을 사용하기 때문에 어댑터를 직접 사용하지 않고 콜백에서 수동으로 유저를 관리한다.

---

## 2. NextAuth 설정

### lib/auth.ts

```ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub, Google],
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
```

**동작 흐름:**

1. 사용자가 GitHub/Google 로그인 클릭
2. `signIn` 콜백 → DB에 유저가 없으면 생성, 있으면 통과
3. `jwt` 콜백 → DB에서 유저 정보(id, role)를 JWT 토큰에 저장
4. `session` 콜백 → JWT의 정보를 세션 객체에 주입

**왜 Prisma Adapter를 안 쓰나?**

NextAuth의 공식 Prisma Adapter는 `Account`, `Session`, `VerificationToken` 등의 테이블을 요구한다. 우리 스키마에는 이런 테이블이 없고, User 모델도 다르게 설계했다(provider 필드 등). 그래서 콜백에서 직접 유저를 관리하는 게 더 깔끔하다.

**`pages.signIn`** — 기본 로그인 페이지 대신 우리가 만든 `/auth/signin` 페이지를 사용한다.

---

## 3. 타입 확장

### types/next-auth.d.ts

```ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

NextAuth의 기본 Session 타입에는 `id`와 `role`이 없다. TypeScript에서 `session.user.id`나 `session.user.role`에 접근하려면 모듈 선언을 확장해야 한다.

---

## 4. API 라우트 연결

### app/api/auth/[...nextauth]/route.ts

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

NextAuth v5는 App Router의 Route Handler로 동작한다. `[...nextauth]`는 catch-all 라우트로, `/api/auth/signin`, `/api/auth/callback/github` 등 모든 인증 관련 경로를 처리한다.

---

## 5. 어드민 보호 미들웨어

### middleware.ts (apps/web 루트에 위치)

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");

  if (isAdmin) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    if (req.auth.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
```

**동작:**
1. `/admin`으로 시작하는 모든 경로에서 미들웨어가 실행된다.
2. 로그인 안 했으면 → `/auth/signin`으로 리다이렉트.
3. 로그인은 했지만 role이 "admin"이 아니면 → 홈(`/`)으로 리다이렉트.

**`matcher`** — 미들웨어가 실행될 경로를 제한한다. 모든 요청에서 실행되면 성능에 영향을 주므로, `/admin` 경로에서만 동작하도록 설정.

> 나중에 Supabase에서 직접 DB의 User 테이블에서 본인 계정의 `role` 값을 `"admin"`으로 변경해야 어드민 페이지에 접근할 수 있다.

---

## 6. 로그인 페이지

### app/auth/signin/page.tsx

```tsx
import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            소셜 계정으로 로그인하세요
          </p>
        </div>
        <div className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {/* GitHub SVG 아이콘 */}
              GitHub으로 로그인
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Google SVG 아이콘 */}
              Google로 로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**포인트:**
- Server Action으로 로그인을 처리한다. `"use server"` 안에서 `signIn()`을 호출.
- `redirectTo: "/"` — 로그인 성공 후 홈으로 이동.
- 이 페이지는 Server Component다. `"use client"` 없이 form + Server Action만으로 동작.

---

## 7. 글 CRUD Server Actions

### actions/posts.ts

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}
```

**`requireAdmin()`** — 모든 CRUD 함수에서 호출하는 인증 가드. 미들웨어는 페이지 접근만 막지만, Server Action은 직접 호출될 수 있으므로 이중 보호가 필요하다.

### 글 생성 (createPost)

```ts
export async function createPost(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string | null;
  const status = formData.get("status") as string;
  const tags = (formData.get("tags") as string)
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const slug = slugify(title);

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      status,
      publishedAt: status === "published" ? new Date() : null,
      tags: tags?.length
        ? {
            create: tags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: slugify(tagName) },
                  create: { name: tagName, slug: slugify(tagName) },
                },
              },
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect(`/admin/posts/${post.id}`);
}
```

**핵심:**
- `connectOrCreate` — 태그가 이미 있으면 연결하고, 없으면 새로 만든다. 수동으로 "태그 있는지 확인 → 없으면 생성"할 필요 없음.
- `revalidatePath` — ISR 캐시를 무효화한다. 글을 생성하면 글 목록 페이지의 캐시가 갱신되어야 하므로.
- `redirect` — 생성 후 수정 페이지로 이동.

### 글 수정 (updatePost)

```ts
export async function updatePost(id: string, formData: FormData) {
  await requireAdmin();

  // ... formData 파싱 ...

  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { status: true, publishedAt: true },
  });

  // 처음 published 될 때만 publishedAt 설정
  const publishedAt =
    status === "published" && existingPost?.status !== "published"
      ? new Date()
      : existingPost?.publishedAt;

  // 기존 태그 삭제 후 새로 연결
  await prisma.postTag.deleteMany({ where: { postId: id } });

  await prisma.post.update({
    where: { id },
    data: { /* ... */ },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
}
```

**포인트:**
- `publishedAt`은 처음 "published"가 될 때만 설정된다. 이미 발행된 글을 수정해도 발행일은 바뀌지 않는다.
- 태그 업데이트 전략: 기존 PostTag를 전부 삭제하고 새로 생성한다. 개별적으로 diff를 계산하는 것보다 간단하고 확실하다.

### 글 삭제 / 조회

```ts
export async function deletePost(id: string) {
  await requireAdmin();
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getPosts() {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}
```

`include: { tags: { include: { tag: true } } }` — PostTag 조인 테이블을 거쳐서 실제 Tag 데이터까지 가져온다. Prisma의 중첩 include.

---

## 8. 어드민 페이지 구현

### 어드민 레이아웃 — `app/admin/layout.tsx`

```tsx
import Link from "next/link";

const adminNav = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/posts", label: "글 관리" },
  { href: "/admin/posts/new", label: "새 글 작성" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
        <h1 className="text-2xl font-bold">Admin</h1>
        <nav className="flex gap-4">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
```

App Router의 **Nested Layout**. `/admin` 하위 모든 페이지가 이 레이아웃 안에 렌더링된다. 어드민 전용 네비게이션을 한 번만 정의하면 된다.

### 대시보드 — `app/admin/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [postCount, publishedCount, draftCount, commentCount] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.comment.count(),
    ]);

  // ... 통계 카드 렌더링 ...
}
```

`Promise.all`로 4개의 DB 쿼리를 병렬 실행한다. 순차 실행보다 빠르다.

### 글 에디터 컴포넌트 — `components/admin/post-editor.tsx`

```tsx
"use client";

import { useActionState } from "react";

interface PostEditorProps {
  action: (prevState: string | null, formData: FormData) => Promise<string | null>;
  initialData?: {
    title: string;
    content: string;
    excerpt: string;
    tags: string;
    status: string;
  };
}

export function PostEditor({ action, initialData }: PostEditorProps) {
  const [error, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {/* 제목, 요약, 내용(textarea), 태그, 상태 선택, 저장 버튼 */}
    </form>
  );
}
```

**`useActionState` (React 19)**
- React 19에서 새로 추가된 Hook. 기존의 `useFormState` 대체.
- 반환값: `[state, formAction, isPending]`
- `isPending` — 서버 액션 실행 중일 때 `true`. 버튼을 "저장 중..."으로 바꾸는 데 사용.
- `state` — 서버 액션의 반환값. 에러 메시지를 표시하는 데 사용.

이 컴포넌트는 **새 글 작성**과 **글 수정** 모두에서 재사용된다. `initialData`가 있으면 수정 모드, 없으면 생성 모드.

### 새 글 작성 — `app/admin/posts/new/page.tsx`

```tsx
import { PostEditor } from "@/components/admin/post-editor";
import { createPost } from "@/actions/posts";

export default function NewPostPage() {
  async function action(
    _prevState: string | null,
    formData: FormData
  ): Promise<string | null> {
    "use server";
    try {
      await createPost(formData);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "오류가 발생했습니다.";
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">새 글 작성</h2>
      <PostEditor action={action} />
    </div>
  );
}
```

Server Component에서 Server Action을 정의하고, Client Component(`PostEditor`)에 props로 전달하는 패턴. Server Action은 `"use server"` 지시어가 있어야 한다.

### 글 수정 — `app/admin/posts/[id]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { getPost, updatePost } from "@/actions/posts";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  // ... action 정의 + PostEditor에 initialData 전달
}
```

**Next.js 15의 변경점:** `params`가 `Promise`다. `await params`로 값을 꺼내야 한다. Next.js 14까지는 동기적으로 접근 가능했지만 15부터 비동기로 바뀌었다.

---

## 9. OAuth 설정 (GitHub + Google)

### GitHub OAuth App 만들기

1. https://github.com/settings/developers 접속
2. **OAuth Apps** → **New OAuth App**
3. 입력값:
   - **Application name:** `devlog`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. **Register application** 클릭
5. Client ID 복사
6. **Generate a new client secret** 클릭 → Client Secret 복사

### Google OAuth 클라이언트 만들기

**사전 준비: Google 2단계 인증 필수**

2025년 5월부터 Google Cloud Console 접속에 2단계 인증(2SV)이 필수다. 설정하지 않으면 "Google Cloud access blocked" 에러가 뜬다.

https://myaccount.google.com/security 에서 2단계 인증을 켠 후 60초 기다렸다가 Cloud Console에 접속한다.

**OAuth 클라이언트 생성:**

1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 (이름: `devlog`)
3. **API 및 서비스** → **OAuth 동의 화면** 설정 (External, 앱 이름 등)
4. **사용자 인증 정보** → **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
5. 애플리케이션 유형: **웹 애플리케이션**
6. **승인된 리디렉션 URI:** `http://localhost:3000/api/auth/callback/google`
7. 만들기 → Client ID, Client Secret 복사

### .env.local에 추가

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32 명령으로 생성한 랜덤 값"

# OAuth
GITHUB_CLIENT_ID="발급받은 Client ID"
GITHUB_CLIENT_SECRET="발급받은 Client Secret"
GOOGLE_CLIENT_ID="발급받은 Client ID"
GOOGLE_CLIENT_SECRET="발급받은 Client Secret"
```

**NEXTAUTH_SECRET 생성:**

```bash
openssl rand -base64 32
```

이 값은 JWT 토큰 암호화에 사용된다. 반드시 랜덤한 값이어야 한다.

> ⚠️ `.env.local` 수정 후 반드시 `.env`에도 동기화한다 (Prisma CLI용):
> ```bash
> cp .env.local .env
> ```

---

## 10. 빌드 테스트와 삽질

### 삽질 1: useActionState 타입 에러

```
Type error: Type 'unknown' is not assignable to type 'ReactNode'.
```

`useActionState`의 제네릭 타입을 명시하지 않으면 state가 `unknown`이 되어 JSX에서 렌더링할 수 없다.

**해결:** action 함수의 타입을 `string | null`로 명시적으로 지정.

```tsx
// ❌ 타입 에러
action: (prevState: unknown, formData: FormData) => Promise<unknown>

// ✅ 수정
action: (prevState: string | null, formData: FormData) => Promise<string | null>
```

### 최종 빌드 결과

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      132 B         102 kB
├ ○ /admin                                 132 B         102 kB
├ ○ /admin/posts                           165 B         105 kB
├ ƒ /admin/posts/[id]                    1.02 kB         103 kB
├ ○ /admin/posts/new                     1.02 kB         103 kB
├ ƒ /api/auth/[...nextauth]                132 B         102 kB
└ ○ /auth/signin                           132 B         102 kB

ƒ Middleware                              139 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

- `○ Static` — 빌드 시 미리 렌더링되는 정적 페이지
- `ƒ Dynamic` — 요청 시 서버에서 렌더링되는 동적 페이지 (params가 있는 페이지)

---

## Phase 2 완료 요약

| 항목 | 상태 |
|------|------|
| NextAuth.js v5 설정 | ✅ |
| GitHub OAuth | ✅ |
| Google OAuth | ✅ |
| 어드민 미들웨어 (role 기반 보호) | ✅ |
| 로그인 페이지 | ✅ |
| 글 CRUD Server Actions | ✅ |
| 어드민 대시보드 | ✅ |
| 글 목록 관리 | ✅ |
| 글 작성/수정 에디터 | ✅ |

### 이 시점의 프로젝트 구조 (Phase 1에서 추가된 부분)

```
apps/web/
├── actions/
│   └── posts.ts              ← 글 CRUD Server Actions
├── app/
│   ├── admin/
│   │   ├── layout.tsx        ← 어드민 전용 레이아웃
│   │   ├── page.tsx          ← 대시보드 (통계)
│   │   └── posts/
│   │       ├── page.tsx      ← 글 목록 관리
│   │       ├── new/page.tsx  ← 새 글 작성
│   │       └── [id]/page.tsx ← 글 수정
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/route.ts  ← NextAuth API
│   └── auth/
│       └── signin/page.tsx   ← 로그인 페이지
├── components/
│   └── admin/
│       └── post-editor.tsx   ← 글 에디터 (재사용 컴포넌트)
├── lib/
│   └── auth.ts               ← NextAuth 설정
├── middleware.ts              ← 어드민 보호
└── types/
    └── next-auth.d.ts        ← Session 타입 확장
```

### 다음 할 일 (Phase 3)

- 블로그 공개 페이지 (목록, 상세, 태그)
- 마크다운 렌더링 (Shiki 코드 하이라이팅)
- 댓글 시스템
- 검색 기능 (Cmd+K)

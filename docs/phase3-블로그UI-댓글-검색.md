# Phase 3: 공개 블로그 UI, 댓글 시스템, Cmd+K 검색

> 마크다운 렌더링(Shiki), 블로그 목록/상세, 태그, 댓글(대댓글), 검색 팔레트까지

## 목차

1. [마크다운 렌더링 파이프라인](#1-마크다운-렌더링-파이프라인)
2. [포스트 카드 컴포넌트](#2-포스트-카드-컴포넌트)
3. [블로그 목록 페이지](#3-블로그-목록-페이지)
4. [포스트 상세 페이지](#4-포스트-상세-페이지)
5. [TOC (목차) 컴포넌트](#5-toc-목차-컴포넌트)
6. [태그 시스템](#6-태그-시스템)
7. [댓글 시스템](#7-댓글-시스템)
8. [리액션 & 좋아요](#8-리액션--좋아요)
9. [Cmd+K 검색 팔레트](#9-cmdk-검색-팔레트)
10. [빌드 테스트와 삽질](#10-빌드-테스트와-삽질)

---

## 1. 마크다운 렌더링 파이프라인

### 패키지 설치

```bash
pnpm --filter web add unified remark-parse remark-gfm remark-rehype rehype-stringify rehype-slug rehype-autolink-headings shiki @shikijs/rehype rehype-parse
pnpm --filter web add @tailwindcss/typography
```

각 패키지의 역할:

| 패키지 | 역할 |
|--------|------|
| `unified` | 텍스트 처리 파이프라인 엔진 |
| `remark-parse` | 마크다운 → AST 파싱 |
| `remark-gfm` | GitHub Flavored Markdown (테이블, 체크박스 등) |
| `remark-rehype` | Markdown AST → HTML AST 변환 |
| `rehype-stringify` | HTML AST → HTML 문자열 |
| `rehype-slug` | 헤딩에 자동으로 id 부여 (`## 제목` → `<h2 id="제목">`) |
| `rehype-autolink-headings` | 헤딩을 클릭 가능한 링크로 |
| `shiki` + `@shikijs/rehype` | 코드 블록 구문 강조 (VS Code 테마 사용) |
| `@tailwindcss/typography` | `prose` 클래스로 마크다운 HTML에 타이포그래피 스타일 적용 |

### lib/markdown.ts

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeShiki from "@shikijs/rehype";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: "wrap" })
  .use(rehypeShiki, {
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  })
  .use(rehypeStringify);

export async function renderMarkdown(content: string): Promise<string> {
  const result = await processor.process(content);
  return result.toString();
}
```

**처리 흐름:**

```
마크다운 텍스트
  → remarkParse (마크다운 → mdast)
  → remarkGfm (GFM 확장 문법 처리)
  → remarkRehype (mdast → hast, HTML AST)
  → rehypeSlug (헤딩에 id 추가)
  → rehypeAutolinkHeadings (헤딩 링크화)
  → rehypeShiki (코드 블록 구문 강조)
  → rehypeStringify (hast → HTML 문자열)
```

**Shiki의 dual theme 설정:**

```ts
themes: {
  light: "github-light",
  dark: "github-dark",
}
```

Shiki는 빌드 타임에 코드 블록을 처리해서 두 가지 테마의 스타일을 모두 인라인으로 넣어준다. CSS의 `prefers-color-scheme`이나 `dark:` 클래스에 따라 자동 전환된다. 런타임 비용이 0.

### 헤딩 추출 (TOC용)

```ts
export function extractHeadings(
  content: string
): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s가-힣-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}
```

마크다운 원문에서 정규식으로 `#`, `##`, `###` 헤딩을 추출한다. `rehype-slug`와 같은 로직으로 id를 생성해서 TOC 링크와 매칭시킨다.

### Tailwind Typography 설정

`globals.css`에 플러그인을 추가한다:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

**Tailwind v4에서는** `tailwind.config.ts`의 `plugins` 대신 CSS 안에서 `@plugin`으로 플러그인을 등록한다.

사용할 때는 HTML 컨테이너에 `prose` 클래스를 붙인다:

```tsx
<div
  className="prose prose-gray max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:bg-transparent prose-pre:p-0"
  dangerouslySetInnerHTML={{ __html: html }}
/>
```

- `prose` — 기본 타이포그래피 스타일
- `prose-gray` — 회색 계열 색상
- `max-w-none` — 기본 `max-width` 제한 해제 (부모 컨테이너가 관리)
- `dark:prose-invert` — 다크모드에서 색상 반전
- `prose-headings:scroll-mt-20` — 헤딩 앵커 클릭 시 상단 헤더에 가리지 않도록 여백
- `prose-pre:bg-transparent prose-pre:p-0` — Shiki가 자체 배경색을 넣으므로 prose의 기본 스타일 제거

---

## 2. 포스트 카드 컴포넌트

### components/blog/post-card.tsx

```tsx
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface PostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  tags: { name: string; slug: string }[];
}

export function PostCard({
  title,
  slug,
  excerpt,
  publishedAt,
  tags,
}: PostCardProps) {
  return (
    <article className="group space-y-3 border-b border-gray-200 pb-6 dark:border-gray-800">
      <div className="space-y-1">
        {publishedAt && (
          <time className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(publishedAt)}
          </time>
        )}
        <h2 className="text-xl font-semibold">
          <Link
            href={`/blog/${slug}`}
            className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            {title}
          </Link>
        </h2>
      </div>
      {excerpt && (
        <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
          {excerpt}
        </p>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
```

**설계 포인트:**
- `group` + `group-hover:` — 카드 전체에 마우스를 올리면 제목 색상이 변한다. Tailwind의 그룹 호버 패턴.
- `line-clamp-2` — 요약이 길어도 2줄까지만 표시하고 `...`으로 자른다.
- 이 컴포넌트는 **Server Component**다. `"use client"` 없이 서버에서 렌더링된다.
- 블로그 목록, 태그별 목록, 메인 페이지에서 재사용된다.

---

## 3. 블로그 목록 페이지

### app/blog/page.tsx

```tsx
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/blog/post-card";

export const metadata = {
  title: "Blog",
  description: "개발과 기술에 대한 글 목록",
};

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          총 {posts.length}개의 글
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          아직 작성된 포스트가 없습니다.
        </p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              tags={post.tags.map((pt) => ({
                name: pt.tag.name,
                slug: pt.tag.slug,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- `where: { status: "published" }` — 발행된 글만 표시. 임시저장(draft) 글은 공개 페이지에 노출되지 않는다.
- `orderBy: { publishedAt: "desc" }` — 최신 글이 위에 오도록.
- `export const metadata` — Next.js의 정적 Metadata. `<title>`과 `<meta description>`을 설정한다.

---

## 4. 포스트 상세 페이지

### app/blog/[slug]/page.tsx

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { renderMarkdown, extractHeadings } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { Toc } from "@/components/blog/toc";
import { CommentList } from "@/components/comments/comment-list";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, status: "published" },
    select: { title: true, excerpt: true },
  });

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}
```

**`generateMetadata`** — 동적 페이지의 메타데이터를 DB에서 가져와서 설정한다. 각 포스트마다 다른 `<title>`과 `<meta description>`이 적용되므로 SEO에 유리하다.

```tsx
export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: "published" },
    include: { tags: { include: { tag: true } } },
  });

  if (!post) notFound();

  const [html, headings] = await Promise.all([
    renderMarkdown(post.content),
    Promise.resolve(extractHeadings(post.content)),
  ]);

  return (
    <div className="relative flex gap-12">
      <article className="min-w-0 flex-1">
        <header className="space-y-4 border-b border-gray-200 pb-6 dark:border-gray-800">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {post.publishedAt && <time>{formatDate(post.publishedAt)}</time>}
            <span>{post.viewCount} views</span>
          </div>
          {/* 태그 목록 */}
        </header>

        <div
          className="prose prose-gray mt-8 max-w-none dark:prose-invert ..."
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <hr className="my-12 border-gray-200 dark:border-gray-800" />

        <CommentList postId={post.id} />
      </article>

      <Toc headings={headings} />
    </div>
  );
}
```

**레이아웃 구조:**
- `flex gap-12` — 본문(왼쪽)과 TOC(오른쪽)를 수평 배치.
- `min-w-0 flex-1` — article이 flex 컨테이너에서 코드 블록 등 긴 콘텐츠에 의해 넘치지 않도록.
- `dangerouslySetInnerHTML` — 서버에서 마크다운을 HTML로 변환한 결과를 렌더링. 서버 사이드에서만 실행되므로 XSS 위험이 낮다.

---

## 5. TOC (목차) 컴포넌트

### components/blog/toc.tsx

```tsx
"use client";

import { useEffect, useState } from "react";

interface TocProps {
  headings: { id: string; text: string; level: number }[];
}

export function Toc({ headings }: TocProps) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block">
      <div className="sticky top-24 space-y-2">
        <p className="text-sm font-semibold">목차</p>
        <ul className="space-y-1 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              <a
                href={`#${heading.id}`}
                className={`block py-1 transition-colors ${
                  activeId === heading.id
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-500 hover:text-gray-900 ..."
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
```

**IntersectionObserver로 스크롤 위치 추적:**

- `rootMargin: "0px 0px -80% 0px"` — 뷰포트 하단 80%를 잘라낸다. 즉, 헤딩이 화면 상단 20% 영역에 들어왔을 때 "현재 위치"로 판단한다.
- 스크롤할 때 현재 읽고 있는 섹션의 TOC 항목이 파란색으로 하이라이트된다.

**반응형:**
- `hidden xl:block` — 화면이 좁으면 TOC를 숨긴다. xl(1280px) 이상에서만 표시.
- `sticky top-24` — 스크롤해도 TOC가 사이드바에 고정된다.

**들여쓰기:**
- `paddingLeft: (level - 1) * 12px` — h1은 0px, h2는 12px, h3은 24px. 헤딩 깊이에 따라 시각적 계층 표현.

---

## 6. 태그 시스템

### 태그 목록 페이지 — app/tags/page.tsx

```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: { where: { post: { status: "published" } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const filteredTags = tags.filter((tag) => tag._count.posts > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tags</h1>
      <div className="flex flex-wrap gap-3">
        {filteredTags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium ..."
          >
            {tag.name}
            <span className="ml-2 text-gray-400">{tag._count.posts}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Prisma의 `_count`:**
- `_count.posts` — 해당 태그에 연결된 PostTag 레코드 수를 카운트.
- `where: { post: { status: "published" } }` — 발행된 글만 카운트에 포함.
- `filteredTags` — 발행된 글이 0개인 태그는 목록에서 제외.

### 태그별 글 목록 — app/tags/[tag]/page.tsx

```tsx
export default async function TagPage({ params }: Props) {
  const { tag: tagSlug } = await params;

  const tag = await prisma.tag.findUnique({
    where: { slug: tagSlug },
    include: {
      posts: {
        where: { post: { status: "published" } },
        include: {
          post: {
            include: { tags: { include: { tag: true } } },
          },
        },
        orderBy: { post: { publishedAt: "desc" } },
      },
    },
  });

  if (!tag) notFound();

  // ... PostCard 렌더링
}
```

**Prisma 중첩 쿼리 구조:**

```
Tag
 └─ posts (PostTag[])
      └─ post (Post)
           └─ tags (PostTag[])
                └─ tag (Tag)
```

Tag → PostTag → Post → PostTag → Tag. 조인 테이블을 두 번 거쳐야 포스트의 모든 태그를 가져올 수 있다. Prisma의 중첩 include로 한 번의 쿼리에서 처리한다.

---

## 7. 댓글 시스템

### Server Actions — actions/comments.ts

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }
  return session;
}
```

`requireAuth`는 어드민의 `requireAdmin`과 달리 role을 체크하지 않는다. 로그인한 모든 사용자가 댓글을 쓸 수 있다.

### 댓글 생성

```ts
export async function createComment(
  postId: string,
  content: string,
  parentId?: string
) {
  const session = await requireAuth();

  await prisma.comment.create({
    data: {
      content,
      postId,
      userId: session.user.id,
      parentId: parentId ?? null,
    },
  });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { slug: true },
  });

  if (post) {
    revalidatePath(`/blog/${post.slug}`);
  }
}
```

- `parentId` — 값이 있으면 대댓글, `null`이면 최상위 댓글.
- 댓글 생성 후 해당 포스트 페이지의 캐시를 무효화해서 새 댓글이 즉시 표시되도록.

### 댓글 삭제 (권한 체크)

```ts
export async function deleteComment(commentId: string) {
  const session = await requireAuth();

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { slug: true } } },
  });

  if (!comment) throw new Error("댓글을 찾을 수 없습니다.");

  // 본인 댓글이거나 어드민만 삭제 가능
  if (comment.userId !== session.user.id && session.user.role !== "admin") {
    throw new Error("삭제 권한이 없습니다.");
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/blog/${comment.post.slug}`);
}
```

### 댓글 조회 (쓰레드 구조)

```ts
export async function getComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, parentId: null },  // 최상위 댓글만
    include: {
      user: { select: { id: true, name: true, image: true } },
      reactions: true,
      replies: {                         // 대댓글 포함
        include: {
          user: { select: { id: true, name: true, image: true } },
          reactions: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

- `parentId: null` — 최상위 댓글만 가져온다.
- `replies` — 각 댓글의 대댓글을 include로 함께 가져온다.
- 최상위 댓글은 최신순(`desc`), 대댓글은 오래된 순(`asc`)으로 정렬.

### 댓글 폼 — components/comments/comment-form.tsx

```tsx
"use client";

import { useRef, useTransition } from "react";
import { createComment } from "@/actions/comments";

export function CommentForm({ postId, parentId, onCancel }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    startTransition(async () => {
      await createComment(postId, content, parentId);
      formRef.current?.reset();
      onCancel?.();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <textarea name="content" required rows={parentId ? 3 : 4} ... />
      <button type="submit" disabled={isPending}>
        {isPending ? "작성 중..." : parentId ? "답글 작성" : "댓글 작성"}
      </button>
      {onCancel && <button type="button" onClick={onCancel}>취소</button>}
    </form>
  );
}
```

**`useTransition` 사용 이유:**
- `useActionState`와 달리 form action 외부에서 비동기 작업을 감싸서 `isPending` 상태를 관리할 수 있다.
- `formRef.current?.reset()` — 댓글 작성 성공 후 textarea를 비운다.
- `onCancel?.()` — 대댓글 폼에서 작성 완료 후 폼을 닫는다.

### 댓글 아이템 — components/comments/comment-item.tsx

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export function CommentItem({
  comment, postId, currentUserId, currentUserRole, isReply,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const canDelete =
    currentUserId === comment.user.id || currentUserRole === "admin";

  return (
    <div className={isReply ? "ml-8 border-l-2 border-gray-200 pl-4 ..." : ""}>
      {/* 유저 아바타, 이름, 날짜 */}
      <p className="whitespace-pre-wrap">{comment.content}</p>

      {!isReply && (
        <button onClick={() => setShowReplyForm(!showReplyForm)}>답글</button>
      )}
      {canDelete && <button>삭제</button>}

      {showReplyForm && (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          onCancel={() => setShowReplyForm(false)}
        />
      )}

      {/* 대댓글 재귀 렌더링 */}
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} isReply ... />
      ))}
    </div>
  );
}
```

**대댓글 UI:**
- `ml-8 border-l-2 pl-4` — 왼쪽 들여쓰기 + 세로 라인으로 시각적 쓰레드 표현.
- `isReply`가 true이면 "답글" 버튼을 숨긴다 (대댓글의 대댓글은 지원하지 않음, 1단계까지만).
- `CommentItem`이 자기 자신을 재귀적으로 렌더링한다.

**프로필 이미지:**
- `<img>` 대신 Next.js의 `<Image>` 컴포넌트를 사용한다. 자동 최적화(webp 변환, lazy loading 등).
- GitHub/Google의 프로필 이미지 도메인을 `next.config.ts`에 허용해야 한다:

```ts
// next.config.ts
images: {
  remotePatterns: [
    { hostname: "avatars.githubusercontent.com" },
    { hostname: "lh3.googleusercontent.com" },
  ],
},
```

### 댓글 목록 — components/comments/comment-list.tsx

```tsx
import { auth } from "@/lib/auth";
import { getComments } from "@/actions/comments";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

export async function CommentList({ postId }: { postId: string }) {
  const [session, comments] = await Promise.all([
    auth(),
    getComments(postId),
  ]);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h2>

      {session ? (
        <CommentForm postId={postId} />
      ) : (
        <p>댓글을 작성하려면 로그인하세요.</p>
      )}

      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          currentUserId={session?.user.id}
          currentUserRole={session?.user.role}
        />
      ))}
    </section>
  );
}
```

**Server Component + Client Component 조합:**
- `CommentList`는 **Server Component**. 서버에서 세션과 댓글 데이터를 가져온다.
- `CommentForm`, `CommentItem`은 **Client Component**. 사용자 인터랙션(답글 토글, 폼 제출 등)을 처리.
- 서버에서 데이터를 가져와서 클라이언트 컴포넌트에 props로 전달하는 패턴.

---

## 8. 리액션 & 좋아요

### actions/reactions.ts — 이모지 리액션 토글

```ts
"use server";

export async function toggleReaction(
  commentId: string,
  emoji: string,
  postSlug: string
) {
  const session = await auth();
  if (!session) throw new Error("로그인이 필요합니다.");

  const existing = await prisma.reaction.findUnique({
    where: {
      commentId_userId_emoji: {
        commentId,
        userId: session.user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { emoji, commentId, userId: session.user.id },
    });
  }

  revalidatePath(`/blog/${postSlug}`);
}
```

**`commentId_userId_emoji`** — Prisma에서 복합 unique 키를 참조할 때의 네이밍 규칙. `@@unique([commentId, userId, emoji])`에서 자동 생성된 이름이다. 이걸 `findUnique`의 where에서 사용할 수 있다.

토글 로직: 이미 있으면 삭제, 없으면 생성. 같은 댓글에 같은 이모지를 두 번 누르면 취소된다.

### actions/likes.ts — 글 좋아요 토글

```ts
export async function toggleLike(postId: string, postSlug: string) {
  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { postId, userId: session.user.id },
    });
  }
}
```

리액션과 같은 토글 패턴. `@@unique([postId, userId])`로 중복 좋아요를 방지한다.

---

## 9. Cmd+K 검색 팔레트

### 패키지 설치

```bash
pnpm --filter web add cmdk
```

[cmdk](https://cmdk.paco.me/)는 Vercel이 만든 커맨드 팔레트 UI 컴포넌트. 키보드 탐색, 검색 필터링 등이 내장되어 있다.

### Server Action — actions/search.ts

```ts
"use server";

import { prisma } from "@/lib/prisma";

export async function searchPosts(query: string) {
  if (!query.trim()) return [];

  return prisma.post.findMany({
    where: {
      status: "published",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
    },
    take: 10,
    orderBy: { publishedAt: "desc" },
  });
}
```

- `contains` + `mode: "insensitive"` — 대소문자 무시 부분 일치 검색.
- `OR` — 제목, 본문, 요약 중 하나라도 매칭되면 결과에 포함.
- `take: 10` — 결과를 최대 10개로 제한.
- 나중에 PostgreSQL의 `tsvector` 전문 검색으로 업그레이드할 수 있다.

### 검색 팔레트 UI — components/blog/search-palette.tsx

```tsx
"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { searchPosts } from "@/actions/search";

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Ctrl+K / Cmd+K로 열기/닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 디바운스 검색 (300ms)
  const handleSearch = useCallback((value: string) => {
    setQuery(value);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchPosts(value);
        setResults(data);
      });
    }, 300);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-[20vh] max-w-lg" onClick={(e) => e.stopPropagation()}>
        <Command className="rounded-xl border bg-white shadow-2xl dark:bg-gray-900">
          <Command.Input
            value={query}
            onValueChange={handleSearch}
            placeholder="글 검색..."
          />
          <Command.List>
            {isPending && <Command.Loading>검색 중...</Command.Loading>}
            <Command.Empty>검색 결과가 없습니다.</Command.Empty>
            {results.map((post) => (
              <Command.Item
                key={post.slug}
                value={post.title}
                onSelect={() => {
                  router.push(`/blog/${post.slug}`);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <p className="font-medium">{post.title}</p>
                {post.excerpt && <p className="text-xs">{post.excerpt}</p>}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
```

**삽질 포인트: useEffect 안에서 setState**

처음에 검색 디바운스를 `useEffect`로 구현했다:

```tsx
// ❌ ESLint 에러: react-hooks/set-state-in-effect
useEffect(() => {
  if (!query.trim()) {
    setResults([]);  // ← 이 부분이 에러
    return;
  }
  const timer = setTimeout(() => { ... }, 300);
  return () => clearTimeout(timer);
}, [query]);
```

Phase 1의 ThemeToggle과 같은 문제. `useEffect` 안에서 직접 `setState`를 호출하면 React 19의 ESLint 규칙에 걸린다.

**해결:** `useEffect`를 제거하고 `onValueChange` 콜백에서 직접 디바운스 로직을 실행하도록 변경했다. `useRef`로 타이머를 관리하고 `useCallback`으로 감싸서 불필요한 재생성을 방지.

**레이아웃에 검색 팔레트 추가:**

```tsx
// app/layout.tsx
import { SearchPalette } from "@/components/blog/search-palette";

// ThemeProvider 안에 추가
<SearchPalette />
<Header />
```

모든 페이지에서 Ctrl+K로 검색 팔레트를 열 수 있다.

---

## 10. 빌드 테스트와 삽질

### 삽질 1: useEffect 안에서 setState (검색 팔레트)

위 9번에서 상세 설명. `useEffect` → `onValueChange` 콜백으로 이동하여 해결.

### 삽질 2: `<img>` → `<Image>` (ESLint 경고)

```
Warning: Using `<img>` could result in slower LCP and higher bandwidth.
Consider using `<Image />` from `next/image`
```

Next.js의 ESLint 규칙(`@next/next/no-img-element`)이 `<img>` 태그 사용을 경고한다. `next/image`의 `<Image>` 컴포넌트로 교체하면:
- 자동 webp/avif 변환
- lazy loading
- 이미지 크기 최적화

단, 외부 도메인 이미지를 사용하려면 `next.config.ts`에 `remotePatterns`을 설정해야 한다.

### 최종 빌드 결과

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      175 B         105 kB
├ ○ /admin                                 130 B         102 kB
├ ○ /admin/posts                           175 B         105 kB
├ ƒ /admin/posts/[id]                    1.02 kB         103 kB
├ ○ /admin/posts/new                     1.02 kB         103 kB
├ ƒ /api/auth/[...nextauth]                130 B         102 kB
├ ○ /auth/signin                           130 B         102 kB
├ ○ /blog                                  175 B         105 kB
├ ƒ /blog/[slug]                         7.18 kB         112 kB
├ ○ /tags                                  175 B         105 kB
└ ƒ /tags/[tag]                            175 B         105 kB

ƒ Middleware                              139 kB
```

- `/blog/[slug]`가 7.18kB로 가장 크다. 마크다운 렌더링 + 댓글 + TOC가 모두 포함된 페이지.
- 나머지 페이지는 모두 200B 이하. Server Component 위주라서 클라이언트 JS가 거의 없다.

---

## Phase 3 완료 요약

| 항목 | 상태 |
|------|------|
| 마크다운 렌더링 (unified + Shiki) | ✅ |
| Tailwind Typography (prose) | ✅ |
| 포스트 카드 컴포넌트 | ✅ |
| 블로그 목록 (`/blog`) | ✅ |
| 포스트 상세 (`/blog/[slug]`) | ✅ |
| TOC + 스크롤 하이라이트 | ✅ |
| 태그 목록 (`/tags`) | ✅ |
| 태그별 글 목록 (`/tags/[tag]`) | ✅ |
| 댓글 (생성, 삭제, 대댓글) | ✅ |
| 이모지 리액션 토글 | ✅ |
| 좋아요 토글 | ✅ |
| Cmd+K 검색 팔레트 (cmdk) | ✅ |
| 메인 페이지 최근 포스트 | ✅ |

### 이 시점의 프로젝트 구조 (Phase 2에서 추가된 부분)

```
apps/web/
├── actions/
│   ├── posts.ts
│   ├── comments.ts         ← 댓글 CRUD
│   ├── reactions.ts        ← 이모지 리액션 토글
│   ├── likes.ts            ← 좋아요 토글
│   └── search.ts           ← 검색 Server Action
├── app/
│   ├── blog/
│   │   ├── page.tsx        ← 블로그 목록
│   │   └── [slug]/page.tsx ← 포스트 상세 (마크다운 + 댓글 + TOC)
│   ├── tags/
│   │   ├── page.tsx        ← 태그 목록
│   │   └── [tag]/page.tsx  ← 태그별 글 목록
│   └── page.tsx            ← 메인 (최근 포스트 + 검색 안내)
├── components/
│   ├── blog/
│   │   ├── post-card.tsx   ← 포스트 카드
│   │   ├── toc.tsx         ← 목차 (스크롤 하이라이트)
│   │   └── search-palette.tsx ← Cmd+K 검색
│   └── comments/
│       ├── comment-form.tsx   ← 댓글/답글 입력 폼
│       ├── comment-item.tsx   ← 댓글 아이템 (재귀 대댓글)
│       └── comment-list.tsx   ← 댓글 목록 (Server Component)
├── lib/
│   └── markdown.ts         ← 마크다운 렌더링 파이프라인
└── next.config.ts          ← 이미지 도메인 설정 추가
```

### 다음 할 일 (Phase 4)

- SEO (Metadata API, JSON-LD)
- 동적 OG 이미지
- sitemap.xml, robots.txt (DB 기반)
- RSS 피드
- Vercel 배포

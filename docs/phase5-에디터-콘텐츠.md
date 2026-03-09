# Phase 5: 에디터 강화 & 콘텐츠 기능

> Tiptap WYSIWYG 에디터, 자동저장, 예약 발행, KaTeX 수식, Callout

## 목차

1. [Tiptap WYSIWYG 에디터](#1-tiptap-wysiwyg-에디터)
2. [HTML-Markdown 변환](#2-html-markdown-변환)
3. [자동저장](#3-자동저장)
4. [예약 발행](#4-예약-발행)
5. [KaTeX 수식 지원](#5-katex-수식-지원)
6. [Callout 컴포넌트](#6-callout-컴포넌트)
7. [헤더 로그인/로그아웃](#7-헤더-로그인로그아웃)
8. [다크모드 수정](#8-다크모드-수정)

---

## 1. Tiptap WYSIWYG 에디터

기존 `<textarea>`를 Tiptap 리치 텍스트 에디터로 교체했다. 마크다운을 직접 타이핑하는 대신 워드프로세서처럼 글을 작성할 수 있다.

### 설치한 패키지

```bash
pnpm --filter web add @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-code-block-lowlight @tiptap/extension-image \
  @tiptap/extension-link @tiptap/extension-placeholder @tiptap/pm lowlight
```

### components/admin/tiptap-editor.tsx

```tsx
"use client";

import { useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export function TiptapEditor({ initialContent = "", name = "content" }) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "마크다운으로 글을 작성하세요..." }),
    ],
    content: markdownToHtml(initialContent),
    onUpdate: ({ editor }) => {
      // 디바운스로 hidden input에 마크다운 저장
      hiddenRef.current.value = htmlToMarkdown(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-gray dark:prose-invert max-w-none min-h-[400px] px-4 py-3",
      },
    },
  });

  return (
    <div className="rounded-lg border">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={initialContent} />
    </div>
  );
}
```

**핵심 설계:**

- **hidden input 패턴** — Tiptap은 HTML로 동작하지만, DB에는 마크다운으로 저장해야 한다. hidden `<input>`의 value를 에디터가 업데이트할 때마다 HTML→마크다운으로 변환해서 넣는다. 폼 제출 시 Server Action이 `formData.get("content")`로 마크다운을 받는다.
- **StarterKit에서 codeBlock 비활성화** — `CodeBlockLowlight`로 대체해서 코드 블록에 구문 하이라이팅을 적용한다.
- **lowlight의 `common` 세트** — JavaScript, TypeScript, Python, Go, Rust 등 주요 언어의 하이라이팅을 포함.
- **`openOnClick: false`** — 에디터에서 링크를 클릭해도 이동하지 않고 편집 상태를 유지.
- **prose 클래스** — `@tailwindcss/typography`로 에디터 내부 콘텐츠에 타이포그래피 스타일 적용.

### components/admin/tiptap-toolbar.tsx

```tsx
<ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
  <strong>B</strong>
</ToolbarButton>
```

**툴바 구성:**
- 텍스트: 굵게(B), 기울임(I), 인라인 코드, 취소선
- 제목: H1, H2, H3
- 목록: 글머리 목록, 번호 목록
- 블록: 인용, 코드 블록, 구분선
- 삽입: 링크(URL 프롬프트), 이미지(URL 프롬프트)

각 버튼은 `editor.isActive()`로 현재 상태를 확인해서 활성 상태를 시각적으로 표시한다.

---

## 2. HTML-Markdown 변환

Tiptap은 HTML 기반이고 DB는 마크다운이므로, 양방향 변환이 필요하다.

### lib/editor-markdown.ts

```ts
// 마크다운 → HTML (에디터에 로드)
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

export function markdownToHtml(md: string): string {
  return String(unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify).processSync(md));
}

// HTML → 마크다운 (에디터에서 저장)
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html);
}
```

**설치:**
```bash
pnpm --filter web add turndown
pnpm --filter web add -D @types/turndown
```

**핵심:**
- `markdownToHtml` — Shiki 없이 가벼운 unified 파이프라인. 에디터 로딩용이므로 구문 하이라이팅 불필요.
- `htmlToMarkdown` — Turndown 라이브러리 사용. 코드 블록의 language 클래스를 읽어서 fenced code block에 언어 식별자를 유지하는 커스텀 룰 추가.
- **주의**: HTML↔마크다운 라운드 트립에서 일부 포맷이 변할 수 있다. 블로그 글 작성에는 충분하지만, 극단적인 마크다운 문법(중첩 리스트 등)은 완벽하지 않을 수 있다.

---

## 3. 자동저장

글 수정 시 폼 내용이 변경되면 5초 디바운스로 자동 저장된다.

### actions/posts.ts — autoSavePost

```ts
export async function autoSavePost(
  id: string,
  data: { title: string; content: string; excerpt: string; tags: string }
) {
  await requireAdmin();
  await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || null,
    },
  });
}
```

### components/admin/post-editor.tsx — 자동저장 로직

```tsx
const handleAutoSave = useCallback(() => {
  if (!postId || !formRef.current) return;
  if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

  autoSaveTimer.current = setTimeout(async () => {
    const fd = new FormData(formRef.current!);
    await autoSavePost(postId, {
      title: fd.get("title") as string,
      content: fd.get("content") as string,
      excerpt: fd.get("excerpt") as string,
      tags: fd.get("tags") as string,
    });
    setAutoSaveStatus("자동 저장됨");
  }, 5000);
}, [postId]);

<form onChange={handleAutoSave}>
```

**핵심:**
- `onChange` 이벤트가 폼 내 모든 필드에서 버블링되므로, 하나의 핸들러로 전체 폼 변경을 감지.
- **5초 디바운스** — 매 키 입력마다 저장하지 않고, 5초 동안 추가 입력이 없을 때 저장.
- **새 글에서는 비활성** — `postId`가 있을 때만 (수정 모드) 자동저장 동작. 새 글은 아직 DB에 레코드가 없으므로.
- "자동 저장됨" 메시지가 3초간 표시된 후 사라진다.

---

## 4. 예약 발행

글의 상태에 "예약 발행"을 추가했다. 날짜/시간을 지정하면 해당 시점에 발행된다.

### DB 스키마 변경

```prisma
model Post {
  // ...
  status       String    @default("draft")  // draft | published | scheduled
  publishedAt  DateTime?
  scheduledAt  DateTime?  // 새로 추가
}
```

```bash
npx prisma db push  # 스키마 동기화
```

### UI — post-editor.tsx

```tsx
<select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
  <option value="draft">임시저장</option>
  <option value="published">발행</option>
  <option value="scheduled">예약 발행</option>
</select>

{status === "scheduled" && (
  <input name="scheduledAt" type="datetime-local" required />
)}
```

**핵심:**
- status를 `useState`로 관리해서 "예약 발행" 선택 시 datetime-local 입력이 나타남.
- `datetime-local`은 브라우저 네이티브 날짜/시간 선택기. 별도 라이브러리 불필요.
- 어드민 글 목록에서 예약된 글은 파란색으로 "예약됨" 표시.

**참고:** 실제 예약 시간에 자동 발행하려면 Cron Job(Vercel Cron 또는 GitHub Actions)이 필요하다. 현재는 상태와 시간만 저장하고, 자동 발행 로직은 Phase 8(인프라)에서 구현 예정.

---

## 5. KaTeX 수식 지원

마크다운에서 수학 수식을 렌더링할 수 있다.

### 설치

```bash
pnpm --filter web add katex rehype-katex remark-math
pnpm --filter web add -D @types/katex
```

### lib/markdown.ts

```ts
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)       // $..$ 인라인, $$...$$ 블록 파싱
  .use(remarkRehype)
  .use(rehypeKatex)      // KaTeX로 수식 렌더링
  .use(rehypeShiki, { ... })
  .use(rehypeStringify);
```

### KaTeX CSS

```tsx
// app/layout.tsx
import "katex/dist/katex.min.css";
```

**사용법:**
- 인라인 수식: `$E = mc^2$`
- 블록 수식:
```
$$
\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n
$$
```

**핵심:**
- `remark-math`가 `$...$`와 `$$...$$` 문법을 파싱해서 math 노드로 변환.
- `rehype-katex`가 math 노드를 KaTeX HTML로 렌더링.
- KaTeX CSS는 전역 layout에서 import. 수식이 없는 페이지에서도 로드되지만, 폰트는 사용될 때만 다운로드된다.

---

## 6. Callout 컴포넌트

GitHub 스타일의 Callout 문법을 지원한다.

### 마크다운 문법

```markdown
> [!NOTE]
> 참고할 내용입니다.

> [!TIP]
> 유용한 팁입니다.

> [!WARNING]
> 주의가 필요합니다.

> [!DANGER]
> 위험한 작업입니다.

> [!INFO]
> 추가 정보입니다.
```

### lib/markdown.ts — Callout 변환

```ts
const processed = content.replace(
  /^> \[!(NOTE|TIP|WARNING|DANGER|INFO)\]\s*\n((?:^>.*\n?)*)/gm,
  (_match, type, body) => {
    const text = body.replace(/^> ?/gm, "").trim();
    const lower = type.toLowerCase();
    return `<div class="callout callout-${lower}">
      <p class="callout-title">${type}</p>
      <p>${text}</p>
    </div>`;
  }
);
```

**핵심:**
- unified 파이프라인에 넣기 전에 정규식으로 Callout 문법을 HTML로 변환.
- 이유: remark/rehype 플러그인으로 만들면 복잡해지고, 단순한 정규식 변환으로 충분.

### 스타일 — globals.css

```css
.callout {
  border-left: 4px solid;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
}
.callout-note { border-color: #3b82f6; background: #eff6ff; }
.callout-tip { border-color: #22c55e; background: #f0fdf4; }
.callout-warning { border-color: #f59e0b; background: #fffbeb; }
.callout-danger { border-color: #ef4444; background: #fef2f2; }
.callout-info { border-color: #6366f1; background: #eef2ff; }

/* 다크모드 */
:where(.dark, .dark *) .callout-note { background: #1e3a5f; }
/* ... */
```

타입별로 색상이 다르고, 다크모드에서도 적절한 배경색을 사용한다.

---

## 7. 헤더 로그인/로그아웃

### components/layout/header.tsx

Header를 async Server Component로 변경해서 세션 상태에 따라 다른 UI를 표시한다.

```tsx
export async function Header() {
  const session = await auth();

  return (
    <header>
      <nav>
        {/* 네비게이션 링크 */}

        {session?.user.role === "admin" && (
          <Link href="/admin">Admin</Link>
        )}

        <ThemeToggle />

        {session ? (
          <div>
            <Image src={session.user.image} ... />
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button>로그아웃</button>
            </form>
          </div>
        ) : (
          <Link href="/auth/signin">로그인</Link>
        )}
      </nav>
    </header>
  );
}
```

**표시되는 항목:**
- 비로그인: "로그인" 버튼
- 로그인: 프로필 이미지 + "로그아웃" 버튼
- admin: "Admin" 링크 추가

---

## 8. 다크모드 수정

### 문제

Tailwind CSS v4에서 `dark:` 클래스가 동작하지 않았다.

### 원인

Tailwind v4는 기본적으로 `prefers-color-scheme` 미디어 쿼리를 사용한다. `next-themes`는 `<html>` 태그에 `.dark` 클래스를 추가하는 방식인데, Tailwind v4가 이 클래스를 인식하지 못했다.

### 해결

```css
/* globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

이 한 줄로 Tailwind v4에게 `.dark` 클래스 기반 다크모드를 사용하도록 알려준다.

**Tailwind v3 vs v4:**
- v3: `tailwind.config.js`에서 `darkMode: 'class'` 설정
- v4: CSS에서 `@custom-variant dark` 선언 (CSS-first 설정)

---

## Phase 5 완료 요약

| 항목 | 상태 |
|------|------|
| Tiptap WYSIWYG 에디터 | ✅ |
| HTML↔Markdown 변환 (Turndown) | ✅ |
| 에디터 툴바 (서식/제목/목록/링크/이미지) | ✅ |
| 자동저장 (5초 디바운스) | ✅ |
| 예약 발행 (scheduled 상태 + datetime picker) | ✅ |
| KaTeX 수식 ($인라인$, $$블록$$) | ✅ |
| Callout (NOTE/TIP/WARNING/DANGER/INFO) | ✅ |
| 헤더 로그인/로그아웃 | ✅ |
| Tailwind v4 다크모드 수정 | ✅ |
| 이미지 업로드 (Cloudflare R2) | ⏳ 보류 (계정 설정 필요) |

### 이 시점의 새로운 파일

```
apps/web/
├── lib/
│   └── editor-markdown.ts     ← HTML↔Markdown 변환
├── components/admin/
│   ├── tiptap-editor.tsx       ← Tiptap 에디터
│   └── tiptap-toolbar.tsx      ← 에디터 툴바
```

### 수정된 파일

```
apps/web/
├── app/
│   ├── globals.css             ← Tiptap 스타일, Callout 스타일, 다크모드 fix
│   └── layout.tsx              ← KaTeX CSS import
├── lib/
│   └── markdown.ts             ← remark-math, rehype-katex, Callout 변환
├── components/
│   ├── admin/post-editor.tsx   ← textarea→Tiptap, 자동저장, 예약 발행
│   └── layout/header.tsx       ← 로그인/로그아웃, Admin 링크
├── actions/posts.ts            ← autoSavePost, scheduledAt 처리
├── prisma/schema.prisma        ← scheduledAt 필드 추가
└── app/admin/posts/
    ├── page.tsx                ← 예약 상태 표시
    └── [id]/page.tsx           ← postId 전달
```

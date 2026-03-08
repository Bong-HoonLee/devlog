# 개발 블로그 프로젝트

## 프로젝트 개요

개발/기술 블로그. 모든 데이터를 DB에 저장하는 풀스택 구성. 무료 티어로 운영.

## 기술 스택

### Frontend
- **Next.js 16** (App Router, Turbopack, Cache Components, PPR, proxy.ts)
- **React 19** (Server Components, React Compiler)
- **Tailwind CSS v4** (Oxide 엔진, CSS-first, dark: 네이티브)
- **next-themes** (다크모드)
- **Shiki + rehype** (코드 하이라이팅, 빌드타임 처리)
- **Framer Motion** (애니메이션)
- **Milkdown 또는 Tiptap** (어드민 마크다운 WYSIWYG 에디터)
- **cmdk** (Cmd+K 검색 팔레트)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Prisma ORM** (타입 세이프 쿼리, 마이그레이션)
- **Next.js Server Actions** (글 CRUD, 댓글, 좋아요, 이미지 업로드)
- **NextAuth.js v5** (GitHub + Google OAuth, 관리자 + 댓글 작성자 인증)
- **Upstash Redis** (조회수 카운터, Rate limiting, 캐싱)
- **Resend + React Email** (댓글/대댓글 이메일 알림)

### Infra & DevOps
- **Vercel** (호스팅, 무료 Hobby 플랜)
- **Cloudflare R2** (이미지 저장소, Egress 0원)
- **GitHub Actions** (CI/CD)
- **Turborepo** (모노레포 빌드)
- **pnpm** (패키지 매니저)

## DB 스키마

```prisma
model Post {
  id           String    @id @default(cuid())
  title        String
  slug         String    @unique
  content      String    // 마크다운 원문
  excerpt      String?
  status       String    @default("draft") // draft | published
  publishedAt  DateTime?
  viewCount    Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  tags         PostTag[]
  comments     Comment[]
  likes        Like[]
  series       Series?   @relation(fields: [seriesId], references: [id])
  seriesId     String?
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
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  image         String?
  provider      String    // github | google
  role          String    @default("user") // user | admin
  comments      Comment[]
  reactions     Reaction[]
  likes         Like[]
  notifications Notification[]
  createdAt     DateTime  @default(now())
}

model Comment {
  id        String     @id @default(cuid())
  content   String     // 마크다운
  post      Post       @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  user      User       @relation(fields: [userId], references: [id])
  userId    String
  parent    Comment?   @relation("CommentThread", fields: [parentId], references: [id])
  parentId  String?    // null이면 최상위 댓글, 값이 있으면 대댓글
  replies   Comment[]  @relation("CommentThread")
  reactions Reaction[]
  notifications Notification[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Reaction {
  id        String  @id @default(cuid())
  emoji     String  // 👍 ❤️ 🎉 😄 등
  comment   Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId String
  user      User    @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())
  @@unique([commentId, userId, emoji]) // 같은 이모지 중복 방지
}

model Notification {
  id        String  @id @default(cuid())
  type      String  // reply | reaction
  isRead    Boolean @default(false)
  user      User    @relation(fields: [userId], references: [id])
  userId    String
  comment   Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
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

## 프로젝트 구조

```
my-blog/
├── apps/
│   └── web/                        # Next.js 16 메인 앱
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx            # 메인 (최근 포스트)
│       │   ├── blog/
│       │   │   ├── page.tsx        # 블로그 목록 (검색/태그 필터)
│       │   │   └── [slug]/page.tsx # 포스트 상세
│       │   ├── tags/[tag]/page.tsx # 태그별 목록
│       │   ├── admin/              # 관리자 전용 (NextAuth 보호)
│       │   │   ├── layout.tsx
│       │   │   ├── posts/page.tsx  # 글 목록 관리
│       │   │   ├── posts/new/page.tsx    # 새 글 작성
│       │   │   ├── posts/[id]/page.tsx   # 글 수정
│       │   │   └── dashboard.tsx   # 통계 대시보드
│       │   ├── about/page.tsx
│       │   └── api/
│       │       ├── og/route.tsx    # 동적 OG 이미지
│       │       └── rss/route.tsx   # RSS 피드
│       ├── components/
│       │   ├── layout/             # header, footer, sidebar(TOC)
│       │   ├── blog/               # post-card, post-list, tag-filter, search, md-renderer
│       │   ├── comments/           # comment-list, comment-form, comment-item, reactions
│       │   ├── admin/              # post-editor, image-uploader
│       │   └── ui/                 # theme-toggle, scroll-to-top
│       ├── actions/
│       │   ├── posts.ts            # 글 CRUD
│       │   ├── comments.ts         # 댓글/대댓글 CRUD
│       │   ├── reactions.ts        # 이모지 리액션 토글
│       │   ├── notifications.ts    # 이메일 알림 (Resend)
│       │   ├── likes.ts            # 좋아요 토글
│       │   └── upload.ts           # 이미지 업로드 (R2)
│       ├── lib/
│       │   ├── prisma.ts           # Prisma 클라이언트 싱글턴
│       │   ├── supabase.ts         # Supabase 클라이언트
│       │   ├── redis.ts            # Upstash Redis 클라이언트
│       │   ├── auth.ts             # NextAuth 설정
│       │   └── utils.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── styles/globals.css
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── packages/
│   └── ui/                         # 공유 UI 컴포넌트 (선택)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 핵심 기능

1. **마크다운 글 작성** — 웹 어드민 에디터, Shiki 코드 하이라이팅, KaTeX 수식, Callout, TOC, OG 이미지, 임시 저장/예약 발행
2. **댓글 시스템** — 자체 DB 저장, GitHub+Google OAuth, 대댓글(쓰레드), 마크다운, 이모지 리액션, Resend 이메일 알림
3. **다크모드** — next-themes, FOUC 방지, Tailwind dark: 클래스
4. **검색 & 태그** — Cmd+K(cmdk), PostgreSQL tsvector 전문 검색, 다대다 태그, 시리즈
5. **SEO** — Metadata API, sitemap/robots.txt(DB 기반), RSS, JSON-LD, Cache Components

## 코딩 규칙

- TypeScript strict mode 사용
- Server Components 우선, 클라이언트 컴포넌트는 최소한으로
- 'use server' Server Actions로 서버 로직 처리, 별도 API Route 최소화
- Prisma를 통해서만 DB 접근 (Supabase 클라이언트 직접 쿼리 지양)
- 컴포넌트 파일명은 kebab-case (post-card.tsx)
- 에러 핸들링: try-catch + 사용자 친화적 에러 메시지
- 환경 변수는 .env.local에 관리, 절대 커밋하지 않음

## 개발 순서 (로드맵)

### Phase 1: 기반 구축 (1주)
- Turborepo + pnpm 모노레포 초기화
- Next.js 16 App Router 프로젝트 생성
- Tailwind v4 + 다크모드 설정
- Supabase 프로젝트 생성 + Prisma 연동
- DB 스키마 설계 및 마이그레이션
- 기본 레이아웃 (Header, Footer, Sidebar)

### Phase 2: 어드민 & 글 관리 (1~2주)
- NextAuth 로그인 (GitHub + Google OAuth)
- 어드민 레이아웃 + 인증 미들웨어
- 마크다운 에디터 (Milkdown/Tiptap)
- 글 CRUD Server Actions
- 이미지 업로드 → Cloudflare R2
- 임시 저장 / 예약 발행

### Phase 3: 공개 블로그 UI & 댓글 (1~2주)
- 블로그 목록 (포스트 카드, 페이지네이션)
- 포스트 상세 (마크다운 렌더링, Shiki, TOC)
- 태그 시스템 + 태그별 페이지
- 검색 (Cmd+K + PostgreSQL 전문 검색)
- 댓글 시스템 (쓰레드, 마크다운, 리액션)
- 댓글 알림 (Resend 이메일)
- Upstash Redis 조회수 카운터

### Phase 4: SEO & 배포 & 확장 (지속적)
- Metadata API + 동적 OG 이미지
- sitemap.xml, robots.txt, RSS (DB 기반)
- Vercel 배포 + 도메인 설정
- Lighthouse 성능 최적화 (Cache Components)
- Framer Motion 애니메이션
- 이메일 구독 (Resend + React Email)

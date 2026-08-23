# Dev Blog

개발과 기술에 대한 풀스택 블로그. 모든 데이터를 DB에 저장하며, 무료 티어로 운영합니다.

> **Live**: [devlog-web-mauve.vercel.app](https://devlog-web-mauve.vercel.app)

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components/PPR) + React 19.2 |
| Styling | Tailwind CSS v4 + next-themes |
| DB | Supabase PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (GitHub, Google OAuth) |
| Cache | Upstash Redis |
| Email | Resend |
| Storage | Supabase Storage |
| Editor | Tiptap WYSIWYG |
| Search | cmdk + PostgreSQL tsvector |
| Animation | Framer Motion + View Transitions API |
| Monorepo | Turborepo + pnpm |
| CI/CD | GitHub Actions + Vercel |

## Features

### Blog
- 마크다운 렌더링 (Shiki 코드 하이라이팅, KaTeX 수식, Callout)
- 코드 diff/highlight/focus 표기 (`@shikijs/transformers`)
- 코드 블록 복사 버튼
- 목차(TOC) + 스크롤 인디케이터
- 읽기 진행률 바
- 시리즈 네비게이션
- 태그 시스템 (다대다)
- 관련 글 추천 (태그 기반)
- 페이지네이션 + ISR (revalidate 60s)
- RSS 피드

### Social
- 좋아요 (React 19 `useOptimistic`)
- 댓글 / 대댓글 (마크다운, 수정/삭제)
- 이모지 리액션 (6종)
- 알림 시스템 (대댓글 알림)
- 이메일 알림 (Resend)
- 공유 버튼 (Twitter, 링크 복사)

### Search & Navigation
- Cmd+K 커맨드 팔레트 (검색, 페이지 이동, 테마 전환)
- PostgreSQL tsvector 전문 검색 (가중치 랭킹)

### Admin
- Tiptap WYSIWYG 에디터 (이미지 드래그&드롭/붙여넣기)
- 글 CRUD + 임시저장 + 예약 발행
- 시리즈 관리
- 대시보드 (통계, 인기 글 TOP 5)

### Infra
- Upstash Redis 조회수 카운터 + 레이트 리밋
- 이메일 구독 (Double opt-in)
- 동적 OG 이미지 생성
- SEO (Metadata API, sitemap, robots, JSON-LD)
- View Transitions (페이지 전환 애니메이션)
- Loading 스켈레톤 (Streaming/Suspense)

## Project Structure

```
my-blog/
├── apps/web/              # Next.js 메인 앱
│   ├── actions/           # Server Actions (9개)
│   ├── app/               # App Router 페이지
│   ├── components/        # React 컴포넌트
│   ├── lib/               # 유틸리티, 클라이언트, 설정
│   └── prisma/            # DB 스키마, 마이그레이션
├── docs/                  # Phase별 개발 문서
├── .github/workflows/     # CI 파이프라인
└── turbo.json
```

## Getting Started

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp apps/web/.env.example apps/web/.env.local

# DB 마이그레이션
cd apps/web && npx prisma migrate dev

# 개발 서버
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL=

# Auth
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Email
RESEND_API_KEY=

# Storage
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=
```

## Rendering

공개 페이지는 Cache Components(PPR)로 **정적 셸 + 요청 시점 스트리밍** 구조입니다.

- 셸이 프리렌더되므로 `<Link>` 프리페치가 동작해 글 이동이 즉시 이루어집니다.
- 세션에 의존하는 헤더 UI(`components/layout/header-session.tsx`), 조회수, 좋아요,
  댓글, 관련 글은 `<Suspense>` 안에서 스트리밍됩니다.
- 공개 글 조회는 `lib/queries.ts` 의 `"use cache"` 계층을 지납니다.
  어드민이 글을 저장/삭제하면 `updateTag` 로 즉시 무효화됩니다.
- `/blog/[slug]`, `/tags/[tag]`, `/series/[slug]` 는 `instant = false` 입니다.
  셸을 먼저 200 으로 흘려보내면 없는 글의 `notFound()` 가 상태 코드를 바꿀 수 없어
  soft-404 가 되기 때문입니다. 실제 글은 `generateStaticParams` 로 프리렌더되므로
  즉시 뜨고, 존재하지 않는 주소만 요청 시점에 막고 진짜 404 를 냅니다.
- 인증이 필요한 화면(`/admin/*`, `/notifications`, `/auth/signin`, `/unsubscribe`)은
  `instant = false` 로 즉시 렌더 검증에서 제외했습니다.

## Deployment

Vercel 프로젝트의 **Root Directory 는 `apps/web`** 입니다.

| 항목 | 값 |
| --- | --- |
| Root Directory | `apps/web` |
| 필수 환경 변수 | `NEXT_PUBLIC_SITE_URL` (미설정 시 프로덕션 빌드 실패) |

### 예약 발행

글의 공개는 애플리케이션이 판단합니다 — `publicPostWhere()` 가 예약 시각이 지난
`scheduled` 글을 공개로 취급하므로, 예약 시각이 되면 캐시 수명(약 1분) 안에 노출됩니다.

`status` 컬럼을 실제 상태와 맞추는 일은 **pg_cron** 이 DB 안에서 1분마다 처리합니다
(마이그레이션 `20260823000000_publish_scheduled_posts`). 컬럼을 승격시켜 두면 앞으로
`status = 'published'` 로만 필터하는 쿼리가 추가되어도 예약 글이 누락되지 않습니다.

Supabase 대시보드 → Database → Extensions 에서 `pg_cron` 이 활성화되어 있어야 합니다.
등록된 작업은 `select * from cron.job;` 으로 확인할 수 있습니다.

## DB Models

`Post` · `Tag` · `PostTag` · `Series` · `User` · `Comment` · `Reaction` · `Notification` · `Like` · `Subscriber`

## License

MIT

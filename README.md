# Dev Blog

개발과 기술에 대한 풀스택 블로그. 모든 데이터를 DB에 저장하며, 무료 티어로 운영합니다.

> **Live**: [devlog-web-mauve.vercel.app](https://devlog-web-mauve.vercel.app)

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router) + React 19 |
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

## DB Models

`Post` · `Tag` · `PostTag` · `Series` · `User` · `Comment` · `Reaction` · `Notification` · `Like` · `Subscriber`

## License

MIT

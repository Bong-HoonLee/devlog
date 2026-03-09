# Phase 8: 성능 & 인프라 — Redis, 캐시, Lighthouse, CI/CD

## 완료 날짜: 2026-03-09

## 구현 내용

### 1. Upstash Redis 연동
- **패키지**: `@upstash/redis`, `@upstash/ratelimit` 설치
- **파일**: `lib/redis.ts`
  - Redis 클라이언트 (환경변수 없으면 null — graceful degradation)
  - Rate Limiter: sliding window, 10 req / 10s per IP

#### 조회수 카운터 (`lib/view-count.ts`)
- Redis `INCR` 기반 실시간 조회수
- 10회마다 DB 동기화 (비동기, fire-and-forget)
- Redis 미설정 시 DB 직접 increment fallback
- 포스트 상세 페이지에서 `incrementViewCount(slug)` 호출

#### Rate Limiting (`lib/rate-limit.ts`)
- IP 기반 rate limit (x-forwarded-for / x-real-ip)
- 적용 대상: 댓글 작성 (`actions/comments.ts`), 좋아요 토글 (`actions/likes.ts`)
- 한도 초과 시 에러 메시지: "요청이 너무 많습니다"
- Redis 미설정 시 skip

### 2. Next.js 캐시 최적화
- **ISR (Incremental Static Regeneration)**:
  - `app/page.tsx`: `revalidate = 60` (메인 페이지 60초 캐시)
  - `app/blog/page.tsx`: `revalidate = 60` (블로그 목록 60초 캐시)
- **On-demand Revalidation**:
  - 글 CRUD 시 `revalidatePath("/blog")`, `revalidatePath("/admin/posts")` 유지
  - ISR + on-demand 조합으로 최적 캐시 전략

### 3. Lighthouse 최적화
- **Viewport**: `export const viewport: Viewport` 분리 (Next.js 권장 패턴)
- **Theme Color**: light/dark 미디어 쿼리 대응
- **Preconnect**: CDN (jsdelivr) preconnect 추가
- **Antialiased**: body에 `antialiased` 클래스 추가
- **이미지 최적화**: `formats: ["image/avif", "image/webp"]` 추가
- **Package Import 최적화**: framer-motion, shiki, @tiptap/react tree-shaking
- **robots.txt**: `index: true, follow: true` 명시
- **googleBot**: 별도 설정 추가

### 4. GitHub Actions CI/CD (`.github/workflows/ci.yml`)
- **트리거**: push to main, PR to main
- **단계**:
  1. Checkout
  2. pnpm setup (action-setup@v4)
  3. Node.js 20 + pnpm cache
  4. `pnpm install --frozen-lockfile`
  5. `prisma generate`
  6. `pnpm lint`
  7. `tsc --noEmit` (타입 체크)
  8. `pnpm build`
- **환경변수**: GitHub Secrets에서 주입 (DB, OAuth, 등)
- **참고**: GH_OAUTH_CLIENT_ID로 이름 충돌 방지 (GitHub 예약 변수명)

## 변경된 파일

### 새로 생성
- `lib/redis.ts` — Upstash Redis 클라이언트 + Rate Limiter
- `lib/view-count.ts` — Redis 기반 조회수
- `lib/rate-limit.ts` — IP 기반 rate limiting 유틸
- `.github/workflows/ci.yml` — CI 파이프라인

### 수정
- `app/blog/[slug]/page.tsx` — Redis 조회수 사용
- `app/blog/page.tsx` — ISR revalidate 추가
- `app/page.tsx` — ISR revalidate 추가
- `app/layout.tsx` — Viewport, theme-color, preconnect, robots, antialiased
- `next.config.ts` — avif/webp, optimizePackageImports
- `actions/comments.ts` — rate limit 적용
- `actions/likes.ts` — rate limit 적용
- `turbo.json` — Redis/Resend 환경변수 추가

## 환경변수 (추가)

```
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io    # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=AXxxxx                    # Upstash Redis REST Token
```

## 기술 노트

### Graceful Degradation
- Redis, Resend 모두 환경변수 미설정 시 null 반환
- 조회수 → DB fallback, Rate Limit → skip, 이메일 → skip
- 개발 환경에서 외부 서비스 없이 동작 가능

### CI에서 GITHUB_ prefix 충돌
- GitHub Actions는 `GITHUB_` prefix 변수를 예약어로 사용
- OAuth Client ID/Secret은 `GH_OAUTH_CLIENT_ID`/`GH_OAUTH_CLIENT_SECRET`로 명명
- Vercel에서는 기존 `GITHUB_CLIENT_ID` 사용 (충돌 없음)

### Redis 조회수 동기화 전략
- 매 조회마다 Redis INCR (O(1), <1ms)
- 10회마다 비동기 DB UPDATE (데이터 영속성)
- 서버 재시작 시 Redis 값 유지 (Upstash 서버리스)

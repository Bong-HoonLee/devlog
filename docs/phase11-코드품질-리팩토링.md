# Phase 11: 코드 품질 검사 & 리팩토링

## 개요

전체 코드베이스를 대상으로 하드코딩, 중복 코드, 구조적 문제를 감사하고 리팩토링을 수행했다.
유지보수성과 확장성을 높이는 것이 목표.

## 주요 변경 사항

### 1. 중앙 집중 설정 (`lib/config.ts`)

흩어져 있던 모든 하드코딩 상수를 하나의 파일로 통합.

| 상수 | 설명 | 값 |
|------|------|-----|
| `BASE_URL` | 사이트 기본 URL | `process.env.NEXT_PUBLIC_SITE_URL` |
| `POSTS_PER_PAGE` | 페이지당 포스트 수 | 10 |
| `SEARCH_RESULTS_LIMIT` | 검색 최대 결과 수 | 10 |
| `RATE_LIMIT` | 레이트 리밋 (윈도우/최대 요청) | 10s / 10req |
| `UPLOAD` | 업로드 제한 (크기/타입/버킷) | 5MB, images |
| `VIEW_COUNT_SYNC_INTERVAL` | Redis→DB 동기화 주기 | 10 |
| `SEARCH_DEBOUNCE_MS` | 검색 디바운스 | 300ms |
| `AUTO_SAVE_DEBOUNCE_MS` | 자동 저장 디바운스 | 5000ms |
| `EDITOR_DEBOUNCE_MS` | 에디터 디바운스 | 300ms |
| `READING_SPEED_WPM` | 읽기 시간 계산 속도 | 200 WPM |
| `SCROLL_THRESHOLD_PX` | 스크롤 버튼 표시 임계값 | 400px |
| `EMOJI_OPTIONS` | 리액션 이모지 목록 | 6종 |
| `VALIDATION` | 입력 검증 한도 | 댓글 5000자, 태그 30자 등 |
| `POST_STATUSES` | 포스트 상태 enum | draft, published, scheduled |

### 2. 공유 인증 유틸 (`lib/auth-utils.ts`)

5개 action 파일에서 반복되던 인증 로직을 2개 함수로 통합.

- `requireAuth()` — 로그인 필수 (댓글, 좋아요, 리액션)
- `requireAdmin()` — 관리자 권한 필수 (글 CRUD, 시리즈, 업로드)

### 3. 태그 매핑 헬퍼 (`lib/utils.ts` → `mapPostTags()`)

6개 페이지에서 반복되던 태그 매핑 코드를 1개 함수로 통합.

```ts
// Before (6곳에서 반복)
post.tags.map((pt) => ({ name: pt.tag.name, slug: pt.tag.slug }))

// After
mapPostTags(post.tags)
```

### 4. Action 파일 리팩토링

| 파일 | 변경 내용 |
|------|-----------|
| `actions/posts.ts` | `validatePostInput()`, `buildTagsCreate()` 헬퍼 추출, 공유 인증 사용 |
| `actions/comments.ts` | 공유 인증, 댓글 길이 검증 추가, 에러 로깅 개선 |
| `actions/likes.ts` | 공유 인증, 레이트 리밋 사용 |
| `actions/reactions.ts` | 공유 인증, 이모지 검증(`EMOJI_OPTIONS`), 레이트 리밋 |
| `actions/series.ts` | 공유 인증, 제목 검증 추가 |
| `actions/subscribe.ts` | `BASE_URL` config에서 import |
| `actions/upload.ts` | `requireAdmin()` 사용, `UPLOAD` config 사용 |
| `actions/search.ts` | `SEARCH_RESULTS_LIMIT` config 사용 |

### 5. 페이지/컴포넌트 리팩토링

| 파일 | 변경 내용 |
|------|-----------|
| `app/layout.tsx` | `BASE_URL` → config |
| `app/page.tsx` | `mapPostTags()` 사용 |
| `app/blog/page.tsx` | `POSTS_PER_PAGE` → config, `mapPostTags()` 사용 |
| `app/blog/[slug]/page.tsx` | `BASE_URL` → config, `mapPostTags()` import |
| `app/tags/[tag]/page.tsx` | `mapPostTags()` 사용 |
| `app/series/[slug]/page.tsx` | `mapPostTags()` 사용 |
| `app/sitemap.ts` | `BASE_URL` → config |
| `app/robots.ts` | `BASE_URL` → config |
| `app/api/rss/route.ts` | `BASE_URL` → config |
| `app/api/subscribe/verify/route.ts` | `BASE_URL` → config |
| `components/comments/reactions.tsx` | `EMOJI_OPTIONS` → config |
| `components/blog/search-palette.tsx` | `SEARCH_DEBOUNCE_MS` → config |
| `components/admin/post-editor.tsx` | `AUTO_SAVE_DEBOUNCE_MS` → config |
| `components/ui/scroll-to-top.tsx` | `SCROLL_THRESHOLD_PX` → config |
| `lib/redis.ts` | `RATE_LIMIT` → config |
| `lib/view-count.ts` | `VIEW_COUNT_SYNC_INTERVAL` → config |

## 개선 효과 요약

| 지표 | Before | After |
|------|--------|-------|
| `BASE_URL` 선언 | 8곳 | 1곳 (`lib/config.ts`) |
| 태그 매핑 로직 | 6곳 중복 | 1곳 (`mapPostTags()`) |
| 인증 로직 | 5곳 중복 | 1곳 (`lib/auth-utils.ts`) |
| 매직 넘버 | 15+ 곳 산재 | `lib/config.ts` 통합 관리 |

## 확장 시 이점

- **상수 변경**: `lib/config.ts` 한 곳만 수정하면 전체 반영
- **인증 정책 변경**: `lib/auth-utils.ts` 수정으로 전체 적용
- **새 action 추가 시**: 공유 모듈 import만으로 일관된 패턴 유지
- **테스트 작성 시**: config를 모킹하여 다양한 시나리오 테스트 가능

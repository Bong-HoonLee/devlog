# Phase 6: UX 개선 — 페이지네이션, 전문 검색, 시리즈, 애니메이션

## 완료 날짜: 2026-03-09

## 구현 내용

### 1. 블로그 목록 페이지네이션
- **파일**: `app/blog/page.tsx`, `components/blog/pagination.tsx`
- 페이지당 10개 포스트 (POSTS_PER_PAGE = 10)
- `?page=` 쿼리 파라미터 기반
- 총 개수는 `prisma.post.count()`로 별도 쿼리
- 페이지네이션 UI: 이전/다음 + 페이지 번호 (7개 이하 전체 표시, 초과 시 ... 생략)

### 2. PostgreSQL tsvector 전문 검색
- **파일**: `actions/search.ts`, `prisma/migrations/20260309000000_add_search_index/migration.sql`
- GIN 인덱스 생성: title(A 가중치), excerpt(B), content(C) weighted tsvector
- `'simple'` dictionary 사용 (한국어 호환)
- 사용자 쿼리 → `word:*` prefix match → `&` AND 결합
- `ts_rank()` 기반 관련도 정렬
- 특수문자 에러 시 fallback: 기존 `contains` 검색

### 3. 시리즈 기능
- **액션**: `actions/series.ts` — CRUD (getSeries, getSeriesBySlug, getAllSeries, createSeries, updateSeries, deleteSeries)
- **어드민**: `app/admin/series/page.tsx` — 시리즈 생성/삭제, 목록 관리
- **공개 페이지**:
  - `app/series/page.tsx` — 시리즈 목록 (그리드 카드)
  - `app/series/[slug]/page.tsx` — 시리즈 상세 (순서 번호 + PostCard)
- **시리즈 네비게이션**: `components/blog/series-nav.tsx`
  - 포스트 상세에서 같은 시리즈 글 목록 표시
  - 이전/다음 글 링크
- **에디터 연동**: PostEditor에 시리즈 선택 드롭다운 추가
- **헤더**: Series 링크 추가 (Blog, Series, Tags, About)
- **DB**: 기존 Series 모델 + Post.seriesId 관계 활용

### 4. Framer Motion 애니메이션
- **컴포넌트**:
  - `components/ui/fade-in.tsx` — opacity + y 축 fade-in (configurable delay)
  - `components/ui/animated-list.tsx` — 리스트 아이템 stagger 애니메이션 (0.05s delay 간격)
- **적용 페이지**: 메인 페이지, 블로그 목록 페이지

## 변경된 파일

### 새로 생성
- `components/blog/pagination.tsx`
- `components/blog/series-nav.tsx`
- `components/ui/animated-list.tsx`
- `components/ui/fade-in.tsx`
- `actions/series.ts`
- `app/admin/series/page.tsx`
- `app/series/page.tsx`
- `app/series/[slug]/page.tsx`
- `prisma/migrations/20260309000000_add_search_index/migration.sql`

### 수정
- `app/blog/page.tsx` — 페이지네이션 + 애니메이션
- `app/blog/[slug]/page.tsx` — 시리즈 네비게이션
- `app/page.tsx` — 애니메이션
- `app/admin/layout.tsx` — 시리즈 메뉴 추가
- `app/admin/posts/new/page.tsx` — 시리즈 선택 props
- `app/admin/posts/[id]/page.tsx` — 시리즈 선택 props
- `actions/posts.ts` — seriesId 처리
- `actions/search.ts` — tsvector 전문 검색
- `components/admin/post-editor.tsx` — 시리즈 선택 UI
- `components/layout/header.tsx` — Series 링크

## 기술 노트

### tsvector 검색
- Prisma의 `$queryRaw`로 PostgreSQL 네이티브 전문 검색 사용
- `'simple'` dictionary는 언어별 stemming 없이 토큰화만 수행 → 한국어 호환
- prefix match (`:*`)로 부분 일치 지원
- 가중치 A/B/C로 제목 > 요약 > 본문 순 우선 순위

### 시리즈-포스트 관계
- Post 모델에 이미 seriesId 필드 존재 (Phase 1에서 설계)
- `series.posts` 정렬은 `publishedAt: "asc"` (시간순)
- 시리즈 삭제 시 연결된 포스트의 seriesId를 null로 초기화 (cascade 아님)

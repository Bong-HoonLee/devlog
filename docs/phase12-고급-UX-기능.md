# Phase 12: 고급 UX 기능

## 개요

기술 블로그로서의 완성도와 차별화를 위해 6가지 고급 기능을 추가했다.

## 구현 기능

### 1. TOC 하이라이팅 개선

**파일**: `components/blog/toc.tsx`

기존 Intersection Observer 기반 활성 항목 표시에 시각적 인디케이터를 추가했다.

- 왼쪽 보더라인 (비활성 항목 가이드)
- 파란색 인디케이터 바가 활성 항목을 따라 이동 (`transition-all duration-200`)
- `CSS.escape()`로 특수문자 포함 ID 안전 처리
- `data-id` 속성 + `getBoundingClientRect()`로 위치 계산

### 2. 댓글 편집

**파일**: `actions/comments.ts`, `components/comments/comment-item.tsx`

기존 삭제만 가능하던 댓글에 수정 기능을 추가했다.

**서버 액션**:
- `updateComment(commentId, content)` — 본인 댓글만 수정 가능
- `findCommentOrThrow()` 헬퍼로 update/delete 공통 조회 로직 추출
- `validateCommentContent()` 헬퍼로 create/update 공통 검증 로직 추출

**클라이언트**:
- 인라인 편집 UI (textarea + 저장/취소 버튼)
- `useTransition`으로 저장 중 상태 관리
- HTML → 텍스트 변환으로 기존 내용 복원 (`textContent`)
- 편집 중 리액션/답글 버튼 숨김

**권한**: 본인 댓글만 수정 가능 (관리자도 타인 댓글 수정 불가, 삭제만 가능)

### 3. 읽기 진행률 바

**파일**: `components/ui/reading-progress.tsx`

블로그 포스트 상세 페이지 상단에 스크롤 진행률을 표시한다.

- `scroll` 이벤트 (passive) + `scrollY / (scrollHeight - innerHeight)` 계산
- `transition-[width] duration-150`으로 부드러운 너비 변화
- 진행률 0%일 때 렌더링 안 함 (불필요한 DOM 방지)
- 블루 테마 (`bg-blue-600`, 다크: `bg-blue-400`)

### 4. 코드 diff 하이라이팅

**파일**: `lib/markdown.ts`, `globals.css`

Shiki Transformers를 활용해 코드 블록 내에서 diff/하이라이트/포커스를 지원한다.

**사용법** (마크다운 코드 블록 내):
```
// [!code ++]  → 추가된 줄 (초록 배경 + "+" 마커)
// [!code --]  → 삭제된 줄 (빨강 배경 + "-" 마커)
// [!code highlight]  → 강조 줄 (파랑 배경)
// [!code focus]  → 포커스 줄 (나머지 흐리게, 호버 시 복원)
```

**의존성**: `@shikijs/transformers`
- `transformerNotationDiff()` — diff 표기
- `transformerNotationHighlight()` — 라인 강조
- `transformerNotationFocus()` — 포커스 모드

**CSS**: 라이트/다크 모드별 배경색, +/- pseudo-element 마커

### 5. View Transitions (페이지 전환 애니메이션)

**파일**: `components/ui/view-transitions.tsx`, `globals.css`

CSS View Transitions API를 활용해 페이지 이동 시 부드러운 fade 애니메이션을 적용한다.

- `@view-transition { navigation: auto; }` — 브라우저 네이티브 전환
- `::view-transition-old` / `::view-transition-new` — 커스텀 애니메이션
- fade-out: opacity 1→0 + translateY(-8px), 0.15s
- fade-in: opacity 0→1 + translateY(8px), 0.15s
- `viewTransitionName = "main-content"` — main 영역에만 적용
- 미지원 브라우저에서는 자동으로 무시됨 (점진적 향상)

### 6. 커맨드 팔레트 확장

**파일**: `components/blog/search-palette.tsx`, `lib/config.ts`

기존 검색 전용 팔레트를 Raycast 스타일 다기능 커맨드 팔레트로 확장했다.

**기능**:
- **글 검색** — 기존 tsvector 검색 (입력 시 자동 전환)
- **페이지 이동** — 홈, 블로그, 태그, 시리즈, 소개 (5개)
- **테마 전환** — 라이트, 다크, 시스템 (현재 테마 "현재" 표시)
- **키보드 힌트** — 하단에 ↑↓ 이동, ↵ 선택, esc 닫기

**설정 중앙화**: `NAV_PAGES`, `THEME_OPTIONS`를 `lib/config.ts`에서 관리

## 리팩토링 내역

| 파일 | 개선 내용 |
|------|-----------|
| `actions/comments.ts` | `findCommentOrThrow()`, `validateCommentContent()` 헬퍼 추출 → create/update/delete 중복 제거 |
| `components/blog/search-palette.tsx` | `PAGES` 하드코딩 → `NAV_PAGES` config, 테마 반복 코드 → `THEME_OPTIONS` 배열 순회 |
| `components/blog/toc.tsx` | `CSS.escape()`로 특수문자 ID 안전 처리 |
| `components/ui/view-transitions.tsx` | 불필요한 pathname 의존성 제거, DOM 조작 최소화 |
| `lib/config.ts` | `NAV_PAGES`, `THEME_OPTIONS` 추가 |

## 브라우저 호환성

| 기능 | Chrome | Firefox | Safari |
|------|--------|---------|--------|
| View Transitions | 111+ | 미지원 | 18+ |
| CSS.escape | 전체 | 전체 | 전체 |
| Intersection Observer | 전체 | 전체 | 전체 |

View Transitions는 점진적 향상(progressive enhancement)으로 적용되어 미지원 브라우저에서도 정상 동작한다 (애니메이션만 생략).

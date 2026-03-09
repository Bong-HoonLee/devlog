# Phase 10: 추가 개선 — 코드 복사, 관련 글, 404, 공유, 통계, D&D, 스켈레톤

## 완료 날짜: 2026-03-09

## 구현 내용

### 1. 코드 블록 복사 버튼
- **파일**: `components/blog/copy-code-button.tsx`
- 클라이언트 컴포넌트, 포스트 상세에서 자동 활성화
- `article pre` 요소에 동적으로 Copy 버튼 삽입
- hover 시 버튼 표시 (opacity transition)
- 클릭 → `navigator.clipboard.writeText()` → "Copied!" 2초 표시
- 이벤트 위임 패턴 (data-copy-code attribute)

### 2. 관련 글 추천
- **파일**: `components/blog/related-posts.tsx`
- Server Component — 같은 태그를 공유하는 글 최대 3개 쿼리
- 현재 글 제외, 발행일 최신순
- 3열 그리드 카드 UI (제목, 요약, 날짜)
- 태그 없는 글이면 렌더링 안 함
- 포스트 본문 아래, 댓글 위에 배치

### 3. 404 페이지 디자인
- **파일**: `app/not-found.tsx`
- 큰 "404" 텍스트 (8xl) + 설명 메시지
- "홈으로" (파란 버튼) + "블로그 보기" (아웃라인 버튼)
- 다크모드 대응

### 4. 글 공유 버튼
- **파일**: `components/blog/share-buttons.tsx`
- Twitter(X) 공유: `twitter.com/intent/tweet` URL 스킴
- 링크 복사: `navigator.clipboard` + 체크 아이콘 피드백
- 포스트 헤더 태그 옆에 배치

### 5. 어드민 인기글 통계
- **파일**: `app/admin/page.tsx`
- 조회수 기준 TOP 5 인기 글 랭킹
- 순위 번호 + 글 제목 (편집 링크) + 조회수
- 기존 통계 카드 아래 배치

### 6. 에디터 드래그 앤 드롭 이미지 업로드
- **파일**: `components/admin/tiptap-editor.tsx`
- `handleDrop`: 이미지 파일 드래그 → 드롭 위치에 삽입
- `handlePaste`: 클립보드 이미지 붙여넣기 → 커서 위치에 삽입
- Supabase Storage `uploadImage()` 서버 액션 호출
- 업로드 실패 시 alert 에러 메시지

### 7. 로딩 스켈레톤 UI
- **파일**: `components/ui/skeleton.tsx`
  - `Skeleton` — 기본 animate-pulse 블록
  - `PostCardSkeleton` — 포스트 카드 형태 스켈레톤
  - `PostListSkeleton` — 카드 N개 반복
  - `PostDetailSkeleton` — 상세 페이지 스켈레톤
- **로딩 파일**:
  - `app/blog/loading.tsx` — 블로그 목록 로딩
  - `app/blog/[slug]/loading.tsx` — 포스트 상세 로딩
- Next.js Streaming + Suspense로 자동 표시

### 8. 읽기 시간 표시
- **파일**: `lib/utils.ts` — `readingTime()` 함수 추가
- 공백 기준 단어 수 / 200 (분당 읽기 속도)
- 최소 1분, 포스트 헤더에 "N분 읽기" 표시

## 변경된 파일

### 새로 생성
- `components/blog/copy-code-button.tsx`
- `components/blog/related-posts.tsx`
- `components/blog/share-buttons.tsx`
- `components/ui/skeleton.tsx`
- `app/not-found.tsx`
- `app/blog/loading.tsx`
- `app/blog/[slug]/loading.tsx`

### 수정
- `app/blog/[slug]/page.tsx` — 코드 복사, 관련 글, 공유 버튼, 읽기 시간 통합
- `app/admin/page.tsx` — 인기글 TOP 5 랭킹 추가
- `components/admin/tiptap-editor.tsx` — 드래그 앤 드롭 / 붙여넣기 이미지 업로드
- `lib/utils.ts` — readingTime() 함수 추가

## 외부 서비스 연동 현황 (전체)

| 서비스 | 용도 | 상태 |
|--------|------|------|
| Supabase PostgreSQL | DB | 연동 완료 |
| Supabase Storage | 이미지 업로드 | 연동 완료 |
| NextAuth.js v5 | GitHub/Google OAuth | 연동 완료 |
| Upstash Redis | 조회수, Rate Limiting | 연동 완료 |
| Resend | 댓글 알림, 구독 확인 이메일 | 연동 완료 |
| Vercel | 호스팅, 배포 | 연동 완료 |

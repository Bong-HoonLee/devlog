# Phase 7: 소셜 기능 — 좋아요, 리액션, 댓글 마크다운, 이메일 알림, 알림 센터

## 완료 날짜: 2026-03-09

## 구현 내용

### 1. 좋아요 버튼 UI
- **파일**: `components/blog/like-button.tsx`
- `useOptimistic` (React 19)으로 즉각 반응 UI
- 좋아요 토글: ❤️ / 🤍 + 카운트
- 로그인 상태에 따라 현재 유저의 좋아요 여부 표시
- 포스트 상세 페이지 본문 아래 중앙 배치

### 2. 이모지 리액션 UI
- **파일**: `components/comments/reactions.tsx`
- 지원 이모지: 👍 ❤️ 🎉 😄 🤔 👀
- 그룹별 카운트 표시 + 내가 누른 이모지 하이라이트 (파란색 배경)
- "+" 버튼 hover 시 이모지 피커 표시
- 댓글과 대댓글 모두에 리액션 표시
- `toggleReaction` 서버 액션으로 토글

### 3. 댓글 마크다운 렌더링
- **파일**: `lib/comment-markdown.ts`
- 간단한 inline 마크다운만 지원 (보안상 block-level 제외)
- 지원 문법: **bold**, *italic*, `code`, ~~strikethrough~~, [link](url), 줄바꿈
- HTML escape 처리 (XSS 방지)
- 댓글 생성 시 마크다운 → HTML 변환 후 저장
- `dangerouslySetInnerHTML`로 렌더링 (`prose prose-sm` 스타일)

### 4. Resend 이메일 알림
- **패키지**: `resend` 설치
- **파일**: `lib/resend.ts` (Resend 클라이언트 싱글턴)
- 대댓글 작성 시 원댓글 작성자에게 이메일 자동 발송
- fire-and-forget 패턴 (응답 대기 없이 비동기 전송)
- 환경변수: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- HTML 이메일 템플릿: 답글 작성자, 원문 인용, 글 링크 포함

### 5. 알림 센터
- **액션**: `actions/notifications.ts`
  - `getNotifications()` — 최근 50개 알림 조회
  - `getUnreadCount()` — 읽지 않은 알림 수
  - `markAllAsRead()` — 모두 읽음 처리
  - `markAsRead(id)` — 개별 읽음 처리
- **페이지**: `app/notifications/page.tsx`
  - 로그인 필수 (미로그인 시 signin redirect)
  - 읽지 않은 알림 파란색 배경 하이라이트
  - "모두 읽음 처리" 버튼
  - 알림 타입별 메시지 (reply, reaction)
- **알림 벨**: `components/ui/notification-bell.tsx`
  - 헤더에 벨 아이콘 (로그인 시에만 표시)
  - 읽지 않은 알림 수 빨간 뱃지 (9+ 표시)

### 6. DB 알림 자동 생성
- 대댓글 작성 시 자동으로 Notification 레코드 생성
- 본인 댓글에 본인이 답글 달면 알림 생성하지 않음

## 변경된 파일

### 새로 생성
- `components/blog/like-button.tsx`
- `components/comments/reactions.tsx`
- `components/ui/notification-bell.tsx`
- `lib/comment-markdown.ts`
- `lib/resend.ts`
- `actions/notifications.ts`
- `app/notifications/page.tsx`

### 수정
- `app/blog/[slug]/page.tsx` — 좋아요 버튼, postSlug 전달
- `components/comments/comment-item.tsx` — 리액션 UI, 마크다운 렌더링, postSlug prop
- `components/comments/comment-list.tsx` — postSlug prop 추가
- `components/layout/header.tsx` — 알림 벨 아이콘
- `actions/comments.ts` — 마크다운 변환, 알림 생성, 이메일 발송

## 환경변수 (추가)

```
RESEND_API_KEY=re_xxxx        # Resend API 키 (없으면 이메일 발송 skip)
RESEND_FROM_EMAIL=noreply@yourdomain.com  # 발신자 이메일 (기본: noreply@resend.dev)
```

## 기술 노트

### React 19 useOptimistic
- 좋아요 버튼에서 서버 응답 전에 UI 즉시 업데이트
- `startTransition` 내에서 optimistic 상태 설정 + 서버 액션 호출

### 이메일 발송 전략
- Resend API 키가 없으면 이메일 발송 자체를 skip (개발 환경 호환)
- `.catch(() => {})` 로 fire-and-forget — 이메일 실패가 댓글 작성을 막지 않음

### 댓글 마크다운 보안
- block-level 요소 (headings, code blocks, lists) 미지원으로 악용 방지
- HTML 이스케이프 우선 적용 후 마크다운 변환
- 링크는 `target="_blank" rel="noopener noreferrer"` 적용

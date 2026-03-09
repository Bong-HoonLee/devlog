# Phase 9: 확장 — 이메일 구독, 포트폴리오 페이지

## 완료 날짜: 2026-03-09

## 구현 내용

### 1. 이메일 구독 시스템

#### DB 모델
```prisma
model Subscriber {
  id        String   @id @default(cuid())
  email     String   @unique
  verified  Boolean  @default(false)
  token     String   @unique @default(cuid())
  createdAt DateTime @default(now())
}
```

#### 구독 흐름
1. 사용자가 이메일 입력 → `subscribe()` 서버 액션
2. 이메일 유효성 검증 + rate limit 체크
3. Subscriber 레코드 생성 (verified: false)
4. Resend로 확인 이메일 발송 (확인 링크 포함)
5. 사용자가 확인 링크 클릭 → `GET /api/subscribe/verify?token=xxx`
6. verified: true로 업데이트 → 홈페이지로 리다이렉트

#### 구독 해지
- `/unsubscribe?token=xxx` 페이지에서 자동 해지
- Subscriber 레코드 완전 삭제

#### 개발 모드 대응
- Resend API 키 미설정 시 확인 절차 skip, 즉시 verified: true

### 2. 포트폴리오 페이지 (`/about`)

#### 섹션 구성
1. **Hero** — 인사말 + 소개
2. **Skills** — 카테고리별 기술 스택 (Frontend, Backend, DevOps, Tools) 그리드 카드
3. **Projects** — 프로젝트 카드 (설명, 기술 태그, Live/GitHub 링크)
4. **Timeline** — 연도별 이력 (세로 타임라인 UI)
5. **Contact** — GitHub, Email 아이콘 버튼

모든 섹션에 FadeIn 애니메이션 적용 (stagger delay)

### 3. 어드민 대시보드 업데이트
- 구독자 수, 좋아요 수 통계 카드 추가
- 그리드 3열 레이아웃으로 변경

### 4. 구독 폼 UI (`components/blog/subscribe-form.tsx`)
- 메인 페이지 하단에 배치
- useActionState로 폼 상태 관리
- 성공/에러 메시지 표시
- 로딩 상태 처리

## 변경된 파일

### 새로 생성
- `actions/subscribe.ts` — subscribe, unsubscribe, getSubscriberCount
- `components/blog/subscribe-form.tsx` — 구독 폼 UI
- `app/api/subscribe/verify/route.ts` — 이메일 확인 API
- `app/unsubscribe/page.tsx` — 구독 해지 페이지

### 수정
- `prisma/schema.prisma` — Subscriber 모델 추가
- `app/about/page.tsx` — 포트폴리오 페이지로 완전 리디자인
- `app/page.tsx` — 구독 폼 추가
- `app/admin/page.tsx` — 구독자/좋아요 통계 추가

## 미구현 (제외)
- **커스텀 도메인** — 유료 도메인 구매 불필요, vercel.app 서브도메인 사용

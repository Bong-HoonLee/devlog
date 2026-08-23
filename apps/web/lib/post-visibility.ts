import type { Prisma } from "@prisma/client";

/**
 * 공개 글의 조건.
 *
 * status 가 "published" 이거나, 예약 시각이 이미 지난 "scheduled" 글입니다.
 * status 컬럼의 승격은 pg_cron 이 DB 안에서 1분마다 처리하지만(마이그레이션
 * 20260823000000_publish_scheduled_posts), 그 작업이 멈추더라도 예약 시각이 되면
 * 글이 공개되도록 읽기 경로에서 시간 조건을 함께 판단합니다.
 *
 * new Date() 를 모듈 로드 시점이 아니라 호출 시점에 만들기 위해 함수입니다.
 */
export function publicPostWhere(): Prisma.PostWhereInput {
  return {
    OR: [
      { status: "published" },
      { status: "scheduled", scheduledAt: { lte: new Date() } },
    ],
  };
}

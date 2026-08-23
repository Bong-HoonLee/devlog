-- 예약 발행: 예약 시각이 지난 글의 status 를 published 로 승격시킵니다.
--
-- 글의 "공개 여부" 자체는 애플리케이션의 publicPostWhere() 가
-- (status='scheduled' AND "scheduledAt" <= now()) 조건으로 이미 처리합니다.
-- 이 작업의 목적은 status 컬럼을 실제 상태와 일치시켜서,
-- 앞으로 status='published' 로만 필터하는 쿼리가 새로 생기더라도
-- 예약 시각이 지난 글이 그 화면에서 조용히 누락되지 않도록 하는 것입니다.
--
-- Vercel Cron 대신 Postgres 자체 스케줄러를 쓰는 이유:
--   - Hobby 플랜의 Vercel Cron 은 하루 1회가 한계라 불변조건 역할을 못 합니다
--   - 공개 HTTP 엔드포인트가 없으므로 CRON_SECRET 같은 보호 장치가 불필요합니다
--   - 애플리케이션 배포 상태와 무관하게 DB 안에서 동작합니다

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 승격 대상(예약 상태)만 담는 부분 인덱스. 발행된 글이 쌓여도 크기가 늘지 않습니다.
CREATE INDEX IF NOT EXISTS "Post_scheduled_due_idx"
  ON "Post" ("scheduledAt")
  WHERE status = 'scheduled';

-- 공개 목록/RSS/sitemap 의 공통 접근 경로(발행글을 publishedAt 역순 정렬).
CREATE INDEX IF NOT EXISTS "Post_published_idx"
  ON "Post" ("publishedAt" DESC)
  WHERE status = 'published';

-- 같은 이름으로 다시 호출하면 기존 작업을 갱신하므로 재실행에 안전합니다.
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *',
  $$
    UPDATE "Post"
       SET status = 'published'
     WHERE status = 'scheduled'
       AND "scheduledAt" <= now()
  $$
);

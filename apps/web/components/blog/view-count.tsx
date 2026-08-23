import { connection } from "next/server";
import { incrementViewCount } from "@/lib/view-count";

export async function ViewCount({ slug }: { slug: string }) {
  // 조회수 증가는 부수효과가 있는 요청 시점 작업입니다.
  // connection() 으로 프리렌더에서 제외하지 않으면 빌드할 때마다 조회수가 오르고,
  // Upstash 클라이언트 내부의 Date.now() 가 프리렌더를 실패시킵니다.
  await connection();

  const count = await incrementViewCount(slug);

  return <span>{count} views</span>;
}

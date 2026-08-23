"use client";

import { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";

/**
 * 링크 클릭 후 새 화면이 도착할 때까지 상단에 진행 바를 띄웁니다.
 *
 * /blog/[slug] 는 loading.tsx 를 둘 수 없습니다. 로딩 경계가 생기면 셸이 먼저
 * 200 으로 스트리밍되어 없는 글의 notFound() 가 soft-404 가 되기 때문입니다.
 * 그래서 세그먼트 경계 대신 링크 단위 pending 상태로 피드백을 줍니다.
 */
export function NavProgress() {
  const { pending } = useLinkStatus();

  if (!pending || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="progressbar"
      aria-label="페이지 이동 중"
      className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-blue-100 dark:bg-blue-950"
    >
      <div className="nav-progress-bar h-full w-1/4 rounded-full bg-blue-600 dark:bg-blue-400" />
    </div>,
    document.body
  );
}

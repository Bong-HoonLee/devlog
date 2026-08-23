import Link from "next/link";
import type { ComponentProps } from "react";
import { NavProgress } from "@/components/ui/nav-progress";

// next/link 와 동일하게 쓰되, 이동이 끝날 때까지 상단 진행 바를 보여줍니다.
export function ProgressLink({
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <NavProgress />
    </Link>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  HeaderSession,
  HeaderSessionFallback,
} from "@/components/layout/header-session";

const navItems = [
  { href: "/blog", label: "Blog" },
  { href: "/series", label: "Series" },
  { href: "/tags", label: "Tags" },
  { href: "/about", label: "About" },
];

// 헤더 자체는 세션을 읽지 않는 정적 셸입니다. 세션 의존 UI 는 HeaderSession 으로 분리해
// Suspense 안에서 스트리밍되므로, 이 레이아웃을 쓰는 모든 페이지가 프리렌더 가능합니다.
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Dev Blog
        </Link>
        <nav className="flex items-center gap-4">
          {navItems.map((item: { href: string; label: string }) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}

          <ThemeToggle />

          <Suspense fallback={<HeaderSessionFallback />}>
            <HeaderSession />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// 인증이 필요한 화면이라 요청 시점 렌더가 정상입니다.
// 프리페치 이득이 없으므로 즉시 렌더 검증에서 제외합니다.
export const instant = false;

const adminNav = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/posts", label: "글 관리" },
  { href: "/admin/posts/new", label: "새 글 작성" },
  { href: "/admin/series", label: "시리즈" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
        <h1 className="text-2xl font-bold">Admin</h1>
        <nav className="flex gap-4">
          {adminNav.map((item: { href: string; label: string }) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}

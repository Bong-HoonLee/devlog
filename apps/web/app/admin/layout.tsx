import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const adminNav = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/posts", label: "글 관리" },
  { href: "/admin/posts/new", label: "새 글 작성" },
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

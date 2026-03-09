import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/ui/notification-bell";

const navItems = [
  { href: "/blog", label: "Blog" },
  { href: "/series", label: "Series" },
  { href: "/tags", label: "Tags" },
  { href: "/about", label: "About" },
];

export async function Header() {
  const session = await auth();

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

          {session?.user.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Admin
            </Link>
          )}

          <ThemeToggle />

          {session ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

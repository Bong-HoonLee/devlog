import Image from "next/image";
import Link from "next/link";
import { getSession, signOut } from "@/lib/auth";
import { NotificationBell } from "@/components/ui/notification-bell";

/**
 * 헤더에서 세션에 의존하는 부분만 떼어낸 조각입니다.
 *
 * 루트 레이아웃에서 auth() 를 직접 await 하면 쿠키 접근 때문에 모든 페이지가
 * 요청 시점 렌더로 떨어지고, 그러면 정적 셸이 없어 <Link> 프리페치도 동작하지 않습니다.
 * 이 컴포넌트만 <Suspense> 안에 두면 나머지 헤더와 페이지 본문은 프리렌더됩니다.
 */
export async function HeaderSession() {
  const session = await getSession();

  return (
    <>
      {session?.user.role === "admin" && (
        <Link
          href="/admin"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Admin
        </Link>
      )}

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
    </>
  );
}

// 세션이 도착하기 전 자리를 잡아 레이아웃 이동을 막습니다.
export function HeaderSessionFallback() {
  return <div className="h-8 w-20" aria-hidden />;
}

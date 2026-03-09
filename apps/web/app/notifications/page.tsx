import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNotifications, markAllAsRead, markAsRead } from "@/actions/notifications";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "알림" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const notifications = await getNotifications();
  const hasUnread = notifications.some((n: { isRead: boolean }) => !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">알림</h1>
        {hasUnread && (
          <form action={markAllAsRead}>
            <button
              type="submit"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              모두 읽음 처리
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">알림이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: {
            id: string;
            type: string;
            isRead: boolean;
            createdAt: Date;
            comment: {
              user: { name: string; image: string | null };
              post: { slug: string; title: string };
            };
          }) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                n.isRead
                  ? "border-gray-200 dark:border-gray-800"
                  : "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
              }`}
            >
              {n.comment.user.image && (
                <Image
                  src={n.comment.user.image}
                  alt={n.comment.user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{n.comment.user.name}</span>
                  {n.type === "reply"
                    ? "님이 회원님의 댓글에 답글을 남겼습니다."
                    : "님이 회원님의 댓글에 리액션을 남겼습니다."}
                </p>
                <Link
                  href={`/blog/${n.comment.post.slug}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {n.comment.post.title}
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <form action={async () => {
                  "use server";
                  await markAsRead(n.id);
                }}>
                  <button
                    type="submit"
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    읽음
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

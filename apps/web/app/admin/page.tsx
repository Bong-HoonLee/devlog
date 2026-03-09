import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [postCount, publishedCount, draftCount, commentCount, subscriberCount, likeCount, popularPosts] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.comment.count(),
      prisma.subscriber.count({ where: { verified: true } }),
      prisma.like.count(),
      prisma.post.findMany({
        where: { status: "published" },
        orderBy: { viewCount: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, viewCount: true },
      }),
    ]);

  const stats = [
    { label: "전체 글", value: postCount },
    { label: "발행됨", value: publishedCount },
    { label: "임시저장", value: draftCount },
    { label: "댓글", value: commentCount },
    { label: "좋아요", value: likeCount },
    { label: "구독자", value: subscriberCount },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">대시보드</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat: { label: string; value: number }) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Popular Posts */}
      {popularPosts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">인기 글 TOP 5</h3>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800">
            {popularPosts.map((post: { id: string; title: string; slug: string; viewCount: number }, index: number) => (
              <div
                key={post.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  index > 0 ? "border-t border-gray-200 dark:border-gray-800" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {post.viewCount} views
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

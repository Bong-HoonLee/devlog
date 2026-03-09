import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [postCount, publishedCount, draftCount, commentCount] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.comment.count(),
    ]);

  const stats = [
    { label: "전체 글", value: postCount },
    { label: "발행됨", value: publishedCount },
    { label: "임시저장", value: draftCount },
    { label: "댓글", value: commentCount },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">대시보드</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
    </div>
  );
}

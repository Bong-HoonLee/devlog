import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/blog/post-card";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 5,
    include: { tags: { include: { tag: true } } },
  });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Dev Blog</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          개발과 기술에 대한 이야기를 기록합니다.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Ctrl+K로 검색하세요
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">최근 포스트</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            아직 작성된 포스트가 없습니다.
          </p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                publishedAt={post.publishedAt}
                tags={post.tags.map((pt) => ({
                  name: pt.tag.name,
                  slug: pt.tag.slug,
                }))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

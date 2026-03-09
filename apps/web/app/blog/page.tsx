import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/blog/post-card";
import type { PostWithTags } from "@/actions/posts";

export const metadata = {
  title: "Blog",
  description: "개발과 기술에 대한 글 목록",
};

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          총 {posts.length}개의 글
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          아직 작성된 포스트가 없습니다.
        </p>
      ) : (
        <div className="space-y-6">
          {posts.map((post: PostWithTags) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              tags={post.tags.map((pt: { tag: { name: string; slug: string } }) => ({
                name: pt.tag.name,
                slug: pt.tag.slug,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

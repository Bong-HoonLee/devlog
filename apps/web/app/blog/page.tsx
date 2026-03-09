import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/blog/post-card";
import { Pagination } from "@/components/blog/pagination";
import { AnimatedList } from "@/components/ui/animated-list";
import { FadeIn } from "@/components/ui/fade-in";
import { mapPostTags } from "@/lib/utils";
import { POSTS_PER_PAGE } from "@/lib/config";
import type { PostWithTags } from "@/actions/posts";

export const revalidate = 60;

export const metadata = {
  title: "Blog",
  description: "개발과 기술에 대한 글 목록",
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      include: { tags: { include: { tag: true } } },
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where: { status: "published" } }),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            총 {totalCount}개의 글
          </p>
        </div>
      </FadeIn>

      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          아직 작성된 포스트가 없습니다.
        </p>
      ) : (
        <AnimatedList>
          {posts.map((post: PostWithTags) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              tags={mapPostTags(post.tags)}
            />
          ))}
        </AnimatedList>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/blog" />
    </div>
  );
}

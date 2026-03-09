import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/blog/post-card";
import { SubscribeForm } from "@/components/blog/subscribe-form";
import { AnimatedList } from "@/components/ui/animated-list";
import { FadeIn } from "@/components/ui/fade-in";
import { mapPostTags } from "@/lib/utils";
import type { PostWithTags } from "@/actions/posts";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 5,
    include: { tags: { include: { tag: true } } },
  });

  return (
    <div className="space-y-8">
      <FadeIn>
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Dev Blog</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            개발과 기술에 대한 이야기를 기록합니다.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Ctrl+K로 검색하세요
          </p>
        </section>
      </FadeIn>

      <section className="space-y-6">
        <FadeIn delay={0.1}>
          <h2 className="text-2xl font-semibold">최근 포스트</h2>
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
      </section>

      <FadeIn delay={0.2}>
        <SubscribeForm />
      </FadeIn>
    </div>
  );
}

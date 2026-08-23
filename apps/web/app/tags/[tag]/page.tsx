import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { publicPostWhere } from "@/lib/post-visibility";
import { getTagWithPosts } from "@/lib/queries";
import { PostCard } from "@/components/blog/post-card";
import { mapPostTags } from "@/lib/utils";

interface Props {
  params: Promise<{ tag: string }>;
}

// 공개 글이 달린 태그는 프리렌더해 프리페치가 동작하게 합니다.
export async function generateStaticParams() {
  const tags = await prisma.tag.findMany({
    where: { posts: { some: { post: publicPostWhere() } } },
    select: { slug: true },
  });

  if (tags.length === 0) return [{ tag: "__no-tags__" }];

  return tags.map((tag: { slug: string }) => ({ tag: tag.slug }));
}

// 없는 태그에 대해 notFound() 가 진짜 404 를 내려면 셸을 먼저 흘려보내면 안 됩니다.
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const tag = await getTagWithPosts(tagSlug);
  if (!tag) return {};
  return { title: `${tag.name} 태그` };
}

export default async function TagPage({ params }: Props) {
  const { tag: tagSlug } = await params;

  const tag = await getTagWithPosts(tagSlug);

  if (!tag) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{tag.name}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {tag.posts.length}개의 글
        </p>
      </div>

      <div className="space-y-6">
        {tag.posts.map((pt: { post: { id: string; title: string; slug: string; excerpt: string | null; publishedAt: Date | null; tags: { tag: { name: string; slug: string } }[] } }) => (
          <PostCard
            key={pt.post.id}
            title={pt.post.title}
            slug={pt.post.slug}
            excerpt={pt.post.excerpt}
            publishedAt={pt.post.publishedAt}
            tags={mapPostTags(pt.post.tags)}
          />
        ))}
      </div>
    </div>
  );
}

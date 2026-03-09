import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/blog/post-card";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
  if (!tag) return {};
  return { title: `${tag.name} 태그` };
}

export default async function TagPage({ params }: Props) {
  const { tag: tagSlug } = await params;

  const tag = await prisma.tag.findUnique({
    where: { slug: tagSlug },
    include: {
      posts: {
        where: { post: { status: "published" } },
        include: {
          post: {
            include: { tags: { include: { tag: true } } },
          },
        },
        orderBy: { post: { publishedAt: "desc" } },
      },
    },
  });

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
        {tag.posts.map((pt) => (
          <PostCard
            key={pt.post.id}
            title={pt.post.title}
            slug={pt.post.slug}
            excerpt={pt.post.excerpt}
            publishedAt={pt.post.publishedAt}
            tags={pt.post.tags.map((t) => ({
              name: t.tag.name,
              slug: t.tag.slug,
            }))}
          />
        ))}
      </div>
    </div>
  );
}

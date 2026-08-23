import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { publicPostWhere } from "@/lib/post-visibility";
import { getSeriesBySlug } from "@/lib/queries";
import { PostCard } from "@/components/blog/post-card";
import { mapPostTags } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

// 공개 글이 있는 시리즈는 프리렌더해 프리페치가 동작하게 합니다.
export async function generateStaticParams() {
  const series = await prisma.series.findMany({
    where: { posts: { some: publicPostWhere() } },
    select: { slug: true },
  });

  if (series.length === 0) return [{ slug: "__no-series__" }];

  return series.map((s: { slug: string }) => ({ slug: s.slug }));
}

// 없는 시리즈에 대해 notFound() 가 진짜 404 를 내려면 셸을 먼저 흘려보내면 안 됩니다.
// (blog/[slug] 와 같은 이유)
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return {};
  return {
    title: `${series.title} 시리즈`,
    description: series.description ?? undefined,
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/series" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← 시리즈 목록
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{series.title}</h1>
        {series.description && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {series.description}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          {series.posts.length}개의 글
        </p>
      </div>

      <div className="space-y-6">
        {series.posts.map((post: { id: string; title: string; slug: string; excerpt: string | null; publishedAt: Date | null; tags: { tag: { name: string; slug: string } }[] }, index: number) => (
          <div key={post.id} className="flex gap-4">
            <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {index + 1}
            </span>
            <div className="flex-1">
              <PostCard
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                publishedAt={post.publishedAt}
                tags={mapPostTags(post.tags)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

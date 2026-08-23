import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { publicPostWhere } from "@/lib/post-visibility";
import { POSTS_TAG } from "@/lib/queries";
import { formatDate, readingTime } from "@/lib/utils";
import { BASE_URL } from "@/lib/config";
import { CommentList } from "@/components/comments/comment-list";
import { SeriesNav } from "@/components/blog/series-nav";
import { ArticleBody } from "@/components/blog/article-body";
import { TocSection } from "@/components/blog/toc-section";
import { PostLikeButton } from "@/components/blog/post-like-button";
import { ViewCount } from "@/components/blog/view-count";
import { CopyCodeButton } from "@/components/blog/copy-code-button";
import { RelatedPosts } from "@/components/blog/related-posts";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ReadingProgress } from "@/components/ui/reading-progress";
import {
  ArticleBodySkeleton,
  CommentsSkeleton,
  LikeButtonSkeleton,
} from "@/components/ui/skeleton";

interface Props {
  params: Promise<{ slug: string }>;
}

// "use cache" 스코프 안에서는 publicPostWhere() 의 new Date() 가 허용됩니다
// (결과에 수명이 붙으므로). 같은 요청 안의 generateMetadata / 페이지 렌더에서도 공유됩니다.
// 예약 글은 최대 캐시 수명만큼 뒤에 공개되고, 글 수정/삭제 시에는
// actions/posts.ts 의 revalidatePath 로 즉시 갱신됩니다.
async function getPost(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(POSTS_TAG);
  cacheTag(`post-${slug}`);

  return prisma.post.findFirst({
    where: { slug, ...publicPostWhere() },
    include: {
      tags: { include: { tag: true } },
      series: {
        include: {
          posts: {
            where: publicPostWhere(),
            orderBy: { publishedAt: "asc" },
            select: { id: true, title: true, slug: true },
          },
        },
      },
    },
  });
}

// 공개된 글은 전부 빌드 시점에 프리렌더합니다.
// 그래야 목록에서 링크된 모든 글이 정적 셸을 갖고 <Link> 프리페치가 동작합니다.
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: publicPostWhere(),
    select: { slug: true },
    orderBy: { publishedAt: "desc" },
  });

  // Cache Components 는 빈 배열을 허용하지 않습니다(빌드 검증 대상이 없어지므로).
  // 글이 아직 하나도 없는 DB 에서도 빌드가 되도록 존재하지 않는 slug 하나를 넘깁니다.
  // 이 경로는 notFound() 로 404 가 되며 sitemap 에도 노출되지 않습니다.
  if (posts.length === 0) return [{ slug: "__no-posts__" }];

  return posts.map((post: { slug: string }) => ({ slug: post.slug }));
}

// params 를 Suspense 안으로 내려 셸을 만드는 대신, 이 라우트는 블로킹을 허용합니다.
// 셸을 먼저 200 으로 흘려보내면 없는 글의 notFound() 가 상태 코드를 바꿀 수 없어
// soft-404 가 되기 때문입니다. 위 목록에 있는 글은 이미 프리렌더되므로 즉시 뜨고,
// 목록에 없는(삭제되었거나 존재하지 않는) slug 만 요청 시점에 막고 진짜 404 를 냅니다.
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      images: [
        `${BASE_URL}/api/og?title=${encodeURIComponent(post.title)}`,
      ],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  // Awaited before anything streams, so notFound() can still set a 404 status.
  const post = await getPost(slug);

  if (!post) notFound();

  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  const tagIds = post.tags.map((pt: { tagId: string }) => pt.tagId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url: postUrl,
    image: `${BASE_URL}/api/og?title=${encodeURIComponent(post.title)}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />
      <CopyCodeButton />
    <div className="relative flex gap-12">
      <article className="min-w-0 flex-1">
        <header className="space-y-4 border-b border-gray-200 pb-6 dark:border-gray-800">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {post.publishedAt && (
              <time>{formatDate(post.publishedAt)}</time>
            )}
            <span>{readingTime(post.content)} 읽기</span>
            <Suspense fallback={<span>&nbsp;</span>}>
              <ViewCount slug={slug} />
            </Suspense>
          </div>
          <div className="flex items-center justify-between">
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((pt: { tag: { name: string; slug: string } }) => (
                  <Link
                    key={pt.tag.slug}
                    href={`/tags/${pt.tag.slug}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                  >
                    {pt.tag.name}
                  </Link>
                ))}
              </div>
            )}
            <ShareButtons title={post.title} url={postUrl} />
          </div>
        </header>

        {post.series && (
          <div className="mt-8">
            <SeriesNav
              seriesTitle={post.series.title}
              seriesSlug={post.series.slug}
              posts={post.series.posts}
              currentPostId={post.id}
            />
          </div>
        )}

        <div className="mt-8">
          <Suspense fallback={<ArticleBodySkeleton />}>
            <ArticleBody content={post.content} />
          </Suspense>
        </div>

        <div className="my-10 flex justify-center">
          <Suspense fallback={<LikeButtonSkeleton />}>
            <PostLikeButton postId={post.id} postSlug={post.slug} />
          </Suspense>
        </div>

        <hr className="my-12 border-gray-200 dark:border-gray-800" />

        <Suspense fallback={null}>
          <RelatedPosts postId={post.id} tagIds={tagIds} />
        </Suspense>

        <hr className="my-12 border-gray-200 dark:border-gray-800" />

        <Suspense fallback={<CommentsSkeleton />}>
          <CommentList postId={post.id} postSlug={post.slug} />
        </Suspense>
      </article>

      <Suspense fallback={null}>
        <TocSection content={post.content} />
      </Suspense>
    </div>
    </>
  );
}

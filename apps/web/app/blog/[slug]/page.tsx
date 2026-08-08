import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { extractHeadings } from "@/lib/markdown";
import { formatDate, readingTime } from "@/lib/utils";
import { BASE_URL } from "@/lib/config";
import { Toc } from "@/components/blog/toc";
import { CommentList } from "@/components/comments/comment-list";
import { SeriesNav } from "@/components/blog/series-nav";
import { ArticleBody } from "@/components/blog/article-body";
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

// Deduped across generateMetadata and the page render within a single request.
const getPost = cache(async (slug: string) =>
  prisma.post.findUnique({
    where: { slug, status: "published" },
    include: {
      tags: { include: { tag: true } },
      series: {
        include: {
          posts: {
            where: { status: "published" },
            orderBy: { publishedAt: "asc" },
            select: { id: true, title: true, slug: true },
          },
        },
      },
    },
  })
);

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

  const headings = extractHeadings(post.content);
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

      <Toc headings={headings} />
    </div>
    </>
  );
}

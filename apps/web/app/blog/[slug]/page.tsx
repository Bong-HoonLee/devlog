import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { renderMarkdown, extractHeadings } from "@/lib/markdown";
import { formatDate, readingTime, mapPostTags } from "@/lib/utils";
import { BASE_URL } from "@/lib/config";
import { incrementViewCount } from "@/lib/view-count";
import { Toc } from "@/components/blog/toc";
import { CommentList } from "@/components/comments/comment-list";
import { SeriesNav } from "@/components/blog/series-nav";
import { LikeButton } from "@/components/blog/like-button";
import { CopyCodeButton } from "@/components/blog/copy-code-button";
import { RelatedPosts } from "@/components/blog/related-posts";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ReadingProgress } from "@/components/ui/reading-progress";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, status: "published" },
    select: { title: true, excerpt: true },
  });

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

  const post = await prisma.post.findUnique({
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
  });

  if (!post) notFound();

  const session = await auth();
  const [html, headings, likeCount, userLike, viewCount] = await Promise.all([
    renderMarkdown(post.content),
    Promise.resolve(extractHeadings(post.content)),
    prisma.like.count({ where: { postId: post.id } }),
    session
      ? prisma.like.findUnique({
          where: { postId_userId: { postId: post.id, userId: session.user.id } },
        })
      : null,
    incrementViewCount(slug),
  ]);

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
            <span>{viewCount} views</span>
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

        <div
          className="prose prose-gray mt-8 max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:bg-transparent prose-pre:p-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="my-10 flex justify-center">
          <LikeButton
            postId={post.id}
            postSlug={post.slug}
            likeCount={likeCount}
            isLiked={!!userLike}
          />
        </div>

        <hr className="my-12 border-gray-200 dark:border-gray-800" />

        <RelatedPosts postId={post.id} tagIds={tagIds} />

        <hr className="my-12 border-gray-200 dark:border-gray-800" />

        <CommentList postId={post.id} postSlug={post.slug} />
      </article>

      <Toc headings={headings} />
    </div>
    </>
  );
}

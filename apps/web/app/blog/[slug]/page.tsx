import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { renderMarkdown, extractHeadings } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { Toc } from "@/components/blog/toc";
import { CommentList } from "@/components/comments/comment-list";

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
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: "published" },
    include: { tags: { include: { tag: true } } },
  });

  if (!post) notFound();

  const [html, headings] = await Promise.all([
    renderMarkdown(post.content),
    Promise.resolve(extractHeadings(post.content)),
  ]);

  return (
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
            <span>{post.viewCount} views</span>
          </div>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((pt) => (
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
        </header>

        <div
          className="prose prose-gray mt-8 max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:bg-transparent prose-pre:p-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <hr className="my-12 border-gray-200 dark:border-gray-800" />

        <CommentList postId={post.id} />
      </article>

      <Toc headings={headings} />
    </div>
  );
}

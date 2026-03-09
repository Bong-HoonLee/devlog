import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

interface RelatedPostsProps {
  postId: string;
  tagIds: string[];
}

export async function RelatedPosts({ postId, tagIds }: RelatedPostsProps) {
  if (tagIds.length === 0) return null;

  const related = await prisma.post.findMany({
    where: {
      id: { not: postId },
      status: "published",
      tags: { some: { tagId: { in: tagIds } } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
    },
  });

  if (related.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">관련 글</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {related.map((post: { title: string; slug: string; excerpt: string | null; publishedAt: Date | null }) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 dark:border-gray-800 dark:hover:border-blue-700"
          >
            <p className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {post.title}
            </p>
            {post.excerpt && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {post.excerpt}
              </p>
            )}
            {post.publishedAt && (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {formatDate(post.publishedAt)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

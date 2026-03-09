import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface PostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  tags: { name: string; slug: string }[];
}

export function PostCard({
  title,
  slug,
  excerpt,
  publishedAt,
  tags,
}: PostCardProps) {
  return (
    <article className="group space-y-3 border-b border-gray-200 pb-6 dark:border-gray-800">
      <div className="space-y-1">
        {publishedAt && (
          <time className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(publishedAt)}
          </time>
        )}
        <h2 className="text-xl font-semibold">
          <Link
            href={`/blog/${slug}`}
            className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            {title}
          </Link>
        </h2>
      </div>
      {excerpt && (
        <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
          {excerpt}
        </p>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: { name: string; slug: string }) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

import Link from "next/link";

interface SeriesNavProps {
  seriesTitle: string;
  seriesSlug: string;
  posts: { id: string; title: string; slug: string }[];
  currentPostId: string;
}

export function SeriesNav({ seriesTitle, seriesSlug, posts, currentPostId }: SeriesNavProps) {
  const currentIndex = posts.findIndex((p: { id: string }) => p.id === currentPostId);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-950/30">
      <Link
        href={`/series/${seriesSlug}`}
        className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
      >
        {seriesTitle} 시리즈
      </Link>
      <ol className="mt-3 space-y-1">
        {posts.map((post: { id: string; title: string; slug: string }, index: number) => (
          <li key={post.id} className="text-sm">
            {post.id === currentPostId ? (
              <span className="font-medium text-blue-700 dark:text-blue-300">
                {index + 1}. {post.title}
              </span>
            ) : (
              <Link
                href={`/blog/${post.slug}`}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                {index + 1}. {post.title}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {/* Prev/Next navigation */}
      <div className="mt-4 flex items-center justify-between border-t border-blue-200 pt-3 dark:border-blue-800">
        {currentIndex > 0 ? (
          <Link
            href={`/blog/${posts[currentIndex - 1].slug}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← 이전: {posts[currentIndex - 1].title}
          </Link>
        ) : (
          <span />
        )}
        {currentIndex < posts.length - 1 ? (
          <Link
            href={`/blog/${posts[currentIndex + 1].slug}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            다음: {posts[currentIndex + 1].title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

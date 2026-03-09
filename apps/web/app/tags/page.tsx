import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Tags",
  description: "태그 목록",
};

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: { where: { post: { status: "published" } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const filteredTags = tags.filter((tag: { id: string; name: string; slug: string; _count: { posts: number } }) => tag._count.posts > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tags</h1>

      {filteredTags.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          아직 태그가 없습니다.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {filteredTags.map((tag: { id: string; name: string; slug: string; _count: { posts: number } }) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
            >
              {tag.name}
              <span className="ml-2 text-gray-400 dark:text-gray-500">
                {tag._count.posts}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

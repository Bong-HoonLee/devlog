import Link from "next/link";
import { getPosts, deletePost } from "@/actions/posts";
import { formatDate } from "@/lib/utils";

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">글 관리</h2>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          새 글 작성
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          작성된 글이 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="space-y-1">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="font-medium hover:underline"
                >
                  {post.title}
                </Link>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span
                    className={
                      post.status === "published"
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }
                  >
                    {post.status === "published" ? "발행됨" : "임시저장"}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                  {post.tags.length > 0 && (
                    <span>
                      {post.tags.map((pt) => pt.tag.name).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deletePost(post.id);
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  삭제
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

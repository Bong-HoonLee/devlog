import { auth } from "@/lib/auth";
import { getComments } from "@/actions/comments";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

interface CommentListProps {
  postId: string;
}

export async function CommentList({ postId }: CommentListProps) {
  const [session, comments] = await Promise.all([
    auth(),
    getComments(postId),
  ]);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h2>

      {session ? (
        <CommentForm postId={postId} />
      ) : (
        <p className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          댓글을 작성하려면 로그인하세요.
        </p>
      )}

      {comments.length > 0 && (
        <div className="space-y-6">
          {comments.map((comment: { id: string; content: string; createdAt: Date; user: { id: string; name: string; image: string | null }; replies: { id: string; content: string; createdAt: Date; user: { id: string; name: string; image: string | null } }[] }) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={session?.user.id}
              currentUserRole={session?.user.role}
            />
          ))}
        </div>
      )}
    </section>
  );
}

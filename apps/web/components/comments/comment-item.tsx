"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { deleteComment, updateComment } from "@/actions/comments";
import { CommentForm } from "./comment-form";
import { Reactions } from "./reactions";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
}

interface ReactionData {
  emoji: string;
  userId: string;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  user: CommentUser;
  reactions?: ReactionData[];
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  postId: string;
  postSlug: string;
  currentUserId?: string;
  currentUserRole?: string;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  postSlug,
  currentUserId,
  currentUserRole,
  isReply = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const canDelete =
    currentUserId === comment.user.id || currentUserRole === "admin";
  const canEdit = currentUserId === comment.user.id;

  function handleStartEdit() {
    const temp = document.createElement("div");
    temp.innerHTML = comment.content;
    setEditContent(temp.textContent ?? "");
    setIsEditing(true);
  }

  function handleSaveEdit() {
    if (!editContent.trim()) return;
    startTransition(async () => {
      await updateComment(comment.id, editContent);
      setIsEditing(false);
    });
  }

  return (
    <div className={isReply ? "ml-8 border-l-2 border-gray-200 pl-4 dark:border-gray-700" : ""}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {comment.user.image && (
            <Image
              src={comment.user.image}
              alt={comment.user.name}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full"
            />
          )}
          <span className="text-sm font-medium">{comment.user.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(comment.createdAt)}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        )}

        {comment.reactions && !isEditing && (
          <Reactions
            commentId={comment.id}
            postSlug={postSlug}
            reactions={comment.reactions}
            currentUserId={currentUserId}
          />
        )}

        {!isEditing && (
          <div className="flex items-center gap-3">
            {!isReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                답글
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleStartEdit}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                수정
              </button>
            )}
            {canDelete && (
              <form
                action={async () => {
                  await deleteComment(comment.id);
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  삭제
                </button>
              </form>
            )}
          </div>
        )}

        {showReplyForm && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply: CommentData) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              postSlug={postSlug}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { deleteComment } from "@/actions/comments";
import { CommentForm } from "./comment-form";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  user: CommentUser;
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  postId: string;
  currentUserId?: string;
  currentUserRole?: string;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserRole,
  isReply = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const canDelete =
    currentUserId === comment.user.id || currentUserRole === "admin";

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

        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {comment.content}
        </p>

        <div className="flex items-center gap-3">
          {!isReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              답글
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
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
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

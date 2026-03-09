"use client";

import { useRef, useTransition } from "react";
import { createComment } from "@/actions/comments";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCancel?: () => void;
}

export function CommentForm({ postId, parentId, onCancel }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    startTransition(async () => {
      await createComment(postId, content, parentId);
      formRef.current?.reset();
      onCancel?.();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <textarea
        name="content"
        required
        rows={parentId ? 3 : 4}
        placeholder={parentId ? "답글을 작성하세요..." : "댓글을 작성하세요..."}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "작성 중..." : parentId ? "답글 작성" : "댓글 작성"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

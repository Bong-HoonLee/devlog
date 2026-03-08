"use client";

import { useActionState } from "react";

interface PostEditorProps {
  action: (prevState: string | null, formData: FormData) => Promise<string | null>;
  initialData?: {
    title: string;
    content: string;
    excerpt: string;
    tags: string;
    status: string;
  };
}

export function PostEditor({ action, initialData }: PostEditorProps) {
  const [error, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialData?.title}
          placeholder="글 제목을 입력하세요"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="excerpt" className="text-sm font-medium">
          요약 (선택)
        </label>
        <input
          id="excerpt"
          name="excerpt"
          type="text"
          defaultValue={initialData?.excerpt}
          placeholder="글 요약을 입력하세요"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          내용 (마크다운)
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={20}
          defaultValue={initialData?.content}
          placeholder="마크다운으로 글을 작성하세요..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className="text-sm font-medium">
          태그 (쉼표 구분)
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          defaultValue={initialData?.tags}
          placeholder="React, Next.js, TypeScript"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="flex items-center gap-4">
        <select
          name="status"
          defaultValue={initialData?.status ?? "draft"}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="draft">임시저장</option>
          <option value="published">발행</option>
        </select>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

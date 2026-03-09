"use client";

import { useActionState, useState, useRef, useCallback, useEffect } from "react";
import { TiptapEditor } from "./tiptap-editor";
import { autoSavePost } from "@/actions/posts";
import { AUTO_SAVE_DEBOUNCE_MS } from "@/lib/config";

interface SeriesOption {
  id: string;
  title: string;
}

interface PostEditorProps {
  action: (prevState: string | null, formData: FormData) => Promise<string | null>;
  initialData?: {
    title: string;
    content: string;
    excerpt: string;
    tags: string;
    status: string;
    scheduledAt?: string;
    seriesId?: string;
  };
  postId?: string;
  seriesList?: SeriesOption[];
}

export function PostEditor({ action, initialData, postId, seriesList = [] }: PostEditorProps) {
  const [error, formAction, isPending] = useActionState(action, null);
  const [status, setStatus] = useState(initialData?.status ?? "draft");
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleAutoSave = useCallback(() => {
    if (!postId || !formRef.current) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      const fd = new FormData(formRef.current!);
      try {
        await autoSavePost(postId, {
          title: fd.get("title") as string,
          content: fd.get("content") as string,
          excerpt: fd.get("excerpt") as string,
          tags: fd.get("tags") as string,
        });
        setAutoSaveStatus("자동 저장됨");
        setTimeout(() => setAutoSaveStatus(""), 3000);
      } catch {
        setAutoSaveStatus("자동 저장 실패");
      }
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, [postId]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  return (
    <form ref={formRef} action={formAction} className="space-y-6" onChange={handleAutoSave}>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {autoSaveStatus && (
        <p className="text-xs text-green-600 dark:text-green-400">{autoSaveStatus}</p>
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
        <label className="text-sm font-medium">내용</label>
        <TiptapEditor initialContent={initialData?.content} />
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

      {seriesList.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="seriesId" className="text-sm font-medium">
            시리즈 (선택)
          </label>
          <select
            id="seriesId"
            name="seriesId"
            defaultValue={initialData?.seriesId ?? ""}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">시리즈 없음</option>
            {seriesList.map((s: SeriesOption) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="draft">임시저장</option>
          <option value="published">발행</option>
          <option value="scheduled">예약 발행</option>
        </select>

        {status === "scheduled" && (
          <input
            name="scheduledAt"
            type="datetime-local"
            defaultValue={initialData?.scheduledAt}
            required
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        )}

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

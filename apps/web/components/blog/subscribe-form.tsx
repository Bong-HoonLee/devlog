"use client";

import { useActionState } from "react";
import { subscribe } from "@/actions/subscribe";

export function SubscribeForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: string } | null, formData: FormData) => {
      return subscribe(formData);
    },
    null
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-lg font-semibold">새 글 알림 받기</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        새로운 글이 발행되면 이메일로 알려드립니다.
      </p>

      <form action={formAction} className="mt-4 flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="이메일 주소"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "..." : "구독"}
        </button>
      </form>

      {state?.error && (
        <p className="mt-2 text-sm text-red-500">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">{state.success}</p>
      )}
    </div>
  );
}

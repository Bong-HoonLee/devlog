"use client";

import { useTransition, useOptimistic } from "react";
import { toggleLike } from "@/actions/likes";

interface LikeButtonProps {
  postId: string;
  postSlug: string;
  likeCount: number;
  isLiked: boolean;
}

export function LikeButton({ postId, postSlug, likeCount, isLiked }: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { count: likeCount, liked: isLiked },
    (state) => ({
      count: state.liked ? state.count - 1 : state.count + 1,
      liked: !state.liked,
    })
  );

  function handleClick() {
    startTransition(async () => {
      setOptimistic(optimistic);
      await toggleLike(postId, postSlug);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        optimistic.liked
          ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
          : "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-red-800 dark:hover:text-red-400"
      }`}
    >
      <span className="text-base">{optimistic.liked ? "❤️" : "🤍"}</span>
      <span>{optimistic.count}</span>
    </button>
  );
}

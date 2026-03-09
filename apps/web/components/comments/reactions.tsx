"use client";

import { useTransition } from "react";
import { toggleReaction } from "@/actions/reactions";
import { EMOJI_OPTIONS } from "@/lib/config";

interface ReactionGroup {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface ReactionsProps {
  commentId: string;
  postSlug: string;
  reactions: { emoji: string; userId: string }[];
  currentUserId?: string;
}

export function Reactions({ commentId, postSlug, reactions, currentUserId }: ReactionsProps) {
  const [isPending, startTransition] = useTransition();

  // Group reactions by emoji
  const groups: ReactionGroup[] = EMOJI_OPTIONS.map((emoji: string) => {
    const matching = reactions.filter((r: { emoji: string }) => r.emoji === emoji);
    return {
      emoji,
      count: matching.length,
      reacted: currentUserId
        ? matching.some((r: { userId: string }) => r.userId === currentUserId)
        : false,
    };
  }).filter((g: ReactionGroup) => g.count > 0);

  function handleReaction(emoji: string) {
    if (!currentUserId) return;
    startTransition(async () => {
      await toggleReaction(commentId, emoji, postSlug);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {groups.map((g: ReactionGroup) => (
        <button
          key={g.emoji}
          onClick={() => handleReaction(g.emoji)}
          disabled={isPending || !currentUserId}
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            g.reacted
              ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          }`}
        >
          <span>{g.emoji}</span>
          <span className="font-medium">{g.count}</span>
        </button>
      ))}

      {/* Add reaction picker */}
      {currentUserId && (
        <ReactionPicker
          onSelect={handleReaction}
          disabled={isPending}
          existingEmojis={groups.map((g: ReactionGroup) => g.emoji)}
        />
      )}
    </div>
  );
}

function ReactionPicker({
  onSelect,
  disabled,
  existingEmojis,
}: {
  onSelect: (emoji: string) => void;
  disabled: boolean;
  existingEmojis: string[];
}) {
  const available = EMOJI_OPTIONS.filter((e: string) => !existingEmojis.includes(e));
  if (available.length === 0) return null;

  return (
    <div className="group relative">
      <button
        disabled={disabled}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:text-gray-300 transition-colors"
      >
        +
      </button>
      <div className="absolute bottom-full left-0 mb-1 hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg group-hover:flex dark:border-gray-700 dark:bg-gray-800">
        {EMOJI_OPTIONS.map((emoji: string) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            disabled={disabled}
            className="rounded p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { searchPosts } from "@/actions/search";

interface SearchResult {
  title: string;
  slug: string;
  excerpt: string | null;
}

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchPosts(value);
        setResults(data);
      });
    }, 300);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="mx-auto mt-[20vh] max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <Command.Input
            value={query}
            onValueChange={handleSearch}
            placeholder="글 검색..."
            className="w-full border-b border-gray-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-gray-700"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {isPending && (
              <Command.Loading>
                <p className="px-4 py-2 text-sm text-gray-500">검색 중...</p>
              </Command.Loading>
            )}
            <Command.Empty className="px-4 py-8 text-center text-sm text-gray-500">
              검색 결과가 없습니다.
            </Command.Empty>
            {results.map((post) => (
              <Command.Item
                key={post.slug}
                value={post.title}
                onSelect={() => {
                  router.push(`/blog/${post.slug}`);
                  setOpen(false);
                  setQuery("");
                }}
                className="cursor-pointer rounded-lg px-4 py-3 text-sm aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
              >
                <p className="font-medium">{post.title}</p>
                {post.excerpt && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                    {post.excerpt}
                  </p>
                )}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

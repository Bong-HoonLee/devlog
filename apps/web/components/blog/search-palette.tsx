"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import { searchPosts } from "@/actions/search";
import { SEARCH_DEBOUNCE_MS, NAV_PAGES, THEME_OPTIONS } from "@/lib/config";

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
  const { setTheme, theme } = useTheme();
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
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  function navigate(path: string) {
    router.push(path);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  if (!open) return null;

  const showSearch = query.trim().length > 0;

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
            placeholder="검색 또는 명령어 입력..."
            className="w-full border-b border-gray-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-gray-700"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {isPending && (
              <Command.Loading>
                <p className="px-4 py-2 text-sm text-gray-500">검색 중...</p>
              </Command.Loading>
            )}

            {showSearch && (
              <Command.Group heading="검색 결과">
                {results.length === 0 && !isPending && (
                  <p className="px-4 py-4 text-center text-sm text-gray-500">
                    검색 결과가 없습니다.
                  </p>
                )}
                {results.map((post: SearchResult) => (
                  <Command.Item
                    key={post.slug}
                    value={post.title}
                    onSelect={() => navigate(`/blog/${post.slug}`)}
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
              </Command.Group>
            )}

            {!showSearch && (
              <>
                <Command.Group heading="페이지 이동">
                  {NAV_PAGES.map((page) => (
                    <Command.Item
                      key={page.path}
                      value={`${page.name} ${page.path}`}
                      onSelect={() => navigate(page.path)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                    >
                      <span>{page.icon}</span>
                      <span>{page.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{page.path}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="테마">
                  {THEME_OPTIONS.map((opt) => (
                    <Command.Item
                      key={opt.value}
                      value={`${opt.label} ${opt.value}`}
                      onSelect={() => { setTheme(opt.value); setOpen(false); }}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                      {theme === opt.value && <span className="ml-auto text-xs text-blue-500">현재</span>}
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            )}
          </Command.List>

          <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span><kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">↑↓</kbd> 이동</span>
              <span><kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">↵</kbd> 선택</span>
              <span><kbd className="rounded border border-gray-300 px-1 dark:border-gray-600">esc</kbd> 닫기</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

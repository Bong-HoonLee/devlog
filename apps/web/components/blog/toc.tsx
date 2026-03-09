"use client";

import { useEffect, useRef, useState } from "react";

interface TocProps {
  headings: { id: string; text: string; level: number }[];
}

export function Toc({ headings }: TocProps) {
  const [activeId, setActiveId] = useState("");
  const indicatorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    if (!activeId || !listRef.current || !indicatorRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-id="${CSS.escape(activeId)}"]`);
    if (!activeEl) return;
    const listRect = listRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    indicatorRef.current.style.top = `${activeRect.top - listRect.top}px`;
    indicatorRef.current.style.height = `${activeRect.height}px`;
    indicatorRef.current.style.opacity = "1";
  }, [activeId]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block">
      <div className="sticky top-24 space-y-2">
        <p className="text-sm font-semibold">목차</p>
        <div className="relative">
          <div
            ref={indicatorRef}
            className="absolute left-0 w-0.5 rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-200"
            style={{ opacity: 0 }}
          />
          <ul ref={listRef} className="space-y-1 border-l border-gray-200 pl-3 text-sm dark:border-gray-700">
            {headings.map((heading: { id: string; text: string; level: number }) => (
              <li
                key={heading.id}
                data-id={heading.id}
                style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
              >
                <a
                  href={`#${heading.id}`}
                  className={`block py-1 transition-colors duration-200 ${
                    activeId === heading.id
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : "text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100"
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

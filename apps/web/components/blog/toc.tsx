"use client";

import { useEffect, useState } from "react";

interface TocProps {
  headings: { id: string; text: string; level: number }[];
}

export function Toc({ headings }: TocProps) {
  const [activeId, setActiveId] = useState("");

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

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block">
      <div className="sticky top-24 space-y-2">
        <p className="text-sm font-semibold">목차</p>
        <ul className="space-y-1 text-sm">
          {headings.map((heading: { id: string; text: string; level: number }) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              <a
                href={`#${heading.id}`}
                className={`block py-1 transition-colors ${
                  activeId === heading.id
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      setProgress(Math.min((window.scrollY / docHeight) * 100, 100));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 z-50 h-0.5 w-full bg-transparent">
      <div
        className="h-full bg-blue-600 transition-[width] duration-150 dark:bg-blue-400"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

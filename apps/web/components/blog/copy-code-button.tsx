"use client";

import { useEffect } from "react";

export function CopyCodeButton() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest("[data-copy-code]");
      if (!btn) return;

      const pre = btn.closest("pre");
      const code = pre?.querySelector("code");
      if (!code) return;

      navigator.clipboard.writeText(code.textContent ?? "").then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 2000);
      });
    }

    function addButtons() {
      document.querySelectorAll("article pre").forEach((pre) => {
        if (pre.querySelector("[data-copy-code]")) return;
        pre.classList.add("relative", "group");
        const btn = document.createElement("button");
        btn.setAttribute("data-copy-code", "true");
        btn.textContent = "Copy";
        btn.className =
          "absolute right-2 top-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-600 hover:text-white";
        pre.appendChild(btn);
      });
    }

    addButtons();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

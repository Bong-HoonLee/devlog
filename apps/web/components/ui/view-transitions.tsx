"use client";

import { useEffect } from "react";

export function ViewTransitions() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.style.viewTransitionName = "main-content";
    }
  }, []);

  return null;
}

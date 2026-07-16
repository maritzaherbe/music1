"use client";

import { useEffect, useState } from "react";

// Respects the OS-level "reduce motion" accessibility setting so JS-driven
// effects (confetti, canvas, imperative scrollIntoView) can disable/soften
// themselves. Tailwind's motion-safe:/motion-reduce: variants already handle
// pure-CSS animations; this hook is for the rest.
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

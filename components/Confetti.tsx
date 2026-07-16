"use client";

// Lightweight, dependency-free celebratory confetti burst for the "song is
// ready" moment. Runs once on mount for ~3s then clears itself. Skips
// entirely under prefers-reduced-motion.

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const COLORS = ["#a78bfa", "#f472b6", "#facc15", "#60a5fa", "#34d399"];
const DURATION_MS = 3200;

interface Piece {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  color: string;
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let alive = true;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.scale(dpr, dpr);

    const pieces: Piece[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.5,
      w: 6 + Math.random() * 5,
      h: 8 + Math.random() * 6,
      vx: -1.5 + Math.random() * 3,
      vy: 2 + Math.random() * 2.5,
      rot: Math.random() * Math.PI,
      vr: -0.15 + Math.random() * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const start = performance.now();

    const tick = (now: number) => {
      if (!alive) return;
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      const fadeStart = DURATION_MS - 600;
      const fade = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / 600) : 1;

      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < DURATION_MS) {
        rafId = requestAnimationFrame(tick);
      } else {
        alive = false;
        ctx.clearRect(0, 0, width, height);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50" />;
}

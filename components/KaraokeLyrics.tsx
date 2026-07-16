"use client";

// Karaoke-style lyrics: fetches word-level timing for a track, then
// highlights the current word as the paired <audio> element plays, and lets
// the listener click any word to seek there.

import { useEffect, useRef, useState } from "react";
import { useTimestampedLyrics } from "@/hooks/useTimestampedLyrics";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { LyricsWord } from "@/lib/types";

export default function KaraokeLyrics({
  taskId,
  audioId,
  fallbackLyrics,
  audioRef,
}: {
  taskId: string;
  audioId: string;
  fallbackLyrics: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
}) {
  const { status, words } = useTimestampedLyrics(taskId, audioId, Boolean(taskId && audioId));
  const [activeIdx, setActiveIdx] = useState(-1);
  const wordRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || words.length === 0) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      let idx = -1;
      for (let i = 0; i < words.length; i++) {
        if (t >= words[i].startS && t <= words[i].endS) {
          idx = i;
          break;
        }
        if (t < words[i].startS) break;
      }
      setActiveIdx((prev) => (prev === idx ? prev : idx));
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [audioRef, words]);

  useEffect(() => {
    if (activeIdx < 0) return;
    wordRefs.current[activeIdx]?.scrollIntoView({
      block: "center",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [activeIdx, reducedMotion]);

  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    if (audio.paused) audio.play().catch(() => {});
  };

  if (status === "ready" && words.length > 0) {
    return (
      <div
        className="max-h-72 overflow-y-auto rounded-2xl border border-slate-900/[0.06] bg-white/60 p-4 [mask-image:linear-gradient(to_bottom,transparent,black_6%,black_94%,transparent)]"
        aria-label="Synced lyrics"
      >
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 text-sm leading-relaxed">
          {words.map((w, i) => (
            <WordToken
              key={i}
              word={w}
              index={i}
              isNewSection={Boolean(w.section) && (i === 0 || words[i - 1].section !== w.section)}
              isActive={i === activeIdx}
              isPast={i < activeIdx}
              onClick={() => seekTo(w.startS)}
              refCallback={(el) => {
                wordRefs.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <div className="rounded-2xl border border-slate-900/[0.06] bg-white/60 p-4" role="status" aria-live="polite">
        <span className="sr-only">Loading synced lyrics…</span>
        <div className="space-y-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-3 animate-pulse rounded-full bg-slate-200"
              style={{ width: `${72 - i * 14}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // status === "unavailable" — fall back to plain lyrics text if we have it.
  if (fallbackLyrics) {
    return (
      <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-900/[0.06] bg-white/60 p-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600">
          {fallbackLyrics}
        </pre>
      </div>
    );
  }

  // No lyrics at all (likely instrumental) — let the cover art carry the moment.
  return null;
}

function WordToken({
  word,
  isNewSection,
  isActive,
  isPast,
  onClick,
  refCallback,
}: {
  word: LyricsWord;
  index: number;
  isNewSection: boolean;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
  refCallback: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <span className="contents">
      {isNewSection && (
        <span className="mb-1 mt-3 basis-full text-[10px] font-bold uppercase tracking-widest text-fuchsia-500/70">
          {word.section}
        </span>
      )}
      <button
        ref={refCallback}
        type="button"
        onClick={onClick}
        aria-current={isActive ? "true" : undefined}
        className={
          "rounded px-0.5 transition-all duration-150 " +
          (isActive
            ? "scale-110 font-bold text-fuchsia-600 [text-shadow:0_0_16px_rgba(236,72,153,0.55)]"
            : isPast
            ? "text-slate-400 hover:text-slate-600"
            : "text-slate-600 hover:text-slate-900")
        }
      >
        {word.text}
      </button>
    </span>
  );
}

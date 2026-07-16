"use client";

import { useEffect, useState } from "react";
import type { LyricsWord } from "@/lib/types";

export type LyricsStatus = "idle" | "loading" | "ready" | "unavailable";

interface LyricsState {
  status: LyricsStatus;
  words: LyricsWord[];
}

// Timestamped/aligned lyrics usually aren't ready the instant a track's audio
// is — retry a few times with backoff before giving up and letting the
// caller fall back to plain lyrics.
const RETRY_DELAYS_MS = [0, 2500, 5000, 9000];

export function useTimestampedLyrics(
  taskId: string,
  audioId: string,
  enabled: boolean
): LyricsState {
  const [state, setState] = useState<LyricsState>({ status: "idle", words: [] });

  useEffect(() => {
    if (!enabled || !taskId || !audioId) return;
    let cancelled = false;
    setState({ status: "loading", words: [] });

    (async () => {
      for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
        if (RETRY_DELAYS_MS[i] > 0) await sleep(RETRY_DELAYS_MS[i]);
        if (cancelled) return;
        try {
          const res = await fetch(
            `/api/lyrics?taskId=${encodeURIComponent(taskId)}&audioId=${encodeURIComponent(audioId)}`,
            { cache: "no-store" }
          );
          const body = await res.json().catch(() => null);
          if (cancelled) return;
          const words: LyricsWord[] = Array.isArray(body?.data?.words) ? body.data.words : [];
          if (words.length > 0) {
            setState({ status: "ready", words });
            return;
          }
          // No hard error, just not aligned yet (or instrumental) — keep retrying.
        } catch {
          // transient network hiccup — keep retrying
        }
      }
      if (!cancelled) setState({ status: "unavailable", words: [] });
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId, audioId, enabled]);

  return state;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

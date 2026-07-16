"use client";

// The keepsake: cover art, player, karaoke lyrics, and download/share
// actions for a single generated track.

import { useMemo, useRef, useState } from "react";
import type { Track } from "@/lib/types";
import KaraokeLyrics from "@/components/KaraokeLyrics";

export default function SongCard({
  track,
  index,
  taskId,
  instrumental,
  recipient,
}: {
  track: Track;
  index: number;
  taskId: string;
  instrumental: boolean;
  recipient: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [copied, setCopied] = useState(false);
  const src = track.audioUrl || track.streamUrl || "";
  const title = track.title || `Version ${index + 1}`;

  const shareText = useMemo(() => {
    const who = recipient ? ` for ${recipient}` : "";
    return `I made a song${who} called "${title}" on Own Song 🎵`;
  }, [title, recipient]);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : undefined;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch {
        // user cancelled, or Web Share unsupported for this payload — fall back to copy
      }
    }
    try {
      const payload = track.lyrics ? `${shareText}\n\n${track.lyrics}` : shareText;
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently no-op rather than show a scary error
    }
  };

  const handleDownloadLyrics = () => {
    if (!track.lyrics) return;
    const blob = new Blob([track.lyrics], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OwnSong-${slugify(title)}-lyrics.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadHref = track.audioUrl
    ? `/api/download?url=${encodeURIComponent(track.audioUrl)}&name=${encodeURIComponent(`OwnSong-${slugify(title)}`)}`
    : null;

  return (
    <div className="group animate-scale-in overflow-hidden rounded-3xl border border-slate-900/[0.06] bg-white/70 p-4 shadow-[0_16px_44px_-22px_rgba(150,60,130,0.35)] backdrop-blur-sm transition-colors duration-300 hover:border-fuchsia-200 sm:p-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          {track.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.imageUrl}
              alt={`Cover art for ${title}`}
              className="h-40 w-40 rounded-2xl object-cover shadow-xl shadow-pink-300/40 ring-1 ring-slate-900/10 transition-transform duration-500 group-hover:scale-[1.02] sm:h-32 sm:w-32"
            />
          ) : (
            <div
              className="grid h-40 w-40 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-300 to-orange-200 text-4xl shadow-xl shadow-pink-300/40 ring-1 ring-slate-900/10 sm:h-32 sm:w-32"
              aria-hidden="true"
            >
              🎵
            </div>
          )}
          <span className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
            v{index + 1}
          </span>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="truncate text-lg font-bold text-slate-900">{title}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {track.tags || "your original song"}
            {track.durationSec ? ` · ${Math.round(track.durationSec)}s` : ""}
          </p>

          {src ? (
            <audio ref={audioRef} controls preload="none" className="mt-3 w-full" src={src}>
              Your browser doesn&apos;t support audio playback.
            </audio>
          ) : (
            <p className="mt-3 text-xs text-slate-400">Finalizing this track…</p>
          )}
        </div>
      </div>

      {!instrumental && (
        <div className="mt-4">
          <KaraokeLyrics taskId={taskId} audioId={track.id} fallbackLyrics={track.lyrics} audioRef={audioRef} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {downloadHref && (
          <a
            href={downloadHref}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-150 hover:border-fuchsia-300 hover:bg-white active:scale-95"
          >
            ⬇ Download song
          </a>
        )}
        {track.lyrics && (
          <button
            type="button"
            onClick={handleDownloadLyrics}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-150 hover:border-fuchsia-300 hover:bg-white active:scale-95"
          >
            ⬇ Download lyrics
          </button>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-150 hover:border-fuchsia-300 hover:bg-white active:scale-95"
        >
          {copied ? "✓ Copied!" : "↗ Share"}
        </button>
      </div>
    </div>
  );
}

function slugify(s: string): string {
  return (
    (s || "song")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "song"
  );
}

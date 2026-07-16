"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GenerationResult, SongBrief, Track, Vibe } from "@/lib/types";

type Phase = "wizard" | "generating" | "ready" | "error";

const OCCASIONS = [
  { label: "Birthday", value: "a birthday" },
  { label: "Anniversary", value: "an anniversary" },
  { label: "Wedding", value: "a wedding" },
  { label: "New baby", value: "a new baby" },
  { label: "Thank you", value: "a thank you" },
  { label: "Just because", value: "no special reason at all" },
];

const VIBES: { label: string; value: Vibe; emoji: string }[] = [
  { label: "Heartfelt", value: "heartfelt", emoji: "💛" },
  { label: "Joyful", value: "joyful", emoji: "🎉" },
  { label: "Epic", value: "epic", emoji: "🚀" },
  { label: "Chill", value: "chill", emoji: "🌊" },
  { label: "Funny", value: "funny", emoji: "😄" },
  { label: "Nostalgic", value: "nostalgic", emoji: "📼" },
];

const GENRES = [
  "Acoustic folk",
  "Pop",
  "Hip-hop",
  "R&B / soul",
  "Rock",
  "Country",
  "Lo-fi",
  "Cinematic",
];

const PROGRESS_MESSAGES = [
  "Reading your story…",
  "Finding the right melody…",
  "Writing the lyrics…",
  "Laying down the vocals…",
  "Mixing it all together…",
  "Adding the final polish…",
];

const POLL_INTERVAL_MS = 6000;
const MAX_WAIT_MS = 5 * 60 * 1000;

export default function Creator() {
  const [phase, setPhase] = useState<Phase>("wizard");

  // Brief state
  const [occasion, setOccasion] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [story, setStory] = useState("");
  const [vibe, setVibe] = useState<Vibe>("heartfelt");
  const [genre, setGenre] = useState<string>("Acoustic folk");
  const [instrumental, setInstrumental] = useState(false);

  // Generation state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string>("");
  const [progressIdx, setProgressIdx] = useState(0);
  const pollingRef = useRef(false);

  const canGenerate = occasion.trim().length > 0 && recipientName.trim().length > 0;

  // Rotating progress copy while generating.
  useEffect(() => {
    if (phase !== "generating") return;
    const id = setInterval(
      () => setProgressIdx((i) => (i + 1) % PROGRESS_MESSAGES.length),
      4000
    );
    return () => clearInterval(id);
  }, [phase]);

  // Clean up polling on unmount.
  useEffect(() => () => void (pollingRef.current = false), []);

  const pollStatus = useCallback(async (taskId: string) => {
    const startedAt = Date.now();
    pollingRef.current = true;

    while (pollingRef.current) {
      if (Date.now() - startedAt > MAX_WAIT_MS) {
        setError("This is taking longer than expected. Please try again.");
        setPhase("error");
        return;
      }
      try {
        const res = await fetch(`/api/status?taskId=${encodeURIComponent(taskId)}`, {
          cache: "no-store",
        });
        const body = await res.json();
        if (body?.error) {
          setError(body.error.message);
          setPhase("error");
          return;
        }
        const result: GenerationResult = body.data;
        if (result.status === "ready" && result.tracks.length > 0) {
          setTracks(result.tracks);
          setPhase("ready");
          return;
        }
        if (result.status === "failed") {
          setError(result.error || "Generation failed. Please try again.");
          setPhase("error");
          return;
        }
      } catch {
        // transient network hiccup — keep polling
      }
      await sleep(POLL_INTERVAL_MS);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    setError("");
    setTracks([]);
    setProgressIdx(0);
    setPhase("generating");

    const brief: SongBrief = {
      occasion: occasion.trim(),
      recipientName: recipientName.trim(),
      relationship: relationship.trim(),
      story: story.trim(),
      vibe,
      genre,
      instrumental,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      const body = await res.json();
      if (body?.error) {
        setError(body.error.message);
        setPhase("error");
        return;
      }
      const taskId: string = body.data.taskId;
      pollStatus(taskId);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPhase("error");
    }
  }, [occasion, recipientName, relationship, story, vibe, genre, instrumental, pollStatus]);

  const reset = useCallback(() => {
    pollingRef.current = false;
    setPhase("wizard");
    setTracks([]);
    setError("");
  }, []);

  if (phase === "generating") {
    return <GeneratingView message={PROGRESS_MESSAGES[progressIdx]} recipient={recipientName} />;
  }

  if (phase === "ready") {
    return <ResultView tracks={tracks} recipient={recipientName} onReset={reset} />;
  }

  if (phase === "error") {
    return <ErrorView message={error} onRetry={reset} />;
  }

  // Wizard
  return (
    <div className="animate-fade-in space-y-6">
      <Card>
        <Label>What&apos;s the occasion?</Label>
        <ChipRow>
          {OCCASIONS.map((o) => (
            <Chip key={o.value} active={occasion === o.value} onClick={() => setOccasion(o.value)}>
              {o.label}
            </Chip>
          ))}
        </ChipRow>
        <input
          className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400/50"
          placeholder="…or type it (e.g. “a 60th birthday”)"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          aria-label="Occasion"
        />
      </Card>

      <Card>
        <Label>Who&apos;s it for?</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400/50"
            placeholder="Their name (e.g. “Mom”)"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            aria-label="Recipient name"
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400/50"
            placeholder="Who they are to you (optional)"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            aria-label="Relationship"
          />
        </div>
      </Card>

      <Card>
        <Label>Tell us one little story about them</Label>
        <textarea
          className="min-h-[90px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-violet-400/50"
          placeholder="A favorite memory, an inside joke, something they love…"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          aria-label="Story"
        />
      </Card>

      <Card>
        <Label>Pick a vibe</Label>
        <ChipRow>
          {VIBES.map((v) => (
            <Chip key={v.value} active={vibe === v.value} onClick={() => setVibe(v.value)}>
              <span className="mr-1">{v.emoji}</span>
              {v.label}
            </Chip>
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Label>Choose a sound</Label>
        <ChipRow>
          {GENRES.map((g) => (
            <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>
              {g}
            </Chip>
          ))}
        </ChipRow>
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            className="h-4 w-4 accent-violet-500"
            checked={instrumental}
            onChange={(e) => setInstrumental(e.target.checked)}
          />
          Instrumental only (no vocals)
        </label>
      </Card>

      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {canGenerate ? "✨ Create my song" : "Add the occasion & who it's for"}
      </button>
      <p className="text-center text-xs text-white/40">
        Takes about a minute. You&apos;ll get two versions to choose from.
      </p>
    </div>
  );
}

/* ---------- sub-views ---------- */

function GeneratingView({ message, recipient }: { message: string; recipient: string }) {
  return (
    <div className="animate-fade-in rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
      <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-violet-400" />
      <h2 className="text-xl font-semibold">
        Composing {recipient ? `${recipient}'s` : "your"} song…
      </h2>
      <p className="mt-2 text-sm text-white/60 transition-all">{message}</p>
      <p className="mt-6 text-xs text-white/30">
        Hang tight — great songs take about a minute. Don&apos;t close this page.
      </p>
    </div>
  );
}

function ResultView({
  tracks,
  recipient,
  onReset,
}: {
  tracks: Track[];
  recipient: string;
  onReset: () => void;
}) {
  return (
    <div className="animate-fade-in space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold">🎉 It&apos;s ready!</h2>
        <p className="mt-1 text-sm text-white/60">
          Here {tracks.length > 1 ? "are two versions" : "it is"}
          {recipient ? ` for ${recipient}` : ""}. Pick your favorite.
        </p>
      </div>

      {tracks.map((t, i) => (
        <TrackCard key={t.id} track={t} index={i} />
      ))}

      <button
        onClick={onReset}
        className="w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
      >
        ← Make another song
      </button>
    </div>
  );
}

function TrackCard({ track, index }: { track: Track; index: number }) {
  const src = track.audioUrl || track.streamUrl || "";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-4">
        {track.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.imageUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500/40 to-pink-500/40 text-2xl">
            🎵
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {track.title || `Version ${index + 1}`}
          </p>
          <p className="truncate text-xs text-white/50">
            {track.tags || "your original song"}
            {track.durationSec ? ` · ${Math.round(track.durationSec)}s` : ""}
          </p>
        </div>
      </div>
      {src ? (
        <audio controls preload="none" className="mt-3 w-full" src={src}>
          Your browser doesn&apos;t support audio playback.
        </audio>
      ) : (
        <p className="mt-3 text-xs text-white/40">Finalizing this track…</p>
      )}
      {track.audioUrl && (
        <a
          href={track.audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-medium text-violet-300 hover:text-violet-200"
        >
          ↓ Download MP3
        </a>
      )}
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="animate-fade-in rounded-3xl border border-red-400/20 bg-red-500/5 p-8 text-center">
      <div className="mb-3 text-3xl">😕</div>
      <h2 className="text-lg font-semibold">Something went sideways</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15"
      >
        Try again
      </button>
    </div>
  );
}

/* ---------- primitives ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold text-white/90">{children}</h3>;
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full border px-3.5 py-1.5 text-sm transition " +
        (active
          ? "border-violet-400 bg-violet-500/20 text-white"
          : "border-white/15 bg-transparent text-white/70 hover:border-white/30")
      }
    >
      {children}
    </button>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

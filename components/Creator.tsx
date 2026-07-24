"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GenerationResult, SongBrief, Track, Vibe } from "@/lib/types";
import SongCard from "@/components/SongCard";
import Equalizer from "@/components/Equalizer";
import Confetti from "@/components/Confetti";

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
  const [vibe, setVibe] = useState<string>("heartfelt");
  const [genre, setGenre] = useState<string>("Acoustic folk");
  const [instrumental, setInstrumental] = useState(false);

  // Generation state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taskId, setTaskId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [progressIdx, setProgressIdx] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const pollingRef = useRef(false);

  const canGenerate = occasion.trim().length > 0 && recipientName.trim().length > 0;

  // A vibe/sound is "custom" when it doesn't match any preset — so the preset
  // chips deselect and the free-text field shows what the user typed.
  const isCustomVibe = vibe.length > 0 && !VIBES.some((v) => v.value === vibe);
  const isCustomGenre = genre.length > 0 && !GENRES.includes(genre);

  // Celebratory flourish exactly once when a song first becomes ready.
  useEffect(() => {
    if (phase !== "ready") return;
    setShowConfetti(true);
    const id = window.setTimeout(() => setShowConfetti(false), 3400);
    return () => window.clearTimeout(id);
  }, [phase]);

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
    let reachedReady = false; // have we shown the song yet (stream ready)?

    while (pollingRef.current) {
      if (Date.now() - startedAt > MAX_WAIT_MS) {
        // If the song is already playing, just stop polling; only error if we
        // never got anything.
        if (!reachedReady) {
          setError("This is taking longer than expected. Please try again.");
          setPhase("error");
        }
        return;
      }
      try {
        const res = await fetch(`/api/status?taskId=${encodeURIComponent(taskId)}`, {
          cache: "no-store",
        });
        const body = await res.json();
        if (body?.error) {
          if (!reachedReady) {
            setError(body.error.message);
            setPhase("error");
          }
          return;
        }
        const result: GenerationResult = body.data;
        if (result.status === "failed") {
          if (!reachedReady) {
            setError(result.error || "Generation failed. Please try again.");
            setPhase("error");
          }
          return;
        }
        if (result.status === "ready" && result.tracks.length > 0) {
          setTracks(result.tracks);
          if (!reachedReady) {
            setPhase("ready");
            reachedReady = true;
          }
          // Keep polling in the background: the downloadable MP3 (audioUrl),
          // duration, and karaoke alignment only land ~1-2 min after the
          // stream is playable. Stop once every track has its final audio.
          if (result.tracks.every((t) => t.audioUrl)) return;
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
    setTaskId("");
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
      const newTaskId: string = body.data.taskId;
      setTaskId(newTaskId);
      pollStatus(newTaskId);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPhase("error");
    }
  }, [occasion, recipientName, relationship, story, vibe, genre, instrumental, pollStatus]);

  const reset = useCallback(() => {
    pollingRef.current = false;
    setPhase("wizard");
    setTracks([]);
    setTaskId("");
    setError("");
  }, []);

  if (phase === "generating") {
    return (
      <GeneratingView
        message={PROGRESS_MESSAGES[progressIdx]}
        recipient={recipientName}
        progressIdx={progressIdx}
      />
    );
  }

  if (phase === "ready") {
    return (
      <>
        {showConfetti && <Confetti />}
        <ResultView
          tracks={tracks}
          recipient={recipientName}
          taskId={taskId}
          instrumental={instrumental}
          onReset={reset}
        />
      </>
    );
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
          className={INPUT_CLASS + " mt-3"}
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
            className={INPUT_CLASS}
            placeholder="Their name (e.g. “Mom”)"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            aria-label="Recipient name"
          />
          <input
            className={INPUT_CLASS}
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
          className={INPUT_CLASS + " min-h-[90px] resize-none"}
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
        <input
          className={INPUT_CLASS + " mt-3"}
          placeholder="…or describe your own vibe (e.g. “dreamy and cinematic”)"
          value={isCustomVibe ? vibe : ""}
          onChange={(e) => setVibe(e.target.value)}
          aria-label="Your own vibe"
        />
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
        <input
          className={INPUT_CLASS + " mt-3"}
          placeholder="…or type your own sound (e.g. “dreamy synthwave”)"
          value={isCustomGenre ? genre : ""}
          onChange={(e) => setGenre(e.target.value)}
          aria-label="Your own sound"
        />
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 accent-fuchsia-500"
            checked={instrumental}
            onChange={(e) => setInstrumental(e.target.checked)}
          />
          Instrumental only (no vocals)
        </label>
      </Card>

      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 px-6 py-4 text-base font-bold text-white shadow-lg shadow-pink-500/30 transition-all duration-200 enabled:hover:brightness-105 enabled:hover:shadow-xl enabled:hover:shadow-pink-500/40 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {canGenerate ? "✨ Create my song" : "Add the occasion & who it's for"}
      </button>
      <p className="text-center text-xs text-slate-400">
        Takes about a minute. You&apos;ll get two versions to choose from.
      </p>
    </div>
  );
}

/* ---------- sub-views ---------- */

function GeneratingView({
  message,
  recipient,
  progressIdx,
}: {
  message: string;
  recipient: string;
  progressIdx: number;
}) {
  return (
    <div
      className="animate-scale-in rounded-3xl border border-slate-900/[0.06] bg-white/70 p-8 text-center shadow-[0_20px_50px_-24px_rgba(190,60,140,0.35)] backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Equalizer />
      <h2 className="mt-2 text-xl font-bold text-slate-900">
        Composing {recipient ? `${recipient}'s` : "your"} song…
      </h2>
      <p key={message} className="mt-2 min-h-[1.25rem] animate-fade-in text-sm text-slate-500">
        {message}
      </p>

      <div className="mx-auto mt-6 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-fuchsia-500 to-orange-400 motion-safe:animate-progress-slide" />
      </div>

      <ol className="mx-auto mt-6 max-w-xs space-y-1.5 text-left" aria-hidden="true">
        {PROGRESS_MESSAGES.map((m, i) => (
          <li
            key={m}
            className={
              "flex items-center gap-2 text-xs transition-colors duration-300 " +
              (i < progressIdx ? "text-slate-400" : i === progressIdx ? "text-slate-800" : "text-slate-300")
            }
          >
            <span
              className={
                "inline-block h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 " +
                (i <= progressIdx ? "bg-fuchsia-500" : "bg-slate-300")
              }
            />
            {m}
          </li>
        ))}
      </ol>

      <p className="mt-6 text-xs text-slate-400">
        Hang tight — great songs take about a minute. Don&apos;t close this page.
      </p>
    </div>
  );
}

function ResultView({
  tracks,
  recipient,
  taskId,
  instrumental,
  onReset,
}: {
  tracks: Track[];
  recipient: string;
  taskId: string;
  instrumental: boolean;
  onReset: () => void;
}) {
  return (
    <div className="animate-fade-in space-y-5">
      <div className="animate-scale-in text-center">
        <h2 className="text-2xl font-extrabold text-slate-900">🎉 It&apos;s ready!</h2>
        <p className="mt-1 text-sm text-slate-500">
          Here {tracks.length > 1 ? "are two versions" : "it is"}
          {recipient ? ` for ${recipient}` : ""}. Pick your favorite.
        </p>
      </div>

      {tracks.map((t, i) => (
        <SongCard
          key={t.id}
          track={t}
          index={i}
          taskId={taskId}
          instrumental={instrumental}
          recipient={recipient}
        />
      ))}

      <button
        onClick={onReset}
        className="w-full rounded-2xl border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-600 transition-all duration-150 hover:border-fuchsia-300 hover:bg-white active:scale-[0.98]"
      >
        ← Make another song
      </button>
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="animate-scale-in rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-[0_20px_50px_-24px_rgba(220,80,80,0.35)]">
      <div className="mb-3 text-3xl">😕</div>
      <h2 className="text-lg font-bold text-slate-900">Something went sideways</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-xl bg-red-100 px-5 py-2.5 text-sm font-semibold text-red-700 transition-all duration-150 hover:bg-red-200 active:scale-95"
      >
        Try again
      </button>
    </div>
  );
}

/* ---------- primitives ---------- */

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-fuchsia-400";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-900/[0.06] bg-white/70 p-5 shadow-[0_12px_36px_-20px_rgba(150,60,130,0.28)] backdrop-blur-sm transition-colors duration-300 focus-within:border-fuchsia-300 hover:border-fuchsia-200">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-bold text-slate-800">{children}</h3>;
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
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 active:scale-90 " +
        (active
          ? "scale-[1.03] border-transparent bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md shadow-pink-500/30"
          : "border-slate-300 bg-white/70 text-slate-600 hover:border-fuchsia-300 hover:bg-white")
      }
    >
      {children}
    </button>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Suno provider adapter (sunoapi.org reseller).
//
// ARCHITECTURE NOTE: all provider-specific detail lives behind this thin
// interface. Swapping to Suno's official partner API later means writing a new
// adapter with the same shape — the API routes and UI never change.
//
// This module is SERVER-ONLY. It reads SUNO_API_KEY from the environment and
// must never be imported into a client component.

import type { GenerationResult, LyricsResult, LyricsWord, Track } from "@/lib/types";

const BASE_URL = process.env.SUNO_BASE_URL || "https://api.sunoapi.org/api/v1";
const MODEL = process.env.SUNO_MODEL || "V4_5";

function apiKey(): string {
  const key = process.env.SUNO_API_KEY;
  if (!key) {
    throw new Error(
      "SUNO_API_KEY is not set. Add it to .env.local locally, and to Netlify env vars for deploys."
    );
  }
  return key;
}

export interface SubmitOptions {
  prompt: string;
  instrumental: boolean;
  callBackUrl: string; // required by the API; we still poll for status
}

/** Submit a generation. Returns the provider task id. */
export async function submitGeneration(opts: SubmitOptions): Promise<string> {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Non-custom mode: simplest, most reliable path (docs' first-timer rec).
      // The prompt is the creative idea; lyrics are auto-generated.
      customMode: false,
      instrumental: opts.instrumental,
      model: MODEL,
      prompt: opts.prompt,
      callBackUrl: opts.callBackUrl,
    }),
    // Never cache generation submissions.
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.code !== 200) {
    throw new Error(providerErrorMessage(json?.code, json?.msg, res.status));
  }
  const taskId = json?.data?.taskId;
  if (!taskId) throw new Error("Provider did not return a task id.");
  return taskId;
}

/** Poll a generation's status and normalize it for the UI. */
export async function getStatus(taskId: string): Promise<GenerationResult> {
  const res = await fetch(
    `${BASE_URL}/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
    {
      headers: { Authorization: `Bearer ${apiKey()}` },
      cache: "no-store",
    }
  );

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.code !== 200) {
    return { status: "failed", tracks: [], error: providerErrorMessage(json?.code, json?.msg, res.status) };
  }

  const data = json.data ?? {};
  const rawStatus: string = data.status ?? "PENDING";

  // Provider returns tracks under response.sunoData (record-info) — accept a
  // couple of shapes defensively across doc versions.
  const rawTracks: any[] =
    data?.response?.sunoData ?? data?.response?.data ?? [];
  const tracks: Track[] = rawTracks.map(normalizeTrack).filter((t) => t.streamUrl || t.audioUrl);

  if (isFailure(rawStatus)) {
    return { status: "failed", tracks, error: friendlyFailure(rawStatus, data.errorMessage) };
  }

  // SUCCESS = all done. FIRST_SUCCESS = at least one playable track — show it early.
  if (rawStatus === "SUCCESS" || tracks.length > 0) {
    return { status: "ready", tracks };
  }

  return { status: "generating", tracks: [] };
}

function normalizeTrack(t: any): Track {
  return {
    id: String(t.id ?? t.audioId ?? cryptoRandom()),
    title: t.title ?? "Untitled",
    audioUrl: t.audioUrl ?? t.audio_url ?? null,
    streamUrl: t.streamAudioUrl ?? t.stream_audio_url ?? t.audioUrl ?? t.audio_url ?? null,
    imageUrl: t.imageUrl ?? t.image_url ?? null,
    durationSec: typeof t.duration === "number" ? t.duration : null,
    tags: t.tags ?? null,
    // Non-custom mode returns the generated lyrics back in `prompt`. Used as
    // a fallback when timestamped (karaoke) lyrics aren't available yet.
    lyrics: typeof t.prompt === "string" && t.prompt.trim() ? t.prompt.trim() : null,
  };
}

/**
 * Fetch word-level timing for a finished track's lyrics (powers karaoke-style
 * sync in the UI). Instrumental tracks or tracks whose alignment isn't ready
 * yet will simply return an empty `words` array — callers should retry with
 * backoff and fall back to plain lyrics rather than treat that as an error.
 */
export async function getTimestampedLyrics(taskId: string, audioId: string): Promise<LyricsResult> {
  const res = await fetch(`${BASE_URL}/generate/get-timestamped-lyrics`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskId, audioId }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.code !== 200) {
    throw new Error(providerErrorMessage(json?.code, json?.msg, res.status));
  }

  const data = json.data ?? {};
  const rawWords: any[] = Array.isArray(data.alignedWords) ? data.alignedWords : [];
  const waveform: number[] = Array.isArray(data.waveformData) ? data.waveformData : [];

  const words: LyricsWord[] = [];
  let pendingSection: string | undefined;
  for (const aw of rawWords) {
    if (aw?.success === false) continue; // alignment failed for this token — skip rather than mis-highlight
    const { section, text } = parseAlignedWord(String(aw?.word ?? ""));
    if (section) pendingSection = section;
    if (!text) continue; // a pure section marker with no word — carry the section to the next real word
    const startS = typeof aw?.startS === "number" ? aw.startS : null;
    const endS = typeof aw?.endS === "number" ? aw.endS : null;
    if (startS === null || endS === null) continue;
    words.push({ text, startS, endS, section: pendingSection });
    pendingSection = undefined;
  }

  return { words, waveform };
}

// A raw aligned-word token may embed a section tag like "[Verse]\nWaggin'" —
// split that into the section label and the clean, displayable word text.
function parseAlignedWord(raw: string): { section?: string; text: string } {
  let text = raw;
  let section: string | undefined;
  const sectionMatch = text.match(/^\s*\[([^\]]+)\]\s*\n?/);
  if (sectionMatch) {
    section = sectionMatch[1].trim();
    text = text.slice(sectionMatch[0].length);
  }
  text = text.replace(/\n+/g, " ").trim();
  return { section, text };
}

function isFailure(status: string): boolean {
  return (
    status === "CREATE_TASK_FAILED" ||
    status === "GENERATE_AUDIO_FAILED" ||
    status === "CALLBACK_EXCEPTION" ||
    status === "SENSITIVE_WORD_ERROR" ||
    status === "FAILED"
  );
}

function friendlyFailure(status: string, msg?: string): string {
  if (status === "SENSITIVE_WORD_ERROR") {
    return "That request tripped the content filter. Try rephrasing your story or occasion.";
  }
  return msg || "Generation failed. Please try again.";
}

function providerErrorMessage(code?: number, msg?: string, httpStatus?: number): string {
  switch (code) {
    case 401:
      return "The API key was rejected (401). Check SUNO_API_KEY.";
    case 413:
      return "Your description is too long. Shorten it and try again.";
    case 429:
      return "The account is out of credits (429). Top up on sunoapi.org.";
    case 430:
      return "Too many requests right now (430). Wait a moment and retry.";
    case 455:
      return "The music service is under maintenance (455). Try again later.";
    default:
      return msg || `Music service error (HTTP ${httpStatus ?? "?"}).`;
  }
}

function cryptoRandom(): string {
  return Math.random().toString(36).slice(2);
}

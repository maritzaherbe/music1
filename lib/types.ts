// Shared types for the creation flow. Kept framework-agnostic.

export type Vibe =
  | "heartfelt"
  | "joyful"
  | "epic"
  | "chill"
  | "funny"
  | "nostalgic";

export interface SongBrief {
  occasion: string; // e.g. "a 60th birthday"
  recipientName: string; // e.g. "Mom"
  relationship: string; // e.g. "my mother"
  story: string; // one detail / memory
  vibe: Vibe;
  genre: string; // friendly preset label, e.g. "Acoustic folk"
  instrumental: boolean; // false = with vocals
}

// Normalized generation status the UI understands (provider-agnostic).
export type GenerationStatus = "pending" | "generating" | "ready" | "failed";

export interface Track {
  id: string;
  title: string;
  audioUrl: string | null; // final downloadable mp3 (ready in ~2-3 min)
  streamUrl: string | null; // stream url (ready in ~30-40s)
  imageUrl: string | null; // cover art
  durationSec: number | null;
  tags: string | null;
}

export interface GenerationResult {
  status: GenerationStatus;
  tracks: Track[];
  error?: string;
}

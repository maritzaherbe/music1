// Turns the guided wizard answers into a single, effective Suno prompt.
// This is the "hide the prompt-engineering" layer — the user never writes a
// prompt; they answer warm human questions and we compose this server-side.

import type { SongBrief, Vibe } from "@/lib/types";

const VIBE_WORDS: Record<Vibe, string> = {
  heartfelt: "warm, heartfelt, emotional and sincere",
  joyful: "upbeat, joyful, celebratory and bright",
  epic: "cinematic, soaring, powerful and anthemic",
  chill: "relaxed, mellow, gentle and easygoing",
  funny: "playful, cheeky, light-hearted and fun",
  nostalgic: "nostalgic, tender, bittersweet and reflective",
};

// Non-custom mode caps the prompt at 500 characters — keep well under.
const MAX_LEN = 480;

export function composePrompt(brief: SongBrief): string {
  // Known preset → rich descriptor; custom free text → use as-is; empty → default.
  const vibe = VIBE_WORDS[brief.vibe as Vibe] ?? (brief.vibe.trim() || "warm and heartfelt");
  const genre = brief.genre.trim() || "pop";
  const who = brief.recipientName?.trim() || "someone special";
  const rel = brief.relationship?.trim();
  const relClause = rel ? ` (${rel})` : "";
  const story = brief.story?.trim();

  const parts: string[] = [];
  parts.push(`A ${genre} song for ${who}${relClause} to celebrate ${brief.occasion}.`);
  parts.push(`Mood: ${vibe}.`);
  if (story) parts.push(`It should reference this: ${story}.`);
  parts.push(
    brief.instrumental
      ? "Instrumental only, no vocals."
      : "Singable, with heartfelt vocals and a memorable chorus."
  );

  let prompt = parts.join(" ").replace(/\s+/g, " ").trim();
  if (prompt.length > MAX_LEN) prompt = prompt.slice(0, MAX_LEN - 1).trimEnd() + "…";
  return prompt;
}

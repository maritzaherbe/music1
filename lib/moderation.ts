// Minimal pre-generation input check. MVP-level, not a full moderation system —
// it exists to honor the project's legal red line: no impersonating a real
// artist's voice/identity ("sing like <celebrity>"). Full moderation is a
// backend concern for later; this catches the obvious cases before we spend.

const IMPERSONATION_PATTERNS: RegExp[] = [
  /\bsing(s|ing)?\s+like\b/i,
  /\b(in\s+the\s+)?voice\s+of\b/i,
  /\bsound(s|ing)?\s+(exactly\s+)?like\b/i,
  /\bimitat(e|ing|ion)\b/i,
  /\bclone\b/i,
  /\bimpersonat/i,
  /\bdeepfake\b/i,
];

export interface ModerationResult {
  ok: boolean;
  message?: string;
}

export function screenBrief(text: string): ModerationResult {
  const t = text || "";
  for (const re of IMPERSONATION_PATTERNS) {
    if (re.test(t)) {
      return {
        ok: false,
        message:
          "This app makes YOUR original song — it can't imitate a real artist's voice. Try describing the mood or genre instead (e.g. \"upbeat pop\").",
      };
    }
  }
  return { ok: true };
}

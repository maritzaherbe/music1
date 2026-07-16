// POST /api/generate
// Server-side proxy: composes the prompt, screens input, calls Suno with the
// secret key, returns a task id. The key NEVER reaches the browser.

import { NextRequest, NextResponse } from "next/server";
import { submitGeneration } from "@/lib/providers/suno";
import { composePrompt } from "@/lib/prompt";
import { screenBrief } from "@/lib/moderation";
import type { SongBrief } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let brief: SongBrief;
  try {
    brief = (await req.json()) as SongBrief;
  } catch {
    return NextResponse.json({ error: { code: "bad_request", message: "Invalid JSON body." } }, { status: 400 });
  }

  // Basic validation.
  if (!brief?.occasion || !brief?.recipientName) {
    return NextResponse.json(
      { error: { code: "missing_fields", message: "Please tell us the occasion and who it's for." } },
      { status: 400 }
    );
  }

  // Input safety: no real-artist impersonation (legal red line).
  const screen = screenBrief([brief.occasion, brief.relationship, brief.story, brief.genre].filter(Boolean).join(" "));
  if (!screen.ok) {
    return NextResponse.json({ error: { code: "moderation_blocked", message: screen.message } }, { status: 422 });
  }

  const prompt = composePrompt(brief);

  // callBackUrl is required by the API. We poll for status, so this only needs
  // to be a valid, reachable-enough URL — point it at our own no-op callback.
  const origin = req.nextUrl.origin;
  const callBackUrl = `${origin}/api/callback`;

  try {
    const taskId = await submitGeneration({
      prompt,
      instrumental: Boolean(brief.instrumental),
      callBackUrl,
    });
    return NextResponse.json({ data: { taskId, prompt } });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "provider_error", message: err?.message || "Could not start generation." } },
      { status: 502 }
    );
  }
}

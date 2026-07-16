// GET /api/lyrics?taskId=...&audioId=...
// Server-side proxy for the provider's timestamped-lyrics endpoint. Returns
// normalized { words, waveform } for the karaoke-style UI. Instrumental
// tracks / not-yet-aligned tracks come back with an empty `words` array
// rather than an error — the client retries with backoff and falls back to
// plain lyrics.

import { NextRequest, NextResponse } from "next/server";
import { getTimestampedLyrics } from "@/lib/providers/suno";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  const audioId = req.nextUrl.searchParams.get("audioId");
  if (!taskId || !audioId) {
    return NextResponse.json(
      { error: { code: "missing_params", message: "taskId and audioId are required." } },
      { status: 400 }
    );
  }

  try {
    const result = await getTimestampedLyrics(taskId, audioId);
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "provider_error", message: err?.message || "Could not fetch lyrics." } },
      { status: 502 }
    );
  }
}

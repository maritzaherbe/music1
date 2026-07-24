// GET /api/download?url=...&name=...
// Streams a provider-hosted audio file back with a Content-Disposition
// header so the browser saves it with a nice filename, instead of relying on
// a cross-origin <a download> (which most browsers won't force). Only
// proxies URLs on a small allowlist of Suno/provider hosts to avoid this
// becoming an open proxy.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort allowlist of hosts the Suno reseller (and its CDNs) are known
// to serve generated audio from. Extend if the provider adds/changes a host.
const ALLOWED_HOST_SUFFIXES = [
  "sunoapi.org",
  "suno.ai",
  "aiquickdraw.com", // downloadable mp3s (tempfile.aiquickdraw.com) — verified live
  "removeai.ai", // stream + cover art (musicfile.removeai.ai) — verified live
  "erweima.ai",
];

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const name = req.nextUrl.searchParams.get("name") || "OwnSong";

  if (!url) {
    return NextResponse.json({ error: { code: "missing_url", message: "url is required." } }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: { code: "bad_url", message: "That's not a valid audio URL." } }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !isAllowedHost(parsed.hostname)) {
    return NextResponse.json(
      { error: { code: "host_not_allowed", message: "That audio host isn't allowed." } },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), { cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: { code: "fetch_failed", message: "Couldn't reach the song file. Try again in a moment." } },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: { code: "fetch_failed", message: "Couldn't download the song file. Try again in a moment." } },
      { status: 502 }
    );
  }

  const ext = parsed.pathname.toLowerCase().endsWith(".wav") ? "wav" : "mp3";
  const filename = `${sanitizeFilename(name)}.${ext}`;
  const contentLength = upstream.headers.get("content-length");

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || `audio/${ext === "wav" ? "wav" : "mpeg"}`,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      ...(contentLength ? { "Content-Length": contentLength } : {}),
    },
  });
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 80);
  return cleaned || "OwnSong";
}

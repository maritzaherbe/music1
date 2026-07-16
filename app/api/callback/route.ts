// POST /api/callback
// The Suno API requires a callBackUrl. This MVP polls for status instead of
// relying on the webhook, so this endpoint just acknowledges receipt (200).
// A future version with a database would persist the result here.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ status: "received" });
}

// Allow a GET for basic health checks.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

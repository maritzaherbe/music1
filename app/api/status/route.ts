// GET /api/status?taskId=...
// Server-side proxy for polling generation status. Returns normalized JSON.

import { NextRequest, NextResponse } from "next/server";
import { getStatus } from "@/lib/providers/suno";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json(
      { error: { code: "missing_task_id", message: "taskId is required." } },
      { status: 400 }
    );
  }

  try {
    const result = await getStatus(taskId);
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "provider_error", message: err?.message || "Could not fetch status." } },
      { status: 502 }
    );
  }
}

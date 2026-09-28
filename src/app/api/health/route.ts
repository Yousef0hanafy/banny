import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Ops health endpoint (Release C monitoring placeholder). Reports process
 * liveness + database round-trip WITHOUT exposing any infrastructure detail
 * (no hosts, no counts, no timing beyond a coarse ms figure). Monitoring
 * systems (uptime checkers, Neon integration health, future Sentry on-call)
 * can poll this as the single canonical probe.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "ok",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Deliberately opaque: a failing database is reported as such, with no
    // reason details (those live in server logs only).
    return NextResponse.json(
      {
        status: "degraded",
        database: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}

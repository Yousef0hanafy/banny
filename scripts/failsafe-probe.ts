#!/usr/bin/env bun
/**
 * failsafe-probe.ts <missing|sqlite|unreachable>
 *
 * Verifies src/lib/db.ts FAILS LOUDLY on bad runtime database configuration.
 * bun auto-loads the project .env at boot (before user code), so this probe
 * first EXPLICITLY normalizes process.env to the case being tested, and only
 * then dynamically imports the DB client. The guard reads process.env at
 * first client use, so this simulates each case exactly.
 *
 * Output is sentinel-safe: "[bunny-library]" messages contain variable NAMES
 * only (never values); foreign (Prisma/PG) error text is never printed — only
 * the error NAME — because such messages could embed connection details.
 */

const mode = process.argv[2] ?? "missing";

// Import FIRST: @prisma/client auto-loads the project .env at module load
// (tryLoadEnvs), which would otherwise re-inject values after a delete.
const { db } = await import("/home/z/my-project/src/lib/db");

// NOW normalize process.env to exactly the case being tested — the db.ts guard
// reads process.env at first client use (lazy proxy), so this is authoritative.
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;

if (mode === "sqlite") {
  process.env.DATABASE_URL = "file:./db/custom.db";
} else if (mode === "unreachable") {
  // Throwaway unreachable endpoint generated at runtime — never a real
  // credential, never printed.
  process.env.DATABASE_URL = `postgresql://probe:probe@127.0.0.1:5${Math.floor(Math.random() * 9000 + 999)}/probe?connect_timeout=2&pool_timeout=2`;
}

async function main() {
  try {
    await db.series.count();
    console.log("RESULT: connected-ok");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("[bunny-library]")) {
      console.log("RESULT: sentinel-error");
      console.log("MESSAGE: " + msg.split("\n")[0]);
    } else {
      console.log("RESULT: other-error");
      console.log("NAME: " + (e instanceof Error ? e.name : typeof e));
    }
  }
  process.exit(0);
}

main();

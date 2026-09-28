#!/usr/bin/env node
/**
 * db-failsafe-check.mjs — verifies the app FAILS SAFELY on bad database env:
 *   missing      → DATABASE_URL absent            → loud sentinel error (never silent)
 *   sqlite       → DATABASE_URL with file: scheme  → loud sentinel error (no silent fallback)
 *   unreachable  → valid-scheme but unreachable PG → loud failure (no silent success)
 * Prints variable NAMES only; never prints any env value or foreign error text.
 */
import { spawnSync } from "node:child_process";

// Minimal env for the child; each probe case sets exactly what it tests.
const BASE_ENV = { PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin", HOME: process.env.HOME ?? "/home/z" };

function runCase(mode, label, expect) {
  const r = spawnSync("bun", ["/home/z/my-project/scripts/failsafe-probe.ts", mode], {
    env: BASE_ENV,
    encoding: "utf8",
    // cwd=/tmp → the db-url resolver cannot find a project .env.local, so each
    // case tests EXACTLY the env the probe sets (true-absence semantics).
    cwd: "/tmp",
    timeout: 120_000,
  });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  const result = /RESULT: ([a-z-]+)/.exec(out)?.[1] ?? "no-result";
  const message = /MESSAGE: (.*)/.exec(out)?.[1] ?? "";
  const name = /NAME: (.*)/.exec(out)?.[1] ?? "";

  let pass = result === expect.result;
  if (expect.messageIncludes) pass = pass && message.includes(expect.messageIncludes);
  if (expect.anyName) pass = pass && name.length > 0;

  console.log(`[${pass ? "PASS" : "FAIL"}] ${label}`);
  console.log(`        outcome=${result}${message ? ` | sentinel: ${message.slice(0, 130)}` : ""}${name ? ` | error-name=${name}` : ""}`);
  return pass;
}

const results = [
  runCase("missing", "A — DATABASE_URL truly absent → loud sentinel error", {
    result: "sentinel-error",
    messageIncludes: "DATABASE_URL is missing or is not a PostgreSQL connection string",
  }),
  runCase("sqlite", "B — DATABASE_URL with sqlite file: scheme → loud sentinel error (no silent fallback)", {
    result: "sentinel-error",
    messageIncludes: "DATABASE_URL is missing or is not a PostgreSQL connection string",
  }),
  runCase("unreachable", "C — unreachable PostgreSQL url → loud failure (no silent success)", {
    result: "other-error",
    anyName: true,
  }),
];

const failed = results.filter((x) => !x).length;
console.log(failed === 0 ? "\nALL FAIL-SAFE CHECKS PASSED" : `\n${failed} FAIL-SAFE CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);

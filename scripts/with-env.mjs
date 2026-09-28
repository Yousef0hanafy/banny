#!/usr/bin/env node
/**
 * with-env.mjs — loads .env.local (then .env as fallback, without overriding)
 * into process.env and executes the given command.
 *
 * Why: the Prisma CLI reads .env but NOT .env.local. The Neon connection
 * strings live in .env.local (Next.js and bun read it automatically), so all
 * `db:*` npm scripts route through this loader.
 *
 * Security: this script NEVER prints or logs variable values — on failure it
 * only names the variables it could not find. Values are passed to the child
 * process environment only.
 *
 * Usage: node scripts/with-env.mjs <command> [args...]
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function loadEnvFile(path, { override = false } = {}) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return false;
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (override || process.env[key] === undefined) process.env[key] = val;
  }
  return true;
}

// .env.local is the DESIGNATED source of truth for local secrets — its keys
// OVERRIDE ambient process env (this sandbox exports a stale scaffold
// DATABASE_URL globally; the founder-approved Neon urls must win).
// .env then fills remaining gaps only (e.g. NEXTAUTH_* on old setups).
loadEnvFile(".env.local", { override: true });
loadEnvFile(".env");

const requiredForMigrate = ["DATABASE_URL", "DIRECT_URL"];
const [cmd, ...args] = process.argv.slice(2);

if (!cmd) {
  console.error("with-env: no command given (usage: node scripts/with-env.mjs <cmd> [args...])");
  process.exit(2);
}

if (cmd.startsWith("prisma")) {
  const missing = requiredForMigrate.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(
      `[bunny-library] Missing environment variables: ${missing.join(", ")}. ` +
        "Add BOTH Neon connection strings to .env.local (DATABASE_URL = pooled, DIRECT_URL = direct). " +
        "Never paste secrets into chat or commit them."
    );
    process.exit(1);
  }
}

const result = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);

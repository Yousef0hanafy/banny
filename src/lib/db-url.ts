import { readFileSync } from "node:fs"

/**
 * Runtime DATABASE_URL resolution (bunny-library).
 *
 * Priority order:
 *  1. process.env.DATABASE_URL when it is a PostgreSQL url — the normal path on
 *     hosting platforms, where real env vars are the source of truth.
 *  2. `.env.local` DATABASE_URL — the designated local secrets file. Used when
 *     the ambient value is missing or is a stale non-PostgreSQL value (e.g.
 *     scaffold SQLite vars exported by wrapper environments). A one-time
 *     warning is logged (variable NAMES only — never values).
 *  3. undefined → the caller (src/lib/db.ts) fails loudly. There is NO SQLite
 *     fallback (DECISIONS.md D-28).
 *
 * Security: values are read from the gitignored .env.local into memory only and
 * are never printed, logged, or included in errors.
 */

let warnedOnce = false

function readEnvLocalValue(key: string): string | undefined {
  try {
    // Resolved from the process working directory: Next.js dev, the standalone
    // server and all scripts run from the project root.
    const raw = readFileSync(".env.local", "utf8")
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m || m[1] !== key) continue
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      return v
    }
  } catch {
    // .env.local absent or unreadable — treated as "not provided".
  }
  return undefined
}

export function isPostgresUrl(v: string | undefined | null): v is string {
  return typeof v === "string" && /^postgres(ql)?:\/\//i.test(v)
}

export function resolveDatabaseUrl(): string | undefined {
  const ambient = process.env.DATABASE_URL
  if (isPostgresUrl(ambient)) return ambient
  const local = readEnvLocalValue("DATABASE_URL")
  if (isPostgresUrl(local)) {
    if (!warnedOnce) {
      console.warn(
        "[bunny-library] Ambient DATABASE_URL is missing or is not PostgreSQL — using the PostgreSQL url from .env.local (value not shown)."
      )
      warnedOnce = true
    }
    return local
  }
  return undefined
}

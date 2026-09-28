import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration — pre-Prisma-7 migration (clears tracking of the
 * package.json `prisma` key, which Prisma 7 removes entirely; see
 * docs/SECURITY_AUDIT.md A-2 context and the Release C backlog).
 *
 * ⚠ Behavior change when this file exists: the Prisma CLI NO LONGER
 * auto-loads `.env` files. The same contract as scripts/with-env.mjs applies
 * here — `.env.local` is the designated source of truth (its values override
 * ambient env, because this sandbox exports a stale scaffold DATABASE_URL),
 * and `.env` fills remaining gaps only.
 *
 * Security: this file NEVER prints or logs variable values — it only names
 * variables when they are missing.
 */
function loadEnvFile(path: string, { override = false } = {}): boolean {
  if (!existsSync(path)) return false;
  const raw = readFileSync(path, "utf8");
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

loadEnvFile(".env.local", { override: true });
loadEnvFile(".env");

if (!process.env.DATABASE_URL) {
  // Fail loud with the variable NAME only — never a value. Hard gate, because
  // every CLI command (even generate) resolves the schema's datasource.
  throw new Error(
    "[bunny-library] Missing DATABASE_URL for the Prisma CLI. " +
      "Add the Neon pooled connection string to .env.local (DIRECT_URL = direct, used by migrations). " +
      "Never paste secrets into chat or commit them."
  );
}
if (!process.env.DIRECT_URL) {
  console.error(
    "[bunny-library] DIRECT_URL is not set — `migrate deploy/dev` will fail. " +
      "Add the Neon direct (non-pooled) connection string to .env.local."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Same seed command package.json carried before (bun auto-reads .env.local;
    // the env above is inherited by the child process as well).
    seed: "bun prisma/seed.ts",
  },
});

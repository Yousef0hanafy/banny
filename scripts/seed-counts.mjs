/**
 * seed-counts.mjs — READ-ONLY row counts for seed idempotency evidence.
 * Prints counts only; never prints connection strings or env values.
 * Run: node scripts/seed-counts.mjs
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  // Mirror src/lib/db-url.ts semantics: a non-postgres ambient DATABASE_URL (sandbox
  // scaffold sqlite) must not shadow the real .env.local value.
  const ambient = process.env[m[1]];
  if (ambient === undefined || (m[1] === "DATABASE_URL" && !String(ambient).startsWith("postgresql"))) {
    process.env[m[1]] = v;
  }
}

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("postgresql")) {
  console.error("DATABASE_URL: missing or not postgres — nothing counted");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });
try {
  const q = (t) => prisma.$queryRawUnsafe(`select count(*)::int as n from "${t}"`);
  const [series, chapters, pages, profiles, collections, progress, events] = await Promise.all([
    q("Series"), q("Chapter"), q("ChapterPage"), q("Profile"), q("EditorialCollection"), q("ReadingProgress"), q("AnalyticsEvent"),
  ]);
  console.log(
    `counts: series=${series[0].n} chapters=${chapters[0].n} pages=${pages[0].n} profiles=${profiles[0].n} collections=${collections[0].n} progress=${progress[0].n} events=${events[0].n}`
  );
} finally {
  await prisma.$disconnect();
}

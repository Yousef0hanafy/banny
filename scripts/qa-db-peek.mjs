/**
 * qa-db-peek.mjs — READ-ONLY QA peek: series slugs/formats, non-published
 * chapters (publish-test targets), ReadingProgress baseline. Counts and
 * slugs only; never prints connection strings or env values.
 * Run: env -u DATABASE_URL -u DIRECT_URL node scripts/qa-db-peek.mjs
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  const ambient = process.env[m[1]];
  if (ambient === undefined || (m[1] === "DATABASE_URL" && !String(ambient).startsWith("postgresql"))) {
    process.env[m[1]] = v;
  }
}

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("postgresql")) {
  console.error("DATABASE_URL: missing or not postgres — peek aborted");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });
try {
  const series = await prisma.series.findMany({
    select: { slug: true, format: true, titleAr: true, status: true },
    orderBy: { displayOrder: "asc" },
  });
  console.log("series:");
  for (const s of series) console.log(`  - ${s.slug} [${s.format}] ${s.status} «${s.titleAr}»`);

  const special = await prisma.chapter.findMany({
    where: { OR: [{ workflow: "review" }, { workflow: "draft" }] },
    select: { id: true, number: true, workflow: true, titleAr: true, series: { select: { slug: true } } },
    orderBy: [{ series: { slug: "asc" } }, { number: "asc" }],
  });
  console.log("non-published chapters:");
  for (const c of special) console.log(`  - ${c.series.slug} #${c.number} [${c.workflow}] id=${c.id} «${c.titleAr}»`);

  const progress = await prisma.readingProgress.count();
  const published = await prisma.chapter.count({ where: { workflow: "published" } });
  const events = await prisma.analyticsEvent.count();
  console.log(`baselines: readingProgress=${progress} publishedChapters=${published} analyticsEvents=${events}`);
} finally {
  await prisma.$disconnect();
}

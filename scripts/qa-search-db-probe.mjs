/**
 * DB-side probe: pull the real row for الحقيبة and replicate the app's exact
 * scoring fields (Release E QA debugging).
 * Run: DATABASE_URL=postgres://qa@127.0.0.1:54329/bunny_qa bun scripts/qa-search-db-probe.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

const rows = await db.series.findMany({
  select: { titleAr: true, titleOriginal: true, author: true, genresJson: true, tagsJson: true, synopsisAr: true },
});

const target = rows.find((r) => r.titleAr.includes("الحقيبة"));
console.log("DB title =", JSON.stringify(target?.titleAr));
console.log("codepoints of word 2:", [...(target?.titleAr.split(" ")[1] ?? "")].map((c) => c.codePointAt(0)?.toString(16)));

// score exactly like the app does
const { tokenizeArabic, scoreDocument } = await import("../src/lib/arabic-search.ts");
const { parseJsonArray } = await import("../src/lib/queries.ts").catch(() => ({
  parseJsonArray: (s) => JSON.parse(s ?? "[]"),
}));

const fieldsFor = (row) => [
  { text: row.titleAr, weight: 3 },
  ...(row.titleOriginal ? [{ text: row.titleOriginal, weight: 2 }] : []),
  { text: row.author, weight: 2 },
  { text: parseJsonArray(row.genresJson).join(" "), weight: 2 },
  { text: parseJsonArray(row.tagsJson).join(" "), weight: 1 },
  { text: row.synopsisAr, weight: 1 },
];

for (const q of ["رقم", "الحقيبة", "الحقيبة ررقم"]) {
  const tokens = tokenizeArabic(q);
  const scored = rows
    .map((row) => ({ t: row.titleAr, score: scoreDocument(tokens, fieldsFor(row)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  console.log(`q="${q}" →`, scored.slice(0, 4).map((s) => `${s.t}:${s.score}`));
}

await db.$disconnect();

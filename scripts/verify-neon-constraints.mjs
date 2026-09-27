#!/usr/bin/env node
/**
 * verify-neon-constraints.mjs — post-migration verification against Neon.
 * Run AFTER `bun run db:migrate:deploy` (and optionally the seed):
 *   node scripts/with-env.mjs node scripts/verify-neon-constraints.mjs
 *   (or directly — the script loads .env.local itself)
 *
 * Verifies: tables, native enums + labels, key column types, unique indexes,
 * foreign keys + delete/update rules, timestamp defaults, enum/unique/FK
 * enforcement (probe rows cleaned up), seeded role values.
 *
 * SECURITY: loads .env.local values into process.env only. It NEVER prints
 * connection strings or any env value. PostgreSQL error *codes* are printed;
 * error messages are truncated to their first line (PG messages contain no
 * credentials).
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  } catch {
    console.error("Missing .env.local — add the Neon connection strings first.");
    process.exit(1);
  }
}
loadEnvLocal();

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error("DIRECT_URL is not set — this verification must run against the direct (non-pooled) endpoint.");
  process.exit(1);
}

// Administrative checks go through the DIRECT endpoint (never pooled).
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } }, log: ["error"] });

let pass = 0;
let fail = 0;
function check(label, ok, detail = "") {
  if (ok) pass++;
  else fail++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
}
function firstLine(e) {
  return String(e?.message ?? e).split("\n")[0].slice(0, 160);
}

async function main() {
  /* 1 — tables */
  const expectedTables = ["Profile", "Series", "Chapter", "ChapterPage", "ReadingProgress", "AnalyticsEvent", "EditorialCollection"];
  const tables = await prisma.$queryRawUnsafe(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`);
  const tableNames = tables.map((t) => t.table_name).sort();
  check(`tables present (${expectedTables.length})`, expectedTables.every((t) => tableNames.includes(t)), `found: ${tableNames.join(", ")}`);

  /* 2 — native enums + labels */
  const expectedEnums = {
    user_role: ["reader", "editor", "admin"],
    series_format: ["manga", "webtoon"],
    series_status: ["ongoing", "completed", "hiatus"],
    chapter_workflow: ["draft", "review", "published"],
    reading_direction: ["rtl", "ltr"],
    analytics_event_type: ["read_start", "read_page", "read_complete", "login", "publish"],
  };
  const enums = await prisma.$queryRawUnsafe(`
    select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as labels
    from pg_type t join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' group by t.typname`);
  const enumMap = Object.fromEntries(enums.map((e) => [e.typname, e.labels]));
  for (const [name, labels] of Object.entries(expectedEnums)) {
    const got = enumMap[name] ?? [];
    check(`enum ${name} labels`, JSON.stringify(got) === JSON.stringify(labels), got.join("|") || "MISSING");
  }

  /* 3 — key column types */
  const cols = await prisma.$queryRawUnsafe(`
    select table_name, column_name, udt_name, is_nullable, column_default
    from information_schema.columns
    where table_schema='public' and table_name in ('Profile','Series','Chapter','AnalyticsEvent','ReadingProgress')
    and (
      (table_name='Profile' and column_name='role')
      or (table_name='Series' and column_name in ('format','status','slug'))
      or (table_name='Chapter' and column_name='workflow')
      or (table_name='AnalyticsEvent' and column_name='type')
      or (table_name='Series' and column_name='createdAt')
      or (table_name='ReadingProgress' and column_name='updatedAt')
    )`);
  const col = (t, c) => cols.find((x) => x.table_name === t && x.column_name === c);
  check("Profile.role → user_role enum", col("Profile", "role")?.udt_name === "user_role");
  check("Series.format → series_format enum", col("Series", "format")?.udt_name === "series_format");
  check("Series.status → series_status enum", col("Series", "status")?.udt_name === "series_status");
  check("Chapter.workflow → chapter_workflow enum", col("Chapter", "workflow")?.udt_name === "chapter_workflow");
  check("AnalyticsEvent.type → analytics_event_type enum", col("AnalyticsEvent", "type")?.udt_name === "analytics_event_type");
  check("Series.createdAt has CURRENT_TIMESTAMP default", String(col("Series", "createdAt")?.column_default ?? "").includes("CURRENT_TIMESTAMP"));

  /* 4 — unique indexes */
  const expectedUniques = ["Profile_email_key", "Series_slug_key", "Chapter_seriesId_number_key", "ChapterPage_chapterId_pageIndex_key", "ReadingProgress_profileId_chapterId_key", "EditorialCollection_slug_key"];
  const idx = await prisma.$queryRawUnsafe(`
    select indexname from pg_indexes
    where schemaname='public' and indexdef like 'CREATE UNIQUE INDEX%'`);
  const indexNames = idx.map((x) => x.indexname);
  check(`unique constraints/indexes (${expectedUniques.length})`, expectedUniques.every((n) => indexNames.includes(n)), indexNames.sort().join(", "));

  /* 5 — foreign keys + rules (c=Cascade, n=SetNull, a=NO ACTION) */
  const fks = await prisma.$queryRawUnsafe(`
    select conname, confdeltype::text as del, confupdtype::text as upd
    from pg_constraint where contype='f' and connamespace='public'::regnamespace`);
  const fkMap = Object.fromEntries(fks.map((f) => [f.conname, f]));
  const expectedFks = {
    Chapter_seriesId_fkey: ["c", "c"],
    ChapterPage_chapterId_fkey: ["c", "c"],
    ReadingProgress_profileId_fkey: ["c", "c"],
    ReadingProgress_seriesId_fkey: ["c", "c"],
    ReadingProgress_chapterId_fkey: ["c", "c"],
    AnalyticsEvent_profileId_fkey: ["n", "c"],
    AnalyticsEvent_seriesId_fkey: ["n", "c"],
  };
  for (const [name, [del, upd]] of Object.entries(expectedFks)) {
    const f = fkMap[name];
    check(`FK ${name} (delete=${del === "c" ? "CASCADE" : "SET NULL"})`, Boolean(f) && f.del === del && f.upd === upd, f ? `del=${f.del} upd=${f.upd}` : "MISSING");
  }

  /* 6 — behavior probes (each cleans up; probe ids are namespaced) */
  const pid = "probe-";
  const clean = async () => {
    await prisma.$executeRawUnsafe(`delete from "Series" where id like '${pid}%'`).catch(() => {});
    await prisma.$executeRawUnsafe(`delete from "ChapterPage" where id like '${pid}%'`).catch(() => {});
  };
  await clean();
  try {
    // 6a — enum enforcement: invalid format value must be rejected
    try {
      await prisma.$executeRawUnsafe(
        `insert into "Series" (id, slug, titleAr, synopsisAr, format, author, coverPath) values ('${pid}s1', 'zz-constraint-probe', 't', 's', 'novel', 'a', '/x.webp')`
      );
      check("enum rejects invalid value 'novel' for series_format", false, "insert unexpectedly succeeded");
    } catch (e) {
      check("enum rejects invalid value 'novel' for series_format", e?.code === "22P02", `pg code=${e?.code ?? "?"}`);
    }

    // 6b — valid insert + createdAt default
    await prisma.$executeRawUnsafe(
      `insert into "Series" (id, slug, titleAr, synopsisAr, format, author, coverPath) values ('${pid}s1', 'zz-constraint-probe', 't', 's', 'manga', 'a', '/x.webp')`
    );
    const row = await prisma.$queryRawUnsafe(`select "createdAt" from "Series" where id='${pid}s1'`);
    check("createdAt DB default applied", row.length === 1 && row[0].createdAt instanceof Date);

    // 6c — unique slug enforcement
    try {
      await prisma.$executeRawUnsafe(
        `insert into "Series" (id, slug, titleAr, synopsisAr, format, author, coverPath) values ('${pid}s2', 'zz-constraint-probe', 't', 's', 'manga', 'a', '/x.webp')`
      );
      check("unique slug enforced", false, "duplicate insert unexpectedly succeeded");
    } catch (e) {
      check("unique slug enforced", e?.code === "23505", `pg code=${e?.code ?? "?"}`);
    }

    // 6d — FK enforcement
    try {
      await prisma.$executeRawUnsafe(
        `insert into "ChapterPage" (id, chapterId, pageIndex, imagePath) values ('${pid}p1', 'nonexistent-chapter', 0, '/x.webp')`
      );
      check("FK rejects orphan ChapterPage", false, "orphan insert unexpectedly succeeded");
    } catch (e) {
      check("FK rejects orphan ChapterPage", e?.code === "23503", `pg code=${e?.code ?? "?"}`);
    }

    // 6e — cascade delete: Series → Chapter
    await prisma.$executeRawUnsafe(
      `insert into "Chapter" (id, seriesId, number, titleAr) values ('${pid}c1', '${pid}s1', 999, 't')`
    );
    await prisma.$executeRawUnsafe(`delete from "Series" where id='${pid}s1'`);
    const orphanChapters = await prisma.$queryRawUnsafe(`select id from "Chapter" where id='${pid}c1'`);
    check("deleting Series cascades to Chapter", orphanChapters.length === 0);
  } finally {
    await clean();
  }

  /* 7 — seeded role values (post-seed sanity; skipped harmlessly pre-seed) */
  try {
    const roles = (await prisma.$queryRawUnsafe(`select distinct role::text as role from "Profile"`)).map((r) => r.role);
    check("Profile.role values ⊆ {reader,editor,admin}", roles.every((r) => ["reader", "editor", "admin"].includes(r)), roles.join("|") || "no profiles yet");
  } catch (e) {
    check("Profile.role values readable", false, firstLine(e));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error("Verification aborted:", firstLine(e));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

# Bunny Library — SQLite → Neon PostgreSQL Migration Report

**Date:** 2026-09-28 · **Task:** A-NEON (founder-approved, D-28) · **Status:** ✅ COMPLETE & VERIFIED

## 1. Outcome

Release A runtime now reads and writes **Neon PostgreSQL**. Local SQLite is fully removed from
the runtime path (no silent fallback — missing/invalid env fails loudly with a sentinel naming
the variable). Prisma remains the ORM + migration tool (versioned migrations); NextAuth remains
the auth layer; Supabase is not used at runtime and no database-level RLS exists or is claimed.

## 2. Connection setup (two-URL discipline)

| Variable | Endpoint | Used by |
|---|---|---|
| `DATABASE_URL` | Pooled (`…-pooler…`) | Application runtime (PrismaClient via `datasourceUrl`) |
| `DIRECT_URL` | Direct (no `-pooler`) | Prisma CLI only (`migrate status/deploy/dev/reset`, `studio`) |

- Both strings were copied from the Neon console, stored **verbatim** in `.env.local`
  (mode 0600, gitignored, untracked). `DIRECT_URL` was never derived by hostname mutation.
- The one-URL stop condition was honored: no migration command ran until both URLs existed.
- Connectivity verified read-only (`SELECT 1`) **before** any write; baseline was 0 tables.
- `sslmode=require` and `channel_binding=require` accepted by Prisma on both endpoints.

## 3. What was applied

- **Migration:** `prisma/migrations/20260927220347_init/migration.sql` via
  `prisma migrate deploy` (against `DIRECT_URL`). `prisma migrate status` →
  **"Database schema is up to date!"**
- **Schema:** 7 tables (`Profile`, `Series`, `Chapter`, `ChapterPage`, `ReadingProgress`,
  `AnalyticsEvent`, `EditorialCollection`), **6 native enums** (`user_role`, `series_format`,
  `series_status`, `chapter_workflow`, `reading_direction`, `analytics_event_type` — values
  unchanged from the SQLite string vocabularies), 6 unique indexes, 7 FKs (CASCADE for
  chapter/page/progress, SET NULL for analytics), `TIMESTAMP(3)` + `CURRENT_TIMESTAMP` defaults.
- JSON-as-String columns kept (`jsonb` deferred to Release B).

## 4. Verification results

**Constraint verification — 27/27 PASS** (`scripts/verify-neon-constraints.mjs`, direct endpoint):
tables; enum labels; enum-typed columns; unique indexes (`Profile_email_key`, `Series_slug_key`,
`Chapter_seriesId_number_key`, `ChapterPage_chapterId_pageIndex_key`,
`ReadingProgress_profileId_chapterId_key`, `EditorialCollection_slug_key`); FK delete/update rules;
`createdAt` DB default. **Behavioral probes:** invalid enum → `22P02`; duplicate slug → `23505`;
orphan page insert → `23503`; series delete cascades to chapters. Probe rows cleaned up.

**Seed — idempotency ×2 PASS:** both runs produced identical counts
(series 6 · chapters 26 · pages 220 · profiles 3 · collections 2 · progress 3 · events 318).

**Runtime QA (production standalone build, serverless-safe client, reads/writes via pooled URL):**

| Test | Result |
|---|---|
| Guest home browse (RTL, 6 series, collections, trending) | PASS |
| Reader sign-in → webtoon read → progress persisted | PASS (`readingProgress` 3→4, `analyticsEvents` +2) |
| Admin sign-in (3-layer guard) → dashboard live metrics | PASS (321 events incl. login) |
| Publish review→published via admin UI | PASS (`publishedChapters` 23→24, chapter 6 publicly visible to guests "today") |
| Webtoon + manga readers render from Neon | PASS |
| typecheck / lint / production build | CLEAN / CLEAN / GREEN (DB routes all dynamic ƒ) |

**Non-blocking finding:** one minified React #418 hydration warning observed during QA (pages
fully functional; suspected pre-existing relative-date rendering). Queued to Release C polish
audit — not migration-related.

## 5. Fixes made during execution

- `scripts/verify-neon-constraints.mjs`: quoted camelCase identifiers in probe SQL (Postgres
  folds unquoted `titleAr` → `titlear`, `42703`); extracted real PG codes from
  `e.meta.code` (Prisma wraps raw failures as `P2010`); probes now supply `updatedAt`
  (`@updatedAt` is client-side — no DB default).

## 6. Neon limitations & open security decisions

1. **No database-level RLS** (by design — authorization enforced at app layer:
   middleware → admin layout → `requireRole` on every admin query/action). Documented honestly;
   if DB-level defense-in-depth is wanted later, Neon supports Postgres RLS as a follow-up.
2. **Credential hygiene:** both connection strings transited chat during setup. Recommendation:
   rotate the `neondb_owner` password post-cutover (Neon → Roles → reset), then update
   `.env.local` (helper: `scripts/set-env-local.mjs`). Historical git commits contain a
   pre-hardening `.env` — rotation covers that exposure too.
3. **Deprecation notice:** `package.json#prisma` seed config → migrate to `prisma.config.ts`
   before Prisma 7 (non-blocking).
4. **Pooled URL used verbatim** — no `pgbouncer=true` param needed; no prepared-statement
   errors observed across the QA session. Revisit only if concurrent-load testing ever shows
   `prepared statement … already exists` errors.

## 7. Secrets confirmation

No connection string or password was printed to chat, logs, worklog, commits, or reports at any
point. `.env.local` is `chmod 600`, matched by `.gitignore` (`.env*`), untracked; only
`.env.example` (names only) is tracked. QA evidence screenshots contain content only.

## 8. Rollback / operations

See `README.md` — commands for `db:status`, `db:migrate:deploy`, `db:seed` (idempotent),
`db:reset`, `prisma migrate resolve --rolled-back` for failed-migration recovery, and Neon
point-in-time restore guidance.

**Release gate status:** migration QA gate (①) for Release B is **CLEARED**. Release B remains
gated additionally on source-document reconciliation (②, FD-1) — still pending founder delivery.

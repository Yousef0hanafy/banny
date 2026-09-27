# مكتبة باني — Bunny Library

> Your personal Arabic library for stories worth getting lost in.
> **Release B — Complete Demo Experience** (see `docs/RELEASE_PLAN.md`)

An Arabic-first, dark-mode, premium reading platform prototype for manga, webtoons, and novels — reader-first, RTL-native, fully functional, seeded with 100% original fictional content.

**Demo notice (binding):** this is a product prototype. All series, chapters, covers, names, prose, and comments are original fictional content created for the demo. Nothing is licensed, official, or real. No payments. No downloads. No purchase flows.

---

## What's in Release B (adds to Release A)

| Surface | Routes |
|---|---|
| **Novel reader** — RTL prose, font-size + dark/sepia/light themes (persisted), scroll progress | `/read/novel/[series]/[chapter]` |
| **Personal library** (4 shelf tabs, unread badges, mark-all-read, shelf switching) | `/library` |
| **Updates feed** — latest chapters of library series, read/unread | `/updates` |
| **Full profile** — stats, favorite genres, recent reading, activity log, settings | `/profile` |
| **Community** — comments (series + chapter scope), report flow, 5-star ratings with live aggregates | on `/series/[slug]` + readers |
| **Admin: moderation queue** (flagged/hidden comments, hide/restore/delete) | `/admin/moderation` |
| **Admin: collections CRUD** (feature-on-home, theme, ordering, series picker) | `/admin/collections` |
| **Admin: users & roles** (admin-only, self-demotion guard) | `/admin/users` |
| **Admin dashboard** — 14-day activity chart + community pulse cards | `/admin` |
| **Chapter scheduler** — schedule publishing (`scheduledFor`), public "ينشر قريبًا" badge | chapter forms + series pages |
| **Seed 6 → 12 series** — incl. 4 novels with original Arabic prose, 24 comments, 21 ratings, reports, demo library | `npm run db:seed` |

## What was in Release A

| Surface | Routes |
|---|---|
| Home (reader-first: Continue Reading hero → latest updates → editorial collections → trending → newest → genre browse) | `/` |
| Explore (Arabic instant search, format/status/genre filters, popular/newest/rating sort, empty states) | `/explore` |
| Series detail (meta, Arabic synopsis, CTAs, chapter list with read/unread, locked-demo chapters, related series) | `/series/[slug]` |
| Webtoon reader (vertical continuous, progress, immersive mode) | `/read/webtoon/[series]/[chapter]` |
| Manga reader (paged, RTL/LTR toggle, page slider, keyboard nav, immersive mode) | `/read/manga/[series]/[chapter]` |
| Auth (demo credentials login) | `/login` |
| Admin (guarded): dashboard-lite, series list/create/edit, chapters manager with draft→review→published workflow + publish/unpublish, chapter creation | `/admin`, `/admin/series`, `/admin/series/new`, `/admin/series/[id]`, `/admin/chapters`, `/admin/chapters/new` |
| 404 (Arabic) | any unknown route |

**Deferred to Release C**: responsive/RTL audit, error/empty-state sweep, monitoring placeholders, accessibility baseline, security audit, deployment runbook.

## Tech stack

- **Next.js 16 (App Router) + TypeScript strict + React 19**
- **Tailwind CSS v4** (CSS-first tokens in `src/app/globals.css`) + **shadcn/ui** (New York) + **Lucide icons**
- **Prisma + Neon PostgreSQL** as the runtime database (versioned migrations; DECISIONS.md D-28)
- **NextAuth v4** (credentials, JWT sessions, role in token)
- **IBM Plex Sans Arabic** via `next/font` (RTL-native typography: `dir="rtl"`, letter-spacing 0, line-height ≥ 1.75)
- **sharp** for deterministic generated cover/panel art (original abstract art — no copyrighted material)
- **Server Actions** for all mutations (progress saving, admin CRUD)

## Database — Neon PostgreSQL (runtime)

The runtime database is **Neon PostgreSQL**, accessed through **Prisma** (ORM + versioned
migrations in `prisma/migrations/`). Supabase is **not** used at runtime — the old Supabase/RLS
SQL was a design artifact that was **never executed** and is archived, clearly labeled, in
`docs/archive/supabase-sql-not-executed/`. There is **no database-level RLS**; see
[What is enforced where](#what-is-enforced-where).

### Local setup

1. Install dependencies and generate the Prisma client:
   ```bash
   bun install                # or npm install
   bun run db:generate        # prisma generate
   ```
2. Create a `.env.local` (gitignored — never commit or paste real values into chat) from the
   names-only template:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in the two Neon connection strings (see below), then create the schema and seed:
   ```bash
   bun run db:migrate:deploy  # apply prisma/migrations to Neon (uses DIRECT_URL)
   node scripts/generate-art.mjs   # generate all original cover/page/panel art (public/art/**)
   bun run db:seed            # seed demo content (idempotent — safe to re-run)
   bun run dev                # http://localhost:3000
   ```

### Neon environment variables

| Variable | Which Neon url | Used by |
|---|---|---|
| `DATABASE_URL` | **Pooled** connection string (hostname contains `-pooler`) | Application runtime — every query (`src/lib/db.ts`) |
| `DIRECT_URL` | **Direct / non-pooled** connection string (same project & role, no `-pooler`) | Prisma CLI only — `migrate deploy/dev/status/reset`, `studio` |
| `NEXTAUTH_SECRET` | — (any long random string) | NextAuth session signing |
| `NEXTAUTH_URL` | — (app origin, e.g. `http://localhost:3000`) | NextAuth |

Copy **both** strings directly from the Neon dashboard (“Connect” → connection details;
the pooled string is shown when the *Pooled connection* toggle is on). Never hand-edit a
hostname. Both variables are required — the app and the CLI **fail loudly** if either is
missing, and there is **no SQLite fallback** (legacy `db/custom.db` is archived, untracked).

### Migrate command

```bash
bun run db:status          # prisma migrate status — shows applied/pending migrations
bun run db:migrate:deploy  # apply pending versioned migrations (production-safe; uses DIRECT_URL)
```

Migrations are versioned SQL files under `prisma/migrations/` (current baseline:
`20260927220347_init` — enums, tables, indexes, FKs). `prisma db push` is **not** used and its
script was removed.

For future schema changes in development, prefer generating a new migration and applying it:

```bash
# generate SQL from schema changes into a new timestamped migration folder (offline):
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script
# then review the file under prisma/migrations/<timestamp>_<name>/migration.sql and:
bun run db:migrate:deploy
```

Note: `prisma migrate dev` (and `migrate reset`) additionally needs a **shadow database**;
Neon supports this via a dedicated shadow DB (`SHADOW_DATABASE_URL`) or a role with
`CREATEDB`. If unavailable, use the diff + deploy flow above.

### Seed command

```bash
bun run db:seed            # idempotent — upserts by slug/email; safe to re-run
```

Re-running the seed twice produces identical row counts (analytics events are only seeded
into an empty `AnalyticsEvent` table; demo progress rows are upserted).

### Rollback / recovery

- **Roll back a bad migration:** mark it rolled back and re-apply a fixed one:
  ```bash
  bun run db:status
  npx prisma migrate resolve --rolled-back <migration_name>   # with DIRECT_URL in env
  ```
  Then fix the SQL and `bun run db:migrate:deploy` again.
- **Point-in-time recovery:** Neon retains restore windows per project — restore/branch the
  Neon project from the dashboard to a pre-migration timestamp, copy the needed data (or
  re-point `DATABASE_URL`/`DIRECT_URL` at the restored branch for rehearsal).
- **Re-seed after a wipe:** `bun run db:migrate:deploy && bun run db:seed` restores the full
  demo state (art files are static under `public/art/`).
- **Baseline rebuild:** `prisma/migrations/` + `prisma/seed.ts` are the single source of
  truth; a fresh Neon branch (zero schemas) reaches demo state with those two commands.

### What is enforced where

| Guarantee | Enforced by | Where |
|---|---|---|
| Authentication (who you are) | NextAuth credentials + JWT sessions (scrypt hashes) | **Server-side** |
| Role vocabulary (`reader\|editor\|admin`) | Native Postgres enum `user_role` | **Database-side** |
| Content workflow (`draft\|review\|published`), format, status, reading direction, event type | Native Postgres enums | **Database-side** |
| Admin authorization (who may write) | 3 application layers: middleware → admin layout guard → `requireRole` inside every admin Server Action/query | **Server-side** (no RLS) |
| Public users only see published chapters | `workflow='published'` filters in every public query | **Server-side** (no RLS) |
| Reading progress belongs to its owner | profile/chapter scoping in queries + Server Actions | **Server-side** (no RLS) |
| One chapter number per series; one page index per chapter; one progress row per (profile, chapter); unique slugs/emails | Unique constraints / composite unique indexes | **Database-side** |
| Referential integrity (orphan pages/progress impossible; deleting a series cascades; analytics survive author deletion via `SET NULL`) | Foreign keys with explicit delete rules | **Database-side** |
| Required fields & defaults | NOT NULL + column defaults | **Database-side** |
| Input validation before any write | zod schemas in Server Actions | **Server-side** |

This table is the honest post-D-28 enforcement story: **no database-level RLS is enabled**, so
row-level authorization is application-enforced. The app also fails safely on configuration
errors: `src/lib/db.ts` throws a clear error (variable names only, never values) if
`DATABASE_URL` is missing or is not a PostgreSQL url — it can never silently fall back to a
wrong database.

## Getting started

See [Database — Neon PostgreSQL](#database--neon-postgresql-runtime) above: `.env.local`
(holding `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`),
`bun run db:migrate:deploy`, `node scripts/generate-art.mjs`, `bun run db:seed`, `bun run dev`.

## Demo accounts

| Role | Email | Password | Can do |
|---|---|---|---|
| Admin | `admin@bunny.demo` | `bunny-admin-2026` | Full admin panel incl. publish workflow |
| Reader | `reader@bunny.demo` | `bunny-reader-2026` | Synced reading progress (seeded mid-chapter) |
| Editor | `editor@bunny.demo` | `bunny-editor-2026` | Content management (no admin-only screens) |

Guests can browse and read; their progress persists in `localStorage` only (by design — DB-backed library is Release B).

## Seeded demo content (original fiction)

| Series | Format | Chapters | Notes |
|---|---|---|---|
| حارس بوابة الشفق | manga | 5 (1 review) | dark fantasy/action |
| مقهى أوراق النعناع | manga | 4 (completed) | slice of life |
| ملف حالة: مرسى الغائبين | manga | 4 (1 draft) | mystery |
| زفاف القمر الأحمر | webtoon | 6 (1 review, ch5 = locked premium demo) | romance/fantasy |
| نبض المدينة صفر | webtoon | 4 | sci-fi/action |
| خزانة زينب | webtoon | 3 (hiatus) | historical/drama |

Plus: 2 editorial collections, 3 seeded reading-progress rows for the reader account, ~320 analytics events, 226 generated art files.

## Admin workflow (what to demo)

1. Log in as admin → `/admin` shows live counts + recent activity + top series.
2. `/admin/chapters?workflow=review` → switch a chapter's workflow to **منشور** → the public series page immediately shows the new chapter (revalidated).
3. `/admin/chapters/new` → create a chapter (pages auto-generated as abstract placeholders).
4. Toggle **قفل تجريبي** on any chapter → it renders the locked-demo state publicly (no purchase flow exists).
5. `/admin/series/new` → create a series (cover upload arrives in Release B).
6. Log in as reader → `/admin` shows the Arabic "لا تملك صلاحية الوصول" screen (three-layer guard: middleware → layout → action).

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | dev server on :3000 |
| `bun run lint` | ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run db:status` | Prisma migration status (Neon) |
| `bun run db:migrate:deploy` | apply versioned migrations to Neon |
| `bun run db:seed` | idempotent demo seed into Neon |
| `bun run db:studio` | Prisma Studio (read/write UI) |
| `node scripts/generate-art.mjs` | regenerate all demo art |
| `node scripts/verify-neon-constraints.mjs` | post-migration DB constraint/enum/FK verification |
| `node scripts/db-failsafe-check.mjs` | verify the app fails safely with missing/wrong DB env vars |

## QA evidence (Release A exit criteria — browser-verified)

- Guest browse → read webtoon + manga chapters → progress resumes (localStorage mirror verified).
- Reader login → seeded continue-reading hero renders percentages + resume CTA.
- Reader-role admin denial screen verified.
- Admin login → dashboard metrics from seeded data.
- Publish workflow: review → published reflected publicly (DB + UI verified).
- Chapter creation with placeholder pages verified; duplicate chapter number rejected with Arabic error.
- Locked premium chapter state verified (no purchase affordance).
- Explore search + no-results state verified.
- RTL mirroring, mobile 390px layout (bottom nav), console error-free, ESLint clean.

## Known Release-A limitations (by design)

- «أضف إلى مكتبتي» button is visible but disabled with a «قريبًا» tag (library ships in B).
- New admin-created series have no cover art until the Release B upload flow.
- Comments, ratings, collections admin, scheduler, analytics charts → Release B.
- Monitoring/accessibility/deployment hardening → Release C.

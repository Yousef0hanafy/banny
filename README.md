# مكتبة باني — Bunny Library

> Your personal Arabic library for stories worth getting lost in.
> **Release E — Community, Notifications, Search & Studio** (see `docs/RELEASE_PLAN.md` + `docs/RELEASE_E_REPORT.md`)

An Arabic-first, dark-mode, premium reading platform prototype for manga, webtoons, and novels — reader-first, RTL-native, fully functional, seeded with 100% original fictional content.

**Demo notice (binding):** this is a product prototype. All series, chapters, covers, names, prose, and comments are original fictional content created for the demo. Nothing is licensed, official, or real. No payments. No downloads. No purchase flows.

---

## What's in Release E (adds to Release D)

| Area | What changed |
|---|---|
| **Notifications center (الإشعارات)** | Header bell with unread badge + dropdown feed + full `/notifications` page (mark-read on click, mark-all). Server fan-out on chapter publish to every profile that shelved the series, and on comment likes (never self). New `Notification` table + `notification_type` enum — one versioned migration |
| **Chapter comments + likes** | The shared CommentsSection now renders inside all three readers (webtoon: inline at chapter end; manga/novel: header-trigger dialog scoped to the chapter). Heart/like on any comment (`CommentLike` table, compound unique, optimistic toggle + rollback); liking someone's comment notifies them |
| **Arabic smart search (البحث الذكي)** | `src/lib/arabic-search.ts` — normalization (أإآ→ا، ة→ه، ى→ي، tashkeel/tatweel stripped), weighted field scoring (title ×3 … synopsis ×1) with bounded Levenshtein typo tolerance, relevance-first ordering, and a «هل تقصد …؟» chip on empty results (looser tolerance than the search itself) |
| **RTL share cards** | Share sheet on every series (native share / copy link / X / WhatsApp / Telegram) + branded per-series OG image (`next/og` satori, 1200×630, series accent, IBM Plex Sans Arabic WOFFs committed in `public/fonts/`). Satori has no bidi → Arabic strings word-reversed + `row-reverse` rows (documented in code) |
| **Creator studio lite (استوديو المبدعين)** | `/studio` for editor+: read-only insights — totals strip, scheduled-chapters banner, per-series cards (reads bar, rating, comments, saves, chapter pipeline published/review/drafts/scheduled, top chapters by read_start events), deep links into admin. Zero DDL |
| **Seed** | +4 demo notifications for the reader (unread/read mix) + 8 comment likes — both empty-table-guarded, seed stays idempotent ×2 |

**Release E status**: browser-verified end-to-end on the local QA Postgres — see `docs/RELEASE_E_REPORT.md`.

---

## What's in Release D (adds to Release C)

| Area | What changed |
|---|---|
| **"لك" For You rail** (home) | Zero-schema personalized recommendations (`src/lib/foryou.ts`): genre affinity from the reader's own footprint (ReadingProgress + LibraryItem + Ratings with 5★/1★ weighting), candidates = published series the reader has NOT touched/shelved/rated, popularity tiebreak. **Explainable**: every card carries an Arabic reason chip — "لأنك قرأت «…»" / "يشبه «…» من مكتبتك". Cold-start rule: with <2 history series (or no positive affinity) the rail does not render — no noise that doesn't concern you (D-01) |
| **Reading streak + stats** (profile) | `src/lib/reading-stats.ts`: current streak (webtoon convention — today active, or yesterday "at risk"), longest streak (365-day window), days-active/30, completed chapters, 14-day personal activity area chart (Recharts, same visual language as admin chart). Derived from AnalyticsEvent read_* events ∪ ReadingProgress touches — **zero schema migrations** |
| **Badges (شاراتك)** | 8 deterministic badges (first chapter, 3-day streak, 7-day streak, 10 chapters, finisher shelf, first rating, first comment, 5-series collector) shown earned (gold) or locked with an Arabic progress hint |
| **Seed** | Demo reader now has a guaranteed 10-day unbroken streak (deterministic, empty-table-guarded → seed stays idempotent ×2: 348 events) + 3 completed demo chapters for a lived-in badge spread (7/8 earned, "3/10 فصلًا" hint on the locked one). Events: 318 → 348 |
| **QA infrastructure** | `scripts/qa-local-pg.mjs` — ephemeral embedded **PostgreSQL 18** on 127.0.0.1:54329 (/tmp data dir) so full runtime QA runs while Neon credentials are pending founder rotation (see §Known limitations) |

**Release D status**: browser-verified end-to-end on the local QA Postgres — see `docs/RELEASE_D_REPORT.md`.

---

## What's in Release C (adds to Release B)

| Area | What changed |
|---|---|
| **Hydration fix** | React #418 eliminated — comment timestamps render via `useSyncExternalStore` (server/client deterministic two-pass; refreshed every 60 s) |
| **Error boundaries** | Arabic `error.tsx` (retry + digest) + `global-error.tsx` last-resort fallback, Sentry-ready |
| **Loading skeletons** | Per-route Arabic skeletons (home, explore, series, library, updates, admin) + immersive reader loader |
| **Monitoring placeholders** | `GET /api/health` (liveness + opaque DB probe), `src/lib/analytics.ts` no-op stubs with one-step PostHog/Sentry activation notes |
| **Security hardening** | **Nonce-based strict-dynamic CSP** on every document (`src/middleware.ts`), security headers on all routes (XFO/nosniff/referrer/permissions), `ignoreBuildErrors` removed, StrictMode on, **46 unused scaffold packages removed**, next 16.1.1→16.3.6 + next-auth 4.24.15 + sharp 0.35.5 — audit in `docs/SECURITY_AUDIT.md` (A-1 mitigated §8.1, incident §9) |
| **Brand + favicon** | Single swap-point `BrandMark` component (header/login/admin). ب letter-mark brand (FD-11: founder dropped the rabbit-logo delivery; placeholder is the standing brand). If ever reopened: one-command swap via `node scripts/integrate-logo.mjs <image>` (icon.png + favicon.ico + apple-icon.png + brand asset) |
| **Audit matrix** | RTL/responsive verified at 360/768/1280 (no horizontal overflow, bottom nav, mirrored layout), a11y baseline (focus-visible rings, aria labels, landmarks, AA contrast tokens) |

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

**Release C status**: the deferred list above is now **done** — see the Release C table and `docs/RELEASE_C_REPORT.md`.

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

> ⚠ **2026-09-28 incident note:** a sandbox reset wiped the local `.env.local` (the only
> copy of the Neon connection strings in the workspace). The database itself is unaffected —
> only local access was lost. Connection strings must be re-supplied (rotate first — see
> `docs/SECURITY_AUDIT.md` §9 / A-4). A fresh `NEXTAUTH_SECRET` was generated locally and
> is already in place.

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

Plus Release B series (all original fiction):

| Series | Format | Notes |
|---|---|---|
| رسائل من الطابق السابع | novel | 3 chapters of original Arabic prose |
| رملٌ يحفظ الأسماء | novel | 3 chapters |
| قطار السادسة والنصف | novel | 3 chapters |
| مرسى النجوم القديمة | novel | 3 chapters |
| المدينة التي نسيت المطر | manga | 4 chapters |
| موسم المدّ الأخير | webtoon | ch4 future-scheduled (public "ينشر قريبًا") |

Totals: 12 series · 46 chapters · 3 collections (incl. novel collection «أصوات مُحبّرة») · 24 comments · 21 ratings · 2 moderation reports · 7 library items.

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
| `node scripts/dep-usage-audit.mjs` | list zero-reference dependencies (keep the dependency tree lean) |
| `bash scripts/qa-release-c.sh` | self-contained browser QA matrix (RTL/responsive/a11y/404/guard) |
| `curl localhost:3000/api/health` | liveness + DB probe (opaque, monitoring-ready) |

## Deploy runbook (Vercel + Neon)

Target: a new developer goes clone → live demo in ≤ 30 minutes with this README alone.

1. **Neon project** — create (or reuse) a project at neon.tech. Copy **two** connection strings
   from *Connect*: pooled (toggle ON) → `DATABASE_URL`, direct (toggle OFF) → `DIRECT_URL`.
2. **Secrets** — locally: `.env.local` (chmod 600, never committed); on Vercel: Project →
   Settings → Environment Variables → add `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`
   (`openssl rand -base64 32`), `NEXTAUTH_URL` (the deployment origin). Values never in chat/git.
3. **Schema** — `bun install && bun run db:generate && bun run db:migrate:deploy` applies the
   versioned migrations to Neon (uses `DIRECT_URL`).
4. **Art + seed** — `node scripts/generate-art.mjs` (writes `public/art/**`), then
   `bun run db:seed` (idempotent). Re-running seed on an already-seeded DB changes nothing.
5. **Run** — dev: `bun run dev`. Production: `bun run build && bun run start` (standalone).
   Health probe: `curl /api/health` → `{"status":"ok","database":"ok",...}`.
6. **Vercel** — import the repo, framework auto-detects Next.js; the build command already
   copies static assets into the standalone output. Add the 4 env vars from step 2. Every DB
   route is `force-dynamic` (ƒ), so no ISR/cache surprises. First deploy after step 3–4 shows
   the full seeded demo.
7. **Verify after deploy** — visit `/` (12 series, RTL), `/api/health`, `/admin` as admin →
   dashboard; sign in with any demo account below.

Rollback: Neon PITR per [Rollback / recovery](#rollback--recovery); Vercel instant rollback to
any prior deployment from the dashboard.

## QA evidence (Release C — browser-verified)

- Security headers verified live on every response (CSP, X-Frame-Options DENY, nosniff,
  referrer, permissions-policy); `/api/health` returns `{status:"ok",database:"ok"}`.
- Hydration: `<time>` elements render empty on SSR and upgrade to «اليوم/قبل N يوم» post-mount
  (useSyncExternalStore) — the React #418 class is structurally eliminated.
- RTL/responsive matrix: 360 / 768 / 1280 — zero horizontal overflow on all three; bottom nav
  (5 items) on mobile; mirrored layouts correct.
- A11y: Tab focus-visible ring on primary nav; 17 aria-labeled controls on home; landmarks
  (main/nav/header/footer) present; Arabic 404 and error boundaries on-brand.
- Guest → `/admin` redirects to `/login?callbackUrl=/admin` (guard layer 1).
- Neon constraint verifier re-run after all changes: **41/41 PASS**.
- typecheck clean · ESLint clean · production build green (next 16.3.6).

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

## Known limitations (by design)

- **Neon credentials pending founder rotation** (sandbox-reset incident, SECURITY_AUDIT §9):
  the sandbox lost the only copy of the pooled/direct URLs; the app here runs QA against a
  local embedded Postgres 18 (`scripts/qa-local-pg.mjs`, port 54329, /tmp data dir — dev/QA
  only, never a runtime fallback). When the founder delivers ROTATED strings into `.env.local`
  (`DATABASE_URL` pooled + `DIRECT_URL` direct), the re-verification chain is:
  `db:status` → `db:migrate:deploy` (expect "up to date") → `node scripts/verify-neon-constraints.mjs`
  (41/41) → `db:seed` ×2 → restart → spot-check home For You + profile streak against Neon data.
- Brand mark + favicon are the ب letter-mark — official standing brand per FD-11
  (founder dropped the rabbit-logo delivery on 2026-09-28). If the founder ever
  reopens it, one command completes the swap:

  ```bash
  node scripts/integrate-logo.mjs /path/to/logo-image
  ```

  It generates `src/app/icon.png` + `src/app/favicon.ico` (16/32/48) +
  `src/app/apple-icon.png` + `src/assets/brand/logo.png`, removes the placeholder
  `icon.svg`, and rewrites `src/components/library/brand-mark.tsx` (single swap point —
  header/login/admin consumers update automatically). `--cover` switches from
  letterbox-fit to crop-fill; `--test` runs the pipeline self-test without touching
  app files.
- CSP residual: `style-src 'unsafe-inline'` (Next.js inline critical CSS + Radix style attrs) — scripts are strictly nonce-gated (see `docs/SECURITY_AUDIT.md` §8.1). Sign-in POST + Server Action E2E under strict CSP pending DB credential restoration (§9).
- Monitoring is placeholder-only by design (no external calls) — activation notes in
  `src/lib/analytics.ts`.
- Source-document reconciliation stays post-hoc (FD-10).

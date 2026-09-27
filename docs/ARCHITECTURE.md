# Bunny Library — Architecture (Phase 0 Output)

Target architecture for the prototype (Phases 1–5), aligned with verified findings T1–T10 in `DISCOVERY_REPORT.md` and decisions D-10…D-23 in `DECISIONS.md`.

---

## 1. Proposed Stack

| Layer | Choice | Version pin | Why |
|---|---|---|---|
| Framework | Next.js App Router | 16.x stable (Turbopack default) | T1: stable since Oct 2025; Server Actions = mutation path |
| Language | TypeScript (strict) | 5.x | Type-safe data layer via Supabase codegen |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui + Lucide icons | latest | T5; RTL-hardened primitives (see §8) |
| Motion | Framer Motion | 11.x/12.x | Brief: subtle, purposeful only |
| Data | Supabase (Postgres 15+, Auth, Storage) | latest | T2–T4; RLS-first security |
| Client SDK | `@supabase/ssr` + `@supabase/supabase-js` | latest | Cookie sessions for App Router |
| Fonts | `next/font/google`: IBM Plex Sans Arabic (primary), Cairo (fallback) | — | T6, D-15 |
| Validation | Zod | 3.x | Server Action input validation |
| Deployment | Vercel (web) + Supabase cloud (data) | — | T10, D-20 |
| Monitoring | Sentry-ready error boundaries + `lib/analytics` stub (PostHog later) | — | D-18/D-19 |

## 2. Application Architecture

```
┌──────────────────────────────  Browser (ar, dir=rtl)  ─────────────────────────────┐
│  Route groups:                                                                     │
│   (public)  /  /explore  /series/[slug]  /login                                    │
│   (readers) /read/manga|webtoon|novel/[series]/[chapter]                           │
│   (account) /library  /updates  /profile                                           │
│   (admin)   /admin/*  (sidebar layout, role-guarded)                               │
│  Client components: reader controls, search, filters, dialogs, charts              │
│  Guest progress → localStorage · Auth progress → Server Actions                    │
└──────────────┬─────────────────────────────────────────────────────┬───────────────┘
               │ RSC fetch (server components)                        │ Server Actions
┌──────────────▼─────────────────────────────────────────────────────▼───────────────┐
│  Next.js server (Vercel)                                                           │
│   lib/queries/*     read helpers (public: published-only; admin: role-checked)     │
│   lib/actions/*     'use server' mutations (zod-validated, auth-checked)           │
│   lib/auth.ts       session helpers, requireRole('admin'|'editor')                 │
│   middleware.ts     /admin gate + /account routes + session refresh                │
│   lib/analytics.ts  event stub → analytics_events (PostHog drop-in later)          │
└──────────────┬─────────────────────────────────────────────────────┬───────────────┘
               │ anon key (RLS enforced)               service-role (seed/admin-cron only)
┌──────────────▼───────────────────┐        ┌───────────────────▼────────────────────┐
│  Supabase Auth (users)           │        │  Supabase Storage (S3 + smart CDN)     │
│  Postgres + RLS:                 │        │   covers/ (public, transformed)        │
│   profiles, user_roles, series,  │        │   pages/{series}/{ch}/{n}.webp         │
│   chapters, chapter_pages,       │        │   panels/{series}/{ch}/{n}.webp        │
│   user_library, reading_progress,│        └────────────────────────────────────────┘
│   reviews, comments,             │
│   comment_reports,               │   Seed pipeline: supabase/seed/* → upserts
│   editorial_collections,         │   (idempotent, generates abstract art assets)
│   collection_series,             │
│   analytics_events               │
└──────────────────────────────────┘
```

**Request flows (key ones):**
- **Continue Reading (home):** server component reads `reading_progress` for session user → joins series/chapters → hero card; guest reads `localStorage` mirror via a client hydration component.
- **Publish chapter (admin):** editor sets workflow `published` (+ optional `published_at` scheduler) → Server Action validates role → write → `revalidatePath('/series/[slug]')`, `/updates`, home → Updates feed query picks it up for followers (RLS-safe).
- **Comment moderation:** reader reports comment → `comment_reports` row → admin queue (join comments+series+chapter) → action updates `comments.status` → public queries filter `status='approved'` (RLS) → revalidate.

## 3. Database Entities & Relationships

```
profiles 1──1 auth.users           user_roles n──1 profiles (role: reader|editor|admin)
series 1──n chapters 1──n chapter_pages            series n──n editorial_collections (collection_series)
series 1──n comments ; chapters 1──n comments      comments 1──n comment_reports
profiles 1──n user_library (status: reading|completed|saved)   user_library n──1 series
profiles 1──n reading_progress n──1 chapters (position, percent, updated_at)
profiles 1──n reviews n──1 series (rating 1..5 + text)
chapters carry: number, title, workflow (draft|review|published), published_at, is_premium_demo, page_count
analytics_events (type, series_id?, chapter_id?, profile_id?, created_at, meta jsonb)
```

**Table sketches (prototype-level):**

| Table | Key columns (beyond id/created_at) | Notes |
|---|---|---|
| `profiles` | `auth_user_id fk`, `nickname`, `avatar_url`, `bio`, `favorite_genres text[]`, `role` (denormalized mirror for queries) | Trigger syncs from `auth.users` on signup |
| `user_roles` | `profile_id`, `role`, `granted_by`, `granted_at` | Source of truth for JWT claim + audit |
| `series` | `slug unique`, `title_ar`, `title_original`, `synopsis_ar`, `format` (manga\|webtoon\|novel), `status` (ongoing\|completed\|hiatus), `genres text[]`, `tags text[]`, `author`, `translator`, `cover_path`, `rating_avg`, `rating_count`, `is_featured`, `download_allowed bool default false` *(reserved for Production-Preparation, always false in prototype)* | |
| `chapters` | `series_id fk`, `number`, `title_ar`, `workflow`, `published_at`, `is_premium_demo bool`, `reading_direction` (rtl\|ltr, manga only), `word_count` (novel) | Unique `(series_id, number)` |
| `chapter_pages` | `chapter_id fk`, `page_index`, `storage_path`, `width`, `height` | manga/webtoon only |
| `novel_content` *(or `chapters.content_ar`)* | `chapter_id fk`, `body_ar text` | Rich text stored as sanitized markdown/JSON |
| `user_library` | `profile_id`, `series_id`, `status`, `added_at` | Unique `(profile_id, series_id)` |
| `reading_progress` | `profile_id`, `chapter_id`, `series_id`, `page_index`, `percent`, `updated_at` | Unique `(profile_id, chapter_id)` |
| `reviews` | `profile_id`, `series_id`, `rating`, `body_ar` | Unique `(profile_id, series_id)` |
| `comments` | `profile_id`, `series_id nullable`, `chapter_id nullable`, `body_ar`, `status` (pending\|approved\|hidden), `is_reported bool` | One of series/chapter |
| `comment_reports` | `comment_id`, `reporter_id`, `reason`, `created_at` | |
| `editorial_collections` | `slug`, `title_ar`, `description_ar`, `theme`, `display_order`, `is_featured` | |
| `collection_series` | `collection_id`, `series_id`, `position` | |
| `analytics_events` | `type`, `series_id`, `chapter_id`, `profile_id`, `meta jsonb` | Seeded 90 days for dashboard |

## 4. Authentication & Role Model

- **Sessions:** `@supabase/ssr` cookie-based; middleware refreshes tokens and gates `/admin` + account routes (cheap redirect layer only).
- **Roles:** `reader | editor | admin` in `user_roles`; helper SQL functions `has_role(profile_id, role)` / `is_admin()`; role resolved server-side per request (and mirrored on `profiles.role` for cheap joins).
- **Three-layer admin protection (D-12):** middleware redirect → admin layout server guard (`requireRole`) → RLS policies deny non-admin writes at DB level even if UI is bypassed.
- **Demo accounts:** seeded admin/editor/reader with documented credentials (README), passwords set via Supabase admin API in seed.

## 5. RLS Policy Matrix (summary — full SQL in Phase 1)

| Table | anon (SELECT) | reader | editor | admin |
|---|---|---|---|---|
| series / chapters / chapter_pages | `workflow='published'` (and series not hidden) | same | full CRUD | full CRUD |
| novel content | via published chapter | same | full CRUD | full CRUD |
| user_library / reading_progress | none | own rows CRUD (`(select auth.uid()) = profile_id`) | own rows | own rows |
| reviews | SELECT approved-context (published series) | own CRUD | read all | read all |
| comments | SELECT `status='approved'` | INSERT own (→pending), SELECT/UPDATE/DELETE own; report others | + moderation updates | all |
| comment_reports | none | INSERT own | SELECT all | DELETE all |
| collections / collection_series | SELECT (visible) | — | CRUD | CRUD |
| profiles | SELECT public fields only (nickname/avatar) | UPDATE own profile | read | all (incl. roles) |
| user_roles | none | none | read | CRUD |
| analytics_events | none | INSERT own events | read | read |

- Project setting: **"enable RLS on new tables" = ON** (T2). Policies use `(select auth.uid())` for stability and performance. Every table gets RLS even if policies deny-all by default (T2 note: RLS with no policy = denied, not open).

## 6. Storage Model

- **Buckets:** `covers` (public read; RLS-guarded admin writes; CDN transforms for 320/480/640px thumbnails), `pages` (public read; path-scoped; admin writes), `panels` (same), `avatars` (public read; owner write via policy).
- **Path grammar:** `{bucket}/{series_slug}/{chapter_number}/{padded_index}.webp`; covers: `covers/{series_slug}/cover.webp` (+ `-thumb` transform, not separate file).
- **Prototype assets:** generated abstract SVG→PNG art at seed time (per D-05/S-04); deterministic palettes per series so art feels "collectible" not random.
- **Access control:** public buckets use CDN cache with `Cache-Control: immutable` per path version; admin upload path in Phase 4 validates type/size and reuses the same grammar (no ad-hoc paths).

## 7. Security Approach

1. **Secrets:** server-only env (`SUPABASE_SERVICE_ROLE_KEY`, `SEED_ADMIN_PASSWORD`) never prefixed `NEXT_PUBLIC_`; `server-only` package guard on privileged modules; `.env.example` documents every var (T7). Vercel env settings per environment.
2. **Input validation:** every Server Action parses input with Zod; comment/report bodies length-limited and sanitized to plain text.
3. **Authorization:** D-12 three layers; editor/admin Server Actions re-check role server-side on every call (never trust client context).
4. **Headers:** `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`, basic CSP (self + Supabase domain + Vercel analytics none) — defined in `next.config.ts`.
5. **Rate limiting:** deferred (Production-Preparation) — noted with recommended edge limiter for auth/comment endpoints.
6. **Data minimization:** no real user data; demo profiles are fictional; analytics events reference demo ids only.
7. **Content safety:** moderation queue + statuses; seed content reviewed against the "no real franchises" checklist (Phase 5 gate #17–18).

## 8. RTL & Typography Plan (the premium layer)

- `<html lang="ar" dir="rtl">`; Tailwind logical properties everywhere (`ms-*, me-*, ps-*, pe-*, start/end`) — zero physical `left/right` utilities in app code.
- shadcn/ui RTL hardening: components audited for mirrored chevrons/arrows/progress direction; icon-level `rtl:rotate-180` utilities where Lucide glyphs are directional.
- Typography tokens (D-15): IBM Plex Sans Arabic 400/500/600/700; body 16–18px, line-height 1.7–1.85; headings weight-based hierarchy; `letter-spacing: 0` on all Arabic; Western digits in stat contexts, Arabic-Indic allowed in prose (OQ-4).
- Readers: manga paged mode respects per-series `reading_direction` toggle; webtoon = vertical; novel = RTL text with theme switching (dark/light/sepia) and font-size scale (4 steps, persisted).

## 9. Deployment Approach

- **Vercel project** ↔ GitHub repo; preview deploys per branch; `main` = demo.
- **Environments:** `main` (Vercel prod ↔ Supabase demo project) + PR previews (read-only usage of same demo DB is avoided → previews use seed-once Supabase branch or skip DB by falling back to public pages; final call in Phase 1 given free-tier constraints).
- **Seed pipeline:** `npm run db:types` (codegen) + `npm run db:seed` (idempotent upsert; generates media assets). Supabase SQL migrations tracked in `supabase/migrations/`.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server), `SEED_ADMIN_EMAIL/PASSWORD` (CI/seed only).
- **Cost posture:** free tiers only (T4 ceilings acceptable: ~500MB DB, ~1GB storage — generated art is small, webp).

## 10. Testing Plan

**Layer 1 — Static & unit (Phase 1+ continuous)**
- `tsc --strict`, ESLint (next/core-web-vitals + rtl rules custom), zod schema unit tests for actions.
- Seed integrity test: 12 series, per-format counts, chapter workflow distribution, comment status distribution, referential integrity (CI-runnable against a throwaway Supabase project).

**Layer 2 — Integration / data (Phase 2–4)**
- RLS verification script (`scripts/test-rls.ts`): anon client cannot read drafts; reader can only mutate own rows; editor cannot touch `user_roles`; admin can — asserts the §5 matrix programmatically.
- Server Action tests: library add/remove, progress upsert, publish revalidation, moderation transitions.

**Layer 3 — E2E happy paths (Phase 5, Playwright)**
1. Guest browse → manga/webtoon/novel read → resume.
2. Reader login → library add → updates feed shows seeded chapter → mark read.
3. Reader comment + report → editor moderates → visibility flips.
4. Editor creates series + chapter → publishes → visible publicly.
5. Admin role-gate: reader hitting `/admin` redirected; editor blocked from `/admin/users`.

**Layer 4 — Manual QA matrix (Phase 5)**
- Viewports 360/768/1280; iOS Safari + Android Chrome + desktop Chrome/Firefox.
- RTL audit checklist (mirroring, arrows, numerals, punctuation bidi).
- Reader controls matrix per format (direction toggle, immersive, font size, themes).
- Empty/error/404 states; console-error sweep; Lighthouse budgets (scope §6.15); accessibility pass (focus, labels, contrast).

**Rollback/recoverability:** idempotent seed = demo DB restorable in one command; migrations reversible via Supabase branch testing before apply.

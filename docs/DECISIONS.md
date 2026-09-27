# Bunny Library — Decision Log (Phase 0)

Every key product/technical decision made at the discovery gate, with rationale, rejected alternatives, and escalation status. Decisions are frozen for Phase 1–5; changing any `⚠️ human-approval` decision requires its named approver.

**Sources used:** `DISCOVERY_REPORT.md` (verified findings M1–M8, C1–C8, L1–L4, T1–T10), the Phase 0 task brief, and — where marked — flagged gaps in the missing source documents.

---

## A. Product Decisions

### D-01 — Product concept: "reader-first personal Arabic library" ✅ adopted
- **Decision:** Home hierarchy = Continue Reading → updates from followed library → personalized discovery → browse catalog. Reader-first is the core product bet.
- **Rationale:** DISCOVERY §6 — licensed incumbents (Manga Arabia, MangaOasis, MANGA MILLION) now own the catalog-first slot; no verified Arabic player leads with library continuity. The brief's differentiation thesis survives the market check.
- **Rejected alternatives:** (a) catalog-first like Azora — outgunned on content supply, indistinguishable from aggregators; (b) editorial-magazine-first — attractive but weaker retention loop, no continuity hook.
- **Risk if wrong:** retention hypothesis unproven (⚠️ UQ-4 in DISCOVERY §5). Mitigation: prototype instruments the loop; admin dashboard shows library/follow behavior via seeded analytics.

### D-02 — Arabic-native RTL-first experience ✅ adopted
- **Decision:** `<html lang="ar" dir="rtl">` by default; all UI copy in Arabic written natively (not translated); numerals handled deliberately (Arabic-Indic optional per context, Western digits for stats); `letter-spacing: 0` on Arabic text (T6).
- **Rationale:** T6 typography evidence; aggregator field is noisy/unprofessional (C7) — Arabic-native quality is a differentiation axis, not a checkbox.
- **Rejected alternative:** i18n scaffolding (next-intl) with an English toggle — adds abstraction with zero prototype value; single-locale is the honest scope. Revisit if a real launch requires bilingual UI.

### D-03 — Dark-mode-first, single calibrated theme ✅ adopted
- **Decision:** Midnight-library dark theme as the only theme for the app shell; the **novel reader** additionally offers light/sepia themes (explicit brief requirement for reading comfort). Palette locked to the brief's tokens (#0B0B10 base, #9B7BFF violet, #DDBB77 gold, …).
- **Rationale:** Brief's visual direction + "calm, cinematic, collectible" positioning; avoids the cost of theming 40+ screens twice.
- **Rejected alternatives:** full light/dark system toggle app-wide (deferred to Production-Preparation); neon cyberpunk variants (explicitly against brand mood).

### D-04 — Three target markets stay Saudi / UAE / Egypt (narrative only) ✅ adopted with caveat
- **Rationale:** DISCOVERY §3.3 — Saudi anchor verified (C2, C3, M4); UAE/Egypt plausible; no hard-coded country features in the prototype. Currency/language artifacts (e.g., pricing) are avoided entirely because payments don't exist in the prototype (D-09).
- **Caveat:** relative ROI per market unverified (⚠️ DISCOVERY §4.9).

### D-05 — Prototype uses 100% fictional content ✅ adopted (non-negotiable)
- **Decision:** 12 original fictional series (4 manga / 4 webtoon / 4 novels), original Arabic synopses and chapter text, generated abstract cover/panel art, fictional author & translator names, believable Arabic community comments.
- **Rationale:** L1–L3 — translation/distribution are economic rights of authors in all three jurisdictions; hosting anything real creates infringement risk that a prototype cannot justify. Also DISCOVERY §7.
- **Rejected alternative:** using public-domain Japanese classics — rejected: translation/public-domain status in Arabic is itself a legal question (lawyer gate), and brand-adjacent confusion risk.

### D-06 — No "licensed/official" claims; visible demo disclosure ✅ adopted
- Footer demo-content notice; admin UI labels content as demo seed. Protects against the C6/C7 credibility trap and against implied licensing (L1–L3).

### D-07 — Monetization is mocked, not built ✅ adopted
- **Decision:** Locked premium chapters render a "قريبًا — قفل العرض التجريبي" state; no pricing page, no checkout, no subscription claims; "unlimited offline downloads" appears nowhere in UI.
- **Rationale:** M7 (paid adoption lags in Arabic webtoons) + L1–L3 (licensing-gated features). Payments before licensing is a fake promise; downloads before licensing is legal exposure.
- **Rejected alternatives:** fake checkout flow (creates false claims risk); paywall toggle in admin (invites the "does billing work?" question in demos).

### D-08 — Editorial collections are a first-class surface ✅ adopted
- 2 seeded collections, homepage feature, admin CRUD. Rationale: cheap to build, high "calm editorial" brand payoff, exercises the collection_series data model the real product would need.

## B. Technical Decisions

### D-10 — Next.js 16 App Router + TypeScript + Tailwind CSS v4 + shadcn/ui ✅ adopted
- **Rationale:** T1 (Next 16 stable since Oct 2025, Turbopack default), T5 (Tailwind v4 CSS-first works with shadcn/ui on App Router), React 19, Server Actions as the mutation path (T1). TypeScript strict mode on.
- **Rejected alternatives:** Pages Router (legacy); Vite+React SPA (no SSR/SEO for a content product); Astro (great for content sites, weaker fit for a stateful reader app with realtime-ish library UX).
- **Version pin:** `next@16.x` latest stable at install time; React 19; Tailwind v4.x.

### D-11 — Supabase for Auth + Postgres + Storage + RLS ✅ adopted
- **Rationale:** T2–T4: RLS-first security model matches the multi-role requirement; Storage S3-backed with smart CDN + image transformations for covers/panels (T3); free tier sufficient for prototype (T4); brief mandates it.
- **Pattern:** `@supabase/ssr` package for App Router (cookie-based sessions, middleware refresh); service-role key used **only** in server-side seed/admin code paths, never imported client-side (T7).
- **Rejected alternatives:** custom JWT + separate Postgres (months of undifferentiated work); Prisma on top of Supabase DB (adds migration/typing layer that duplicates what `supabase gen types` already gives).

### D-12 — Role model: `profiles` + `user_roles` with role in JWT custom claim ✅ adopted
- **Decision:** Three roles — `reader`, `editor`, `admin`. Role stored in `user_roles` table and mirrored into the auth JWT via a Postgres function + custom access-token hook (or checked via `profiles.role` join server-side); admin surface checks role in **three layers**: middleware → layout guard → RLS policies. `is_admin()` / `has_role()` SQL helpers used in all policies.
- **Rationale:** T2 (avoid over-broad `authenticated` grants; explicit admin policies); defense-in-depth against the "unsafe admin access" non-negotiable. Demo accounts seeded: 1 admin, 1 editor (for workflow demo), 1 reader.
- **Rejected alternatives:** Supabase Dashboard-based "admins" list (no audit trail); email-domain-based role inference (fragile, fake-authority).

### D-13 — Data access: Server Actions + typed query helpers; no REST layer ✅ adopted
- **Decision:** Mutations via Server Actions (`'use server'`) with `revalidatePath`; reads via server components + a thin `lib/queries` layer; client components only for interactivity (reader controls, search input, filters).
- **Rationale:** T1 — Server Actions are the App Router's replacement for API routes; fewer endpoints = smaller attack surface; matches "clean, modular, avoid unnecessary abstraction".
- **Rejected alternative:** full REST/`/api/*` facade for everything (needed only if a mobile client arrives — Production-Preparation).

### D-14 — Storage model: Supabase Storage buckets with deterministic paths ✅ adopted
- **Decision:** `covers/` (public bucket, transformed via CDN for thumbnails), `pages/` (manga pages), `panels/` (webtoon vertical strips), `novel-covers/`. Path convention `{bucket}/{series_slug}/{chapter}/{n}.webp`. Prototype serves generated abstract art; uploads from admin UI work against the same buckets.
- **Rationale:** T3 — one storage system, RLS-controlled access, CDN transforms eliminate an image-processing dependency.
- **Rejected alternatives:** Cloudinary/imgix (extra vendor + key management); local filesystem (non-portable to Vercel).

### D-15 — Arabic typography: IBM Plex Sans Arabic primary + Cairo fallback stack ✅ adopted
- **Decision:** `font-family: "IBM Plex Sans Arabic", "Cairo", system-ui, sans-serif` via `next/font/google` (self-hosted subset); body line-height ≥1.7; letter-spacing 0 for Arabic; display sizes tuned for Kufi-like headings feel using weights (600/700) rather than a second decorative font.
- **Rationale:** T6 — screen-optimized Naskh-style fonts, open license, legibility-first mandate in the brief.
- **Rejected alternatives:** Noto Kufi Arabic for body (Kufi reads as display, fatigues at body sizes); Tajawal primary (weaker weight range for editorial hierarchy).

### D-16 — Reading progress & library state ✅ adopted (hybrid persistence)
- **Decision:** Authenticated state persists to Postgres (`reading_progress`, `user_library`) via Server Actions; guest sessions keep progress in `localStorage` and offer "login to sync" prompt. Updates feed derives from `user_library` joins on `chapters.published_at`.
- **Rationale:** Demo must survive both logged-out browsing and logged-in continuity; DB-backed pattern is the one that survives to production.

### D-17 — Admin panel: separate route group with its own layout, sidebar, and 7 screens ✅ adopted
- Screens: dashboard, series list, series detail, chapters manager (workflow draft→review→published + scheduler UI), community moderation, collections, users. Admin mutations visibly affect public pages via revalidation. Rationale: brief requirement; D-12 layered protection.

### D-18 — Analytics: seeded `analytics_events` dashboard now; real PostHog deferred ✅ adopted
- **Decision:** Admin charts render from seeded events/metrics; a `lib/analytics` stub interface exists so PostHog can drop in later. No third-party scripts in the prototype bundle.
- **Rationale:** T9 (PostHog official path verified) but zero-dependency demo beats a half-wired vendor; privacy-first default (per PostHog guidance) noted for production.
- **Rejected alternative:** shipping real PostHog keys in the prototype (needs a real project + consent banner — pure overhead for a demo).

### D-19 — Error tracking: Sentry architecturally anticipated, not wired ✅ adopted
- `@sentry/nextjs` v11 path verified (T8); prototype ships structured error boundaries + local logging instead. Adding Sentry later is a config-only task. (Rationale: demo environments don't need a DSN; avoid noise.)

### D-20 — Deployment: Vercel + Supabase (hosted) ✅ adopted
- **Rationale:** T10 mainstream pairing; env-var discipline per T7 (server-only secrets, `NEXT_PUBLIC_` only for Supabase anon URL/key which are designed to be public). Preview deployments per branch; seed script idempotent (`scripts/seed.ts`).
- **Rejected alternatives:** Docker/VPS (ops burden, zero demo value); Netlify (weaker Next 16 alignment).

### D-21 — Seeding strategy: idempotent TypeScript seed with deterministic content ✅ adopted
- **Decision:** `supabase/seed/` = content definitions (series, chapters, pages/panels text, comments, collections, users, analytics) applied by one script; safe to re-run (upserts by slug/email). Demo chapter media generated as SVG→PNG abstract art at seed time where needed.
- **Rationale:** The admin panel must visibly mutate a stable dataset; re-runnable seeds make QA repeatable (Phase 5) and demos recoverable.

### D-22 — Route map & URL grammar ✅ adopted
- Public: `/`, `/explore`, `/series/[slug]`, `/library`, `/updates`, `/profile`, `/login`; readers: `/read/manga/[series]/[chapter]`, `/read/webtoon/[series]/[chapter]`, `/read/novel/[series]/[chapter]`; admin: `/admin`, `/admin/series`, `/admin/series/[id]`, `/admin/chapters`, `/admin/community`, `/admin/collections`, `/admin/users`. Details in `PROTOTYPE_SCOPE.md`.

### D-23 — Comments & moderation model ✅ adopted
- **Decision:** Comments attach to series and chapters; statuses `pending | approved | hidden`; reports table feeds the moderation queue; readers see approved only (RLS); authors see own regardless. 20+ realistic seeded Arabic comments across series/chapters including some `pending`/`reported` rows so the admin queue demos meaningfully.

## C. Open Questions (carried, not blocking Phase 1)

| # | Question | Owner | Gate |
|---|---|---|---|
| OQ-1 | Do the real PRD/strategy docs change any decision above? | Product lead | **Phase 2 sign-off** |
| OQ-2 | Genre mix for the 12 demo series (initial: fantasy×2, romance×2, mystery×2, historical, sci-fi, action, slice-of-life, drama×2) | Product lead | Phase 1 seed authoring |
| OQ-3 | Should the reader keep dual RTL/LTR toggle for manga even though all demo content is fictional? (recommended: yes — brief requires the control) | Product lead | Phase 3 |
| OQ-4 | Arabic-Indic vs Western numerals per surface | Product lead | Phase 2 QA |
| OQ-5 | PostHog/Sentry project creation for post-demo usage | Eng lead | Production-Preparation |

## D. Decisions Requiring Human Approval Later ⚠️

1. **Any real-content licensing engagement** (translation/distribution/territory rights) — requires qualified IP lawyer + rights specialist. Blocks any move from fictional to real catalog.
2. **Monetization model & pricing** (subscription vs. coins vs. ads) — requires business approval + payment-rail research (Mada/STC Pay/Fawry) + licensing posture.
3. **Offline downloads policy** (DRM-ish constraints, per-title licensing limits) — lawyer + business.
4. **Privacy/compliance pack** (PDPL Saudi, takedown/DMCA policy, ToS) — lawyer.
5. **Real-user data collection** (analytics consent, email verification, age gates) — legal + product.
6. **Brand assets finalization** (logo, wordmark, mascot policy) — design lead sign-off.
7. **Go-live on a public domain with marketing claims** — product + legal.

## E. Assumption Challenge Record (PRD-family assumptions rejected or capped)

| PRD-family assumption | Verdict | Basis |
|---|---|---|
| "Unlimited offline downloads" as a differentiator | **Rejected for prototype** (D-07) | Licensing-gated (L1–L3); zero verified evidence Arabic users will pay for it |
| Early-access / premium chapter tiers | **Capped** to visual locked state | Monetization unproven (M7) |
| Catalog breadth as headline | **Rejected** (D-01) | Incumbents own it (C1–C5) |
| "First Arabic platform of its kind" style claims | **Rejected** (D-06) | Factually false post-2025 |
| Reader-first personal library IA | **Validated as open space** (D-01) | DISCOVERY §6 — adopted as the core bet |
| Saudi/UAE/Egypt target trio | **Adopted with caveat** (D-04) | Saudi verified, others plausible |

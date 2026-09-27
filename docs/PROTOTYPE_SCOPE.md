# Bunny Library — Prototype Scope (Phase 0 Output)

This document is the single source of truth for what gets built in Phases 1–5. It converts the full PRD vision into **Prototype Now / Production-Preparation / Explicitly Deferred** levels. If a feature is not in "Prototype Now", it does not get built in this iteration — no exceptions without a logged decision in `DECISIONS.md`.

---

## 1. Scope Levels

### 1.1 Prototype Now (built, functional, demo-ready)

**Public experience**
| # | Feature | Notes |
|---|---|---|
| P-01 | Home `/` with reader-first hierarchy | Continue Reading hero (progress %, last chapter, resume CTA) → تحديثات مكتبتك → editorial collections → trending → newly added → genre browse → mobile bottom nav |
| P-02 | Explore `/explore` | Arabic instant search, filters (format/genre/status), sort (popular/newest/top-rated), compact rich cards, Arabic empty & no-results states |
| P-03 | Series detail `/series/[slug]` | Original cover, Arabic + optional original title, meta (format/genres/status/rating/author/translator), Arabic synopsis, CTA (ابدأ القراءة/تابع القراءة/أضف إلى مكتبتي), chapter list with read/unread + locked-demo styling, reviews & ratings, related series, real-feeling Arabic comments |
| P-04 | Manga reader `/read/manga/[series]/[chapter]` | RTL/LTR toggle, paged navigation, progress indicator, immersive mode, original abstract panel images, chapter comments |
| P-05 | Webtoon reader `/read/webtoon/[series]/[chapter]` | Vertical continuous scroll, chapter progress, immersive mode, original panels, comments |
| P-06 | Novel reader `/read/novel/[series]/[chapter]` | Clean RTL text reader, font-size controls, dark/light/sepia themes, progress, original Arabic sample chapter, comments |
| P-07 | Library `/library` | Tabs: تقرأ الآن / محدّث / مكتمل / محفوظ لاحقًا, progress bars, unread badges, Arabic empty states |
| P-08 | Updates `/updates` | Chronological new-chapter feed for followed series, mark-all-read, unread clearing |
| P-09 | Profile `/profile` | Avatar/nickname, reading stats, favorite genres, saved titles, activity, simple settings UI |
| P-10 | Auth `/login` | Email+password demo login + signup; guest browsing allowed; login-to-sync prompt for guest progress |
| P-11 | Global search access | From top nav; lands on explore with query |
| P-12 | Mobile bottom navigation | المكتبة / الرئيسية / استكشف / التحديثات / حسابي |
| P-13 | Demo disclosure | Footer + series pages: "منصة تجريبية — محتوى خيالي لأغراض العرض" |

**Admin panel** (`/admin`, protected by middleware + layout guard + RLS)
| # | Feature | Notes |
|---|---|---|
| A-01 | Dashboard `/admin` | Metric cards (readers, reads, active series, comments), recent activity, top series, content status overview, seeded charts |
| A-02 | Series list `/admin/series` | Searchable table, format/status filters, create/edit, preview-public-page action |
| A-03 | Series detail `/admin/series/[id]` | Full metadata editor, chapters management, publish/unpublish, reading stats, recent comments |
| A-04 | Chapters `/admin/chapters` | Table across types (manga/webtoon/novel), workflow draft→review→published, scheduling UI, type-appropriate content editor (page URLs / panel URLs / Arabic rich text), create/edit flow |
| A-05 | Community `/admin/community` | Moderation queue, filters (reported/pending/approved/hidden), approve/hide/delete, series+chapter context |
| A-06 | Collections `/admin/collections` | CRUD (title, description, visual theme, series selection, display order), feature-on-homepage toggle |
| A-07 | Users `/admin/users` | List, roles (reader/editor/admin), basic activity + library info, no sensitive data |

**Platform**
| # | Feature |
|---|---|
| S-01 | Supabase schema: profiles, user_roles, series, chapters, chapter_pages, user_library, reading_progress, reviews, comments, comment_reports, editorial_collections, collection_series, analytics_events |
| S-02 | RLS: public read of published content; owner-only writes for library/progress/comments; editor/admin content management; admin surface locked to admin role |
| S-03 | Idempotent seed: 12 fictional series (4 manga / 4 webtoon / 4 novels), 3–6 chapters each for featured titles, 20+ Arabic comments/reviews, 2 collections, demo accounts (admin + editor + reader), seeded analytics |
| S-04 | Original generated cover/panel art (abstract, non-infringing) |
| S-05 | Design system: tokens, RTL typography (IBM Plex Sans Arabic), dark-first theme, Framer Motion micro-interactions |

### 1.2 Production-Preparation (architecturally anticipated, not built)
- Real analytics wiring (PostHog per T9) behind the `lib/analytics` stub; Sentry SDK integration (T8) behind error-boundary structure.
- Payment/subscription layer + entitlement service (blocked by D-07 lawyer gate).
- Offline downloads (requires per-title licensing flags in schema; a nullable `download_allowed` column concept is noted in `ARCHITECTURE.md` §3 but not implemented).
- Email verification, password reset, rate limiting, CAPTCHA on auth.
- REST/tRPC API surface for a future mobile app; push notifications; RSS-style update webhooks.
- Full-text Arabic search (Postgres `tsvector` with Arabic config) — prototype uses ILIKE/trigram-level search.
- Content translation workflow (draft chapters in source language → translation queue).
- Image CDN hardening, blurhash placeholders, responsive variants automation.
- Consent banner, PDPL/ToS/DMCA demo-template finalization (lawyer).

### 1.3 Explicitly Deferred (do not build)
- **Real/licensed content of any kind** (incl. public-domain translations) — legal gate.
- **Payments, checkout, invoices, subscription trials** — fake claims risk.
- **Downloadable/offline files** — legal + scope.
- **AI recommendations/ML personalization** — needs real usage data; prototype uses rule-based "popular/newest/in-genre".
- **Social features beyond comments** (follows between users, DMs, forums) — moderation surface area grows non-linearly.
- **Creator/author upload portal** — a full product on its own.
- **Multi-language UI (English toggle)** — D-02.
- **Mobile apps (React Native/Expo)** — web prototype first.
- **Realtime collaboration/live reading rooms** — novelty, high complexity.
- **Ad slot system** — contradicts "calm, not noisy" brand and aggregator positioning.

## 2. User Roles

| Role | Can do | Sees |
|---|---|---|
| **Guest** (not signed in) | Browse everything public, read free chapters, search, progress saved in localStorage | Published content; login prompts for library actions |
| **Reader** | Guest abilities + persistent library, reading progress sync, ratings/reviews, comments, report comments | Own library/progress/draft-none; approved comments |
| **Editor** | Reader abilities + admin access to series/chapters/collections/community per RLS; workflow draft→review→published | Content management; no user-role management |
| **Admin** | Editor abilities + users/roles screen, full metrics, all moderation actions | Everything |

## 3. Routes

| Route | Type | Access |
|---|---|---|
| `/` | Home | public |
| `/explore` (+ `?q=&format=&genre=&status=&sort=`) | Explore | public |
| `/series/[slug]` | Series detail | public (published) |
| `/read/manga/[seriesSlug]/[chapterNumber]` | Manga reader | public (published) |
| `/read/webtoon/[seriesSlug]/[chapterNumber]` | Webtoon reader | public (published) |
| `/read/novel/[seriesSlug]/[chapterNumber]` | Novel reader | public (published) |
| `/library` | Personal library | auth (guest = empty state + CTA) |
| `/updates` | Updates feed | auth (guest = CTA) |
| `/profile` | Profile & settings | auth |
| `/login` | Auth | public |
| `/admin` | Dashboard | admin (+editor partials per screen) |
| `/admin/series`, `/admin/series/[id]` | Series mgmt | editor/admin |
| `/admin/chapters` | Chapter mgmt | editor/admin |
| `/admin/community` | Moderation | editor/admin (delete = admin) |
| `/admin/collections` | Collections | editor/admin |
| `/admin/users` | Users & roles | admin only |
| `not-found` / `error` | Arabic 404/error states | public |

## 4. Demo Data Requirements

- **Series (12):** 4 manga, 4 webtoon/manhwa, 4 novels/light-novels. Genre spread: fantasy×2, romance×2, mystery×2, historical×2, sci-fi×1, action×1, slice-of-life×1, drama×1. Statuses mixed (مستمر/مكتمل/متوقف). One series showcases a "soon/premium-locked" chapter state. Original Arabic titles + optional "original title" field, authors, translators, believable synopses (80–150 Arabic words each), tags.
- **Chapters:** 3–6 for featured titles (≥2 featured per format), 1–3 for others; mixed workflow states (mostly published + a few draft/review + one scheduled) so admin workflow demos live.
- **Chapter content:** manga = 8–14 abstract generated page images; webtoon = 1 vertical strip or 5–8 stacked panels; novel = 900–1,400 Arabic words of original prose per chapter (2+ full chapters for the flagship novel).
- **Community:** 20+ Arabic comments/reviews across series & chapters with natural dialectal-but-clean tone; ≥3 pending, ≥2 reported, ≥1 hidden to exercise moderation.
- **Collections (2):** e.g., "مغامرات ما بعد منتصف الليل" (fantasy/action) and "قلوب على ورق" (romance/slice-of-life); one featured on home.
- **Users:** demo admin, demo editor, demo reader (credentials in README; seeded via `.env`-driven seed script, passwords hashed by Supabase auth admin API).
- **Analytics:** ~90 days of synthetic `analytics_events` (reads by day, new readers, top series) to feed dashboard charts realistically.

## 5. Explicit Non-Goals (restated, binding)
No payments · no real/licensed content · no downloads · no "licensed/official" claims · no lorem ipsum (all visible text is authored Arabic) · no email verification/OTP flows · no third-party analytics scripts · no ads · no social graph · no mobile apps · no real-name user data.

## 6. Acceptance Criteria (Phase 5 exit gate)

**Functional**
1. Guest can browse → open series → read 1 chapter of each format end-to-end; progress resumes correctly on return (guest = localStorage, reader = DB).
2. Reader account: add/remove to library, follow-updates feed reflects seeded chapter publish, mark-all-read works, rating + comment persist.
3. Admin login reaches `/admin`; editor cannot reach `/admin/users` (403 UI); unauthenticated `/admin` access redirects to `/login?next=/admin`.
4. Admin create/edit of series + chapter publish visibly changes public pages after revalidation.
5. Moderation approve/hide actions immediately change public comment visibility.
6. Collection "featured" toggle changes homepage section.
7. Locked chapter shows premium-demo state with no purchase affordance.
8. All 7 admin screens functional with seeded data (no dead buttons).

**Content & brand**
9. Zero lorem ipsum; all Arabic copy authored and proofread; no real franchise names/art; demo disclosure visible.
10. Cover art is original/abstract; no copyrighted imagery anywhere (seed audit checklist passes).

**Quality**
11. Full RTL correctness: layout mirroring, icons/arrows directional, no bidi-breaking punctuation, letter-spacing 0 on Arabic, line-height ≥1.7.
12. Responsive at 360 / 768 / 1280 px: bottom nav on mobile, no horizontal scroll, reader controls reachable one-handed.
13. Empty/loading/error states present for: library (guest & empty), updates (empty), search (no results), admin tables (empty), 404 & error pages.
14. Keyboard focus states + aria labels on primary controls; color contrast ≥ WCAG AA on text.
15. Zero console errors/warnings on the 10 core flows; Lighthouse mobile ≥ 85 perf / ≥ 90 a11y on home + series detail.
16. `README.md` covers setup, env vars, Supabase setup, seeding, demo accounts, routes.

**Legal/safety**
17. No purchase/billing/download flows reachable; no "رسمي/مرخّص" claims in copy; demo disclosure present.
18. RLS verified by direct anon/authenticated queries (published-only reads, owner-only writes, role-gated admin tables).

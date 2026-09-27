# Bunny Library — Release Plan (Phase 0.1 Output)

This plan supersedes the single-delivery framing in `PROTOTYPE_SCOPE.md`. Scope was reassessed ruthlessly: anything not required for a release's stated proof was pushed to a later release or cut. Each release is independently demoable and leaves the system in a coherent state.

---

## Release A — Foundation and Core Proof

**Goal:** prove the core product bet — a reader-first Arabic experience with two excellent readers and a real, secure publishing pipeline. **No code exists yet; this is the first build target after approval.**

### In scope (founder-specified + resolved details)
| Area | Content |
|---|---|
| Reader-first home `/` | Reader-first hierarchy implemented: Continue Reading hero (progress %, last chapter, one strong CTA), editorial section placeholders, trending + newly added + genre browse rows. Guest progress via localStorage; seeded progress for the demo reader account. |
| Webtoon reader `/read/webtoon/[series]/[chapter]` | **One excellent reader:** vertical continuous scroll, progress indicator, immersive mode, original generated panels. This is the flagship reader for A. |
| Manga reader `/read/manga/[series]/[chapter]` | Paged navigation, RTL/LTR toggle, progress indicator, immersive mode, original generated pages. |
| Public catalog + series detail | `/explore` (search, filters, sort, empty states) + `/series/[slug]` (meta, synopsis, CTA, chapter list with read/unread, related series). **No comments/reviews UI in A** (Release B). |
| Secure admin login + minimal admin | `/login`; `/admin` protected (middleware + layout guard + RLS). Screens: **series list, series detail/edit, chapters manager (create/edit, workflow draft→review→published, publish/unpublish)**. Publish actions visibly affect public pages via revalidation. No scheduler, no community/collections/users/dashboard screens. |
| Data layer | Supabase schema for A (`profiles`, `user_roles`, `series`, `chapters`, `chapter_pages`, minimal `analytics_events`), **RLS enforced from day one**, idempotent seed. |
| Demo data | **6 fictional series only: 3 manga + 3 webtoon** (founder-confirmation FD-3), 3–6 chapters for featured titles, original generated cover/panel art, believable Arabic metadata. One webtoon series shows the locked-demo chapter state (no purchase flow). |
| Brand foundation | Design tokens, RTL typography (IBM Plex Sans Arabic), dark-first theme, mobile bottom nav, top nav. |

### Explicitly NOT in A (moved to B/C or cut)
Novel reader & novel schema · library/updates/profile pages (beyond home's continue-reading card) · comments, ratings, moderation · collections admin & collection CRUD (homepage collections render from seed, static section allowed) · dashboard analytics · scheduler UI · monitoring wiring · downloads/payments (never — deferred/cut permanently per D-07).

### Exit criteria (measurable)
1. Guest: browse → open webtoon + manga series → read 1 chapter each → progress resumes on return (localStorage).
2. Demo reader: continue-reading hero reflects seeded/local progress.
3. Admin: login works; non-admin blocked (3-layer); create/edit series; publish/unpublish chapter → visible publicly after revalidation.
4. RLS test script passes for all A tables (anon read published-only; owner-only writes; role-gated admin).
5. RTL/mobile sanity at 360/768/1280 for A surfaces; zero console errors on A flows.
6. Seed re-runs idempotently; 6-series catalog matches plan.

## Release B — Complete Demo Experience

**Goal:** complete the product story — all three formats, personal library continuity, community, full admin. **Gate: source-reconciliation pass completed (see CONTRADICTION_REPORT §2) + founder approval of FD items.**

### In scope
| Area | Content |
|---|---|
| Novel reader `/read/novel/[series]/[chapter]` | Clean RTL text reader, font-size controls, dark/light/sepia themes, progress; original Arabic prose chapters; `novel_content` schema migration. |
| Library `/library` + progress + updates `/updates` | DB-persisted library (4 tabs), reading progress sync (Server Actions), updates feed for followed series, mark-all-read, unread badges. |
| Profile `/profile` | Avatar/nickname, reading stats, favorite genres, saved titles, activity, simple settings. |
| Community | Comments on series + chapters, ratings/reviews, report flow, Arabic community seed content (20+), moderation queue in admin. |
| Full admin content management | + **community moderation**, **collections CRUD** (feature-on-home), **users & roles** (admin-only), **dashboard** (metrics cards, recent activity, top series, content status, charts from seeded `analytics_events`). |
| Seed expansion | 6 → **12 fictional series** (adds 4 novels/light-novels + genre completion), scheduler-style publish dates in data, full comment/report distribution. |
| Chapter scheduler UI | Publish scheduling (draft→review→published + `published_at` scheduling). |

### Exit criteria
1. Reader account: library add/remove, progress sync across sessions/devices, updates feed reflects published chapters, rating + comment persist.
2. Editor: moderation actions change public visibility immediately; collections featured toggle changes homepage.
3. Admin dashboard renders realistic seeded analytics; users screen enforces admin-only.
4. Novel reader: theme + font controls persist; progress accurate.
5. All acceptance criteria §5.1–§5.8, §5.9–§5.10, §5.17–§5.18 of PROTOTYPE_SCOPE (v0.2) pass.

## Release C — Polish and Production Preparation

**Goal:** make it durable and hand-off ready. No new product features.

### In scope
| Area | Content |
|---|---|
| Responsive + RTL audit | Full matrix (360/768/1280; iOS Safari/Android Chrome/desktop), mirroring, arrows, numerals, bidi punctuation, letter-spacing/line-height conformance. |
| Error/loading/empty states | Arabic skeletons, error boundaries, 404/error pages, empty states for every data surface. |
| Monitoring integration placeholders | `lib/analytics` stub → PostHog drop-in; Sentry-ready error boundaries + documented one-step activation; dashboard stays seeded-data only. |
| Accessibility baseline | Keyboard focus states, aria labels on primary controls, contrast ≥ AA, semantic landmarks. |
| Security audit | RLS verification script re-run, headers/CSP review, env-var audit (no `NEXT_PUBLIC_` leaks), Server Action validation sweep, dependency audit. |
| Deployment documentation | README finalization: setup, env vars, Supabase setup, seeding, demo accounts, routes; deploy runbook (Vercel + Supabase), seed recovery. |

### Exit criteria
1. Full QA matrix passes (PROTOTYPE_SCOPE §6.11–§6.16).
2. Security audit checklist signed off in-repo.
3. A new developer can go from clone → running demo in ≤ 30 minutes using README alone.

---

## Cross-release sequencing & dependencies

```
Approval → [A] Foundation & Core Proof ──→ [B] Complete Demo ──→ [C] Polish & Prod-Prep
                │                                  ▲
                └── source-docs re-delivery ───────┘  (reconciliation gate before B sign-off)
```

- **Release A has no dependency on the missing source documents** (foundation work is robust to their content: stack, schema, readers, RLS are brief-mandated).
- **Release B sign-off requires:** the four source docs delivered → reconciliation pass executed → conflicts resolved into this plan.
- Phases 1–5 (original working method) map: A ≈ Phases 1–3, B ≈ Phases 4–5, C = Phase 6 (QA/polish deepened).

## Ruthless-scope change log (vs. previous PROTOTYPE_SCOPE v0.1)

| Change | Rationale |
|---|---|
| 12 series → 6 (A) then 12 (B) | Founder structure; smaller proof surface, earlier demo |
| Novel reader → B | Format breadth is not needed to prove the reader-first bet |
| Comments/ratings/moderation → B | Community is valuable only after content exists to discuss |
| Scheduler UI → B | Publish/unpublish proves the workflow; scheduling is operational polish |
| Collections admin CRUD → B (seeded static collections render in A) | Editorial surface, not core proof |
| Dashboard analytics → B | Founder-specified |
| Monitoring/accessibility/security/deployment docs → C explicitly | Founder-specified |
| Cut entirely (all releases): payments, downloads, social graph, mobile apps, AI recs, ads | D-07, legal exposure, scope discipline |

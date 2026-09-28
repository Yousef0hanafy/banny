# Bunny Library — Release B Report (Complete Demo Experience)

**Date:** 2026-09-28 · **Gate decision:** FD-10 (founder directed "ok continue"; source-doc reconciliation deferred post-hoc) · **Status:** ✅ BUILT, SEEDED & BROWSER-VERIFIED

## 1. Scope delivered (per docs/RELEASE_PLAN.md Release B)

| Area | Delivered |
|---|---|
| Novel reader | `/read/novel/[series]/[chapter]` — RTL prose reader, font-size ± (15–30px, persisted), dark/sepia/light themes (persisted), throttled scroll progress via the shared Server-Action pipeline, chapter end-card navigation |
| Library | `/library` — DB-persisted (LibraryItem), 4 tabs (all / reading / plan / finished), unread badges, mark-all-read, shelf switching, remove |
| Updates | `/updates` — latest live chapters of library series, read/unread state, new badges |
| Profile | `/profile` — stats cards (library / chapters read / comments / ratings), favorite-genre bars, recent reading, activity log, nickname+bio settings |
| Community | Comments on series + chapter scope (Comment, CommentStatus), report flow (CommentReport, one-per-user), 5-star ratings with server-recomputed aggregates (Rating → Series.ratingAvg/ratingCount) |
| Admin: moderation | `/admin/moderation` — flagged+hidden queue with reporters, keep-visible / hide / restore / delete (editor+) |
| Admin: collections | `/admin/collections` — full CRUD (slug, theme, order, featured-on-home, series picker) with immediate homepage revalidation |
| Admin: users & roles | `/admin/users` — admin-only (page-level `requireRole(["admin"])` + nav gated), role switching, self-demotion guard |
| Admin dashboard | 14-day activity chart (recharts: reads/logins/publish) + community pulse cards |
| Scheduler | `Chapter.scheduledFor` — set at creation or per-row in chapters manager; public rule: live iff published AND not future-scheduled; scheduled items show "ينشر قريبًا" badge |
| Seed 6 → 12 | 4 novels (**12 chapters of original Arabic prose**, no lorem ipsum), 1 manga, 1 webtoon; 24 comments, 21 ratings, 2 reports, 7 demo library items, "أصوات مُحبَّرة" novels collection |

## 2. Database (Neon PostgreSQL — two new versioned migrations)

- `20260927230754_release_b_novel_library_community` — `series_format += 'novel'`, new enums
  `library_shelf` / `comment_status`, new tables `LibraryItem` / `Comment` / `CommentReport` /
  `Rating` (composite uniques + FK CASCADE), `Chapter.novelBody`
- `20260927231129_release_b_scheduler` — `Chapter.scheduledFor`
- Both generated offline / additive only, applied via `prisma migrate deploy` (DIRECT_URL),
  client regenerated. **Constraint verifier extended: 41/41 PASS** (11 tables, 8 enums, 9
  unique indexes, 16 FKs, live enforcement probes with cleanup).

## 3. Seed idempotency ×2 (byte-identical counts)

series 12 · chapters 46 · pages 287 · profiles 3 · collections 3 · progress 4 · events 322 ·
libraryItems 7 · comments 24 · ratings 21 · reports 2. Art: 299 generated files (covers for all
12 series, pages/panels for 6 visual series — new motifs: letters, dunes, train, waves,
citadel, tide).

## 4. Verification (typecheck 0 errors · lint clean · production build green)

Browser E2E (production standalone, reading/writing Neon):

| Test | Result |
|---|---|
| Guest home renders 12 series + "أصوات مُحبَّرة" collection | PASS |
| Novel series page (format badge, word-count chapter rows, library button enabled) | PASS |
| Novel reader: prose, font/theme controls (sepia switch exercised) | PASS |
| Scheduler: ch.4 of "موسم المدّ الأخير" shows "ينشر قريبًا", not readable, absent from live list | PASS |
| Reader: library grid + tabs + unread badges ("3 جديد" on plan shelf) | PASS |
| Reader posts comment → Neon write (24→25) → renders after reload | PASS |
| Rating widget reflects seeded reader rating (5/5) | PASS |
| Updates feed renders for reader | PASS |
| Admin moderation: queue renders, hide action → status flagged→hidden (DB verified) | PASS |
| Admin users: roles render, self-demote disabled | PASS |
| Admin collections: list + featured badges + editor | PASS |
| Dashboard: 14-day chart + community pulse | PASS |

**Incident during QA (resolved):** a stale standalone server from the migration QA was still
bound to port 3000 with the pre-B Prisma client, causing a transient 500 (`'novel' not found
in enum`). Killed the stale process; fresh build serves correctly. Root cause: sandbox
reaping behavior had masked the old process earlier.

## 5. Enforcement model (unchanged & honest)

Authorization remains **application-layer** (middleware → admin layout → requireRole per
query/action; role checks in every mutating Server Action). No database-level RLS exists or
is claimed. Community mutations require authentication; moderation requires editor+; user
roles require admin.

## 6. Release gate status

- **Release B exit criteria:** implemented as specified in RELEASE_PLAN §Release B; E2E pass
  matrix above (library/progress sync, moderation visibility, dashboard analytics, novel
  reader controls).
- **Open:** source-doc reconciliation (FD-1/FD-10) remains post-hoc — CONTRADICTION_REPORT §2
  checklist ready whenever the founder delivers the four documents.
- **Next:** Release C (responsive/RTL audit, error/empty states, monitoring placeholders,
  accessibility, security audit, deployment docs) + known follow-ups (React #418 hydration
  audit, `prisma.config.ts` before Prisma 7, Neon password rotation recommendation).

# Release D Report — Personalization & Retention ("For You" + Streaks)

**Date:** 2026-09-28 · **Decision:** FD-12 (founder multi-select: "For You + Streaks", full release-style depth)
**Outcome:** ✅ COMPLETE — all exit criteria met, browser-verified end-to-end on a real PostgreSQL 18.

---

## 1. Scope delivered

| # | Feature | Files |
|---|---|---|
| D-1 | **"لك" For You rail** on home — explainable personalized recommendations | `src/lib/foryou.ts` (new), `src/app/page.tsx`, `src/components/library/series-card.tsx` (`reasonAr` chip) |
| D-2 | **Reading streak + stats** on profile — current/longest streak, days-active/30, completed chapters, 14-day personal activity area chart | `src/lib/reading-stats.ts` (new), `src/app/profile/page.tsx`, `src/components/library/reading-activity-chart.tsx` (new) |
| D-3 | **Badges (شاراتك)** — 8 deterministic badges with Arabic progress hints when locked | `src/lib/reading-stats.ts`, `src/app/profile/page.tsx` |
| D-4 | **Seed enrichment** — guaranteed 10-day reader streak + 3 completed demo chapters; idempotency preserved | `prisma/seed.ts` |
| D-5 | **QA infrastructure** — ephemeral embedded PostgreSQL 18 for full runtime QA while Neon credentials are pending | `scripts/qa-local-pg.mjs` (new), `scripts/qa-streak-check.mjs` (new), `scripts/qa-release-d.sh` (new) |

**Explicit non-goals:** no schema migrations (both features derive entirely from existing tables — zero DDL, zero new enums); no notification infrastructure (that was menu option (b), not selected); no algorithm opacity — every recommendation renders its reason.

## 2. Design decisions

### For You (`src/lib/foryou.ts`)
- **Signals** (reader's own footprint only — no cross-user data): ReadingProgress (completed +3 / ≥50% +2 / touched +1 per genre), LibraryItem (finished|reading +2; `plan` shelf deliberately contributes nothing — those series are already queued), Rating (5★ +4, 4★ +2, 2★ −2, 1★ −3).
- **Candidates:** published live-chapter series the reader has NOT touched, shelved, or rated. Score = Σ genre affinity, tiebreak reads → ratingAvg.
- **Explainability:** each card carries an anchor-based reason — progress anchor → «لأنك قرأت «X»», library-only anchor → «يشبه «X» من مكتبتك», ratings-only → «يطابق ذوقك في «genre»».
- **Cold-start rule (D-01 alignment):** <2 distinct history series or no positive affinity → the rail does not render. Guests never see it.

### Streaks (`src/lib/reading-stats.ts`)
- **Activity day** = any read_* AnalyticsEvent that day ∪ ReadingProgress.updatedAt day (the progress union guarantees "you read today" is always truthful even where event rows are sparse — as on the current Neon dataset).
- **Current streak:** active today → count back from today; else active yesterday → count back from yesterday (day is young); else 0. **Longest** scans the 365-day window. Day buckets are UTC-date strings — identical convention to the admin dashboard chart.
- **Arabic number agreement:** 1 يوم · 2 يومان · 3–10 أيام · 11+ يومًا (unit word follows the count).
- **Badges:** first-step, streak-3, streak-7, chapters-10, finisher (finished shelf), first-rating, first-comment, collector (5 library items). Earned = gold tile + check; locked = dashed tile + Arabic hint (e.g. «3/10 فصلًا»).

### Seed (idempotency preserved)
- Guaranteed reader activity for the last 10 days (read_start + 2× read_page, evening hours) inside the existing empty-table guard → seed ×2 byte-identical (348 events, up from 318).
- Today's generated events are clamped to the recent past (base ≥40 min back; page events ≤ +25 min) — a first version produced 2 future-dated rows, caught by the QA probe (`scripts/qa-streak-check.mjs` asserts **0 future events**), fixed, re-seeded fresh.
- 3 completed demo chapters (six-thirty-train ch1–2, letters ch1) → completedChapters=3 → badge spread 7/8 earned with a meaningful locked hint.

## 3. QA evidence (all green)

**Pipeline:** typecheck 0 errors · ESLint 0 errors (2 pre-existing manga-reader warnings) · production build GREEN (all DB routes ƒ dynamic) · migrations applied to QA PG through `prisma.config.ts` (A-2 runtime verification: **now effectively proven on real PG 18**).

**Database QA:** seed ×2 byte-identical (profiles 3, series 12, chapters 46, pages 287, progress 6, events 348, collections 3, libraryItems 7, comments 24, ratings 21, reports 2) · reader event-days = 14 consecutive UTC days · future-dated events = 0.

**Browser E2E** (`scripts/qa-release-d.sh`, screenshots in `research/qa-d-*.png`):

| Check | Result |
|---|---|
| `/api/health` | `{"status":"ok","database":"ok"}` |
| Guest home cold start | For You rail ABSENT (correct) |
| Sign-in reader@bunny.demo | → home |
| For You rail signed-in | present, **3 cards = exactly the 3 non-history series** (12 − 9) |
| Reason chips | «لأنك قرأت «رسائل من الطابق السابع»» / «…«زفاف القمر الأحمر»» / «…«نبض المدينة صفر»» — all anchors genuinely in reader history |
| Streak section | present; **16 يومًا** (seeded 10-day chain extended by background 40% attribution — consistent with event history) |
| Stat trio | longest 16 · days-active-30 30 · completed 3 |
| Chart | recharts SVG rendered, 14-day axis |
| Badges | **7/8 earned** (gold) + locked «قارئ مجتهد» with «3/10 فصلًا» hint |
| Read path | webtoon chapter read + scroll → progress persisted (event write path live) |
| RTL/responsive | 1280 + 360 no horizontal overflow on home & profile; bottom nav intact |
| Console errors | none |

## 4. Honest limitations

- **Anchor tie-break nondeterminism:** when two history series tie on shared-genre count (e.g. warden vs city-pulse both sharing غموض=1 with harbor-of-the-missing), Postgres row order decides. Both anchors are truthful; ordering is just not stable across plans. Deterministic tie-break (e.g. recency) is a one-line follow-up if wanted.
- **Streak granularity is day-level** (UTC): night readers crossing midnight UTC see two days. Timezone-aware buckets deferred until a real user base says otherwise.
- **Neon dataset nuance:** the current Neon events table predates the streak seed (table non-empty → guard skips). The progress-touch union keeps Neon streaks truthful-but-modest; the full 10-day demo streak shows on any fresh seed (as QA'd). Delivering rotated credentials + optional events reset would restore the exact demo shape there.
- **embedded-postgres is a devDependency** for QA only — never referenced by app runtime; runtime still refuses non-postgres URLs (failsafe 3/3 stands).

## 5. Exit criteria scorecard

| Criterion (same bar as A/B/C) | Status |
|---|---|
| Feature complete per FD-12 selection | ✅ For You rail + streaks/stats/badges |
| Regression green (typecheck/lint/build/constraints) | ✅ (constraint verifier re-run pending Neon — schema unchanged, 3 migrations applied cleanly on PG 18) |
| Browser E2E verified incl. RTL/mobile + honest limitations documented | ✅ |

**Remaining founder actions (unchanged):** rotate `neondb_owner` password → deliver both rotated strings → 5-minute Neon re-verification chain (documented in README §Known limitations).

# Release E Report — Community, Notifications, Search, Sharing, Studio

**Scope (FD-13):** founder directive "Ok add the features that you suggest" → the entire remaining value-proposition menu shipped at the A/B/C/D quality bar: **notifications center, chapter-level comments + comment likes, Arabic smart search, RTL share cards, creator studio lite.**

**Status: COMPLETE — browser-verified end to end on embedded PostgreSQL 18 (same major as Neon).**

---

## 1. What shipped

### E-1 Notifications center (مركز الإشعارات)
- **Schema:** new `Notification` table (type/titleAr/bodyAr/href/readAt) + native `notification_type` enum (`new_chapter`, `comment_like`, `system`), indexed `(profileId, readAt, createdAt)`.
- **Triggers (server-side, batched `createMany`, capped 500/trigger):** chapter publish fan-out to every profile that shelved the series — wired into all three publish paths (`updateChapterMeta`, `createChapter`, `setWorkflowBulk`); comment-like notification to the comment author (never self, never on unlike).
- **UI:** header bell (client, `notification-bell.tsx`) with unread badge (9+ cap), dropdown feed (8 items, type-colored icons, unread dots), optimistic mark-read on click + navigation to the notification href, "تعليم الكل كمقروء". Polls `/api/notifications` on mount + every 60 s + on open. Full page `/notifications` (50 items) with server-computed Arabic time labels (hydration-safe), empty state, mark-all.
- **Guests:** bell never renders; API returns an empty 200 (no session leak).

### E-2 Chapter comments + comment likes
- **Schema:** `CommentLike` table (compound unique `commentId+profileId`, CASCADE FKs). `Comment.chapterId` already existed since Release B — zero changes needed for chapter scoping.
- **Likes:** `toggleCommentLike` server action (zod, session-scoped) returns `{liked, likeCount}`; heart button on every comment (series page + chapter dialogs + webtoon inline) with optimistic toggle + rollback on failure, count badge, `aria-pressed`.
- **Chapter comments:** the shared `CommentsSection` now renders inside all three readers — **webtoon**: inline at the chapter end (natural scroll flow); **manga + novel**: header trigger (`ReaderChrome.headerExtra`) opening a dialog scoped to the chapter. Posting from the reader goes through the existing `postComment` chapterNumber path.

### E-3 Arabic smart search (البحث الذكي)
- **`src/lib/arabic-search.ts` (zero DDL):** normalization to one canonical form (tashkeel + tatweel stripped, أإآٱ→ا, ة→ه, ى→ي, ؤ→و, ئ→ي, latin lowercase), tokenization, weighted field scoring (word-equal 100 > prefix 70 > token-extends-word 55 > substring 50 > fuzzy 40/25) with AND semantics across query tokens, bounded Levenshtein (tol 1 for ≥4 chars, 2 for ≥6 — short Arabic words stay exact).
- **Integration:** `getPublishedSeries` scores title(×3)/titleOriginal/author/genres(×2)/tags/synopsis(×1) in memory (12-series demo; scales to low thousands), relevance order wins over sort filters while a query is active. Empty results render a **«هل تقصد …؟»** chip — the suggestion uses ONE step looser tolerance than the search (otherwise it would be mathematically unreachable: everything close enough to suggest is also close enough to match).
- **Verified live:** hamza-less «الاحمر»→«زفاف القمر الأحمر»، teh-marbuta «مقهى اوراق»→«مقهى أوراق النعناع»، alef-maqsura «القديمه»→«مرسى النجوم القديمة»، 1-letter typo «السابعب»→«رسائل من الطابق السابع»، severe typo → 0 results + «هل تقصد رسائل من الطابق السابع؟».

### E-4 RTL share cards (بطاقات المشاركة)
- **Share sheet** (`share-button.tsx`) on the series hero: native `navigator.share` where supported, copy-link (clipboard + legacy fallback with «تم نسخ الرابط» feedback), X / WhatsApp / Telegram intents — all Arabic-labeled.
- **Per-series OG image** (`series/[slug]/opengraph-image.tsx`, `next/og` satori, 1200×630): dark brand card with series accent glow + edge stripe + ب watermark, format/genre badges, big Arabic title, author, rating; Next's file convention auto-wires `og:image` + `twitter:image`; DB failsafe falls back to the brand card.
- **Arabic rendering findings (documented in code):** satori shapes Arabic glyphs correctly but has **no bidi** — `direction: rtl` is ignored and word order comes out LTR. Workaround: pure-Arabic strings are word-reversed (`ar()`) and rows use `flexDirection: row-reverse`; the rating renders as the direction-agnostic form «5.0 / 5». Fonts: IBM Plex Sans Arabic WOFF (satori rejects WOFF2) committed to `public/fonts/` via `scripts/sync-og-fonts.mjs` (re-run after font upgrades; public/ is copied into the standalone build).

### E-5 Creator studio lite (استوديو المبدعين)
- **`/studio`** (editor+, `requireRole`, zero DDL): read-only insights — totals strip (reads / library adds / community comments / awaiting review), scheduled-chapters banner, per-series cards (reads bar relative to top performer, rating, comments count, saves, chapter pipeline published/review/drafts/scheduled, top-3 chapters by `read_start` events) with «إدارة العمل» deep link into admin. Editor/admin find it in the account dropdown; readers are redirected (`/admin?denied=1` — verified).

---

## 2. Migration & data

| Item | Value |
|---|---|
| Migration | `20260928093727_release_e_notifications_likes` — 1 enum, 2 tables, 3 indexes (1 unique), 3 CASCADE FKs |
| Applied to | Embedded QA PostgreSQL 18 (`127.0.0.1:54329/bunny_qa`) via `prisma migrate deploy` through `prisma.config.ts` |
| Seed ×2 idempotency | Byte-identical: profiles 3 · series 12 · chapters 46 · pages 287 · progress 6 · events 348 · collections 3 · libraryItems 7 · comments 24 · ratings 21 · reports 2 · **notifications 4 · commentLikes 8** (both new blocks guarded by empty-table checks) |
| Neon | **Not touched** — credentials still pending founder rotation; the migration applies verbatim via the documented re-verification chain (README §Known limitations) |

## 3. QA evidence (scripts/qa-release-e.sh, standalone server + agent-browser)

| # | Check | Result |
|---|---|---|
| 0 | `/api/health` | ok, db ok |
| 1 | Guest home — bell absent | ✓ |
| 2 | Smart search ×4 normalization/typo cases | ✓ exact expected first hits |
| 2 | Severe typo → 0 results + «هل تقصد» chip | ✓ |
| 3 | OG card route | 200, image/png, ~90 KB, visually verified RTL |
| 4 | Reader sign-in | ✓ |
| 5 | Bell: aria-label unread count, dropdown 4 items, item click → mark-read + navigate | ✓ |
| 6 | /notifications: 4 rows, unread dots → mark-all → 0 | ✓ |
| 7 | Webtoon inline comments: section renders, post persists («التعليقات (2)» after QA post), heart toggle | ✓ |
| 8 | Series page: heart count 0→1 (and 1→0 unlike on re-run — DB-backed toggle), share menu 5 items | ✓ |
| 8b | Reader → /studio denied | `/admin?denied=1` ✓ |
| 9 | Admin /studio: 12 series rows, live stats (comments 23→24→25 tracking QA posts) | ✓ |
| 10 | Mobile 360 overflow (home + notifications) | OK |
| 11 | Console errors | none |

Screenshots: `research/qa-e-{search,bell-dropdown,notifications,webtoon-comments,share-menu,studio,og-card}.png` (+ 360 variant).

**Regression:** typecheck 0 errors · lint 0 errors (2 pre-existing manga-reader warnings) · production build GREEN (all DB routes ƒ; new dynamic routes `/notifications`, `/studio`, `/api/notifications`, `/series/[slug]/opengraph-image`).

## 4. Bugs found & fixed during QA

1. **Genre-filter/scoring index misalignment** — search scoring originally ran after the genre filter re-sliced `cards`, breaking `rows[i]↔cards[i]` alignment; reordered (score → genre filter → return).
2. **«هل تقصد» unreachable** — suggestion used the same tolerance as search, so it could never fire (anything close enough to suggest was already matched); suggestion now uses tol+1 with adjusted scores.
3. **Lint `set-state-in-effect`** — bell boot fetch deferred via `setTimeout(…, 0)` keeping setState out of the synchronous effect body.
4. **Satori RTL** — `direction: rtl` ignored + dynamic font fetch failure for «★» (offline sandbox): star replaced with text, word-reversal + `row-reverse` workaround introduced, WOFF fonts committed.
5. **QA-side (not code):** two test cases initially targeted a title that exists in the data manifest but not in the seed, and a "severe typo" that was within tolerance — both corrected with DB-verified expectations.

## 5. Honest limitations

- **Satori has no bidi:** the OG workaround word-reverses pure-Arabic strings; a mixed Arabic+digit run can micro-reorder (mitigated: rating shown as «5.0 / 5»). If OG cards ever need pixel-perfect mixed-direction typography, switch to a headless-browser renderer.
- **Bell feed is polling (60 s)**, not push — appropriate for the prototype; WebSocket upgrade path exists (mini-services pattern).
- **Notification fan-out is per-publish, capped at 500** profiles per trigger — no queue/retry infrastructure (by design, prototype scope).
- **Search scoring is in-memory** — fine for the demo catalog; a Postgres trigram/fts index or the existing normalization pushed into SQL is the natural scale-up.
- **Neon re-verification still pending** the founder's rotated credentials (unchanged from Release D): `db:status` → `migrate deploy` (now applies 4 migrations) → `verify-neon-constraints` (extended for E tables recommended) → seed ×2 → spot-check.

## 6. Exit criteria scorecard

| Criterion | Verdict |
|---|---|
| All five menu features implemented at release depth, Arabic-first RTL | ✅ |
| One versioned migration, seed idempotent ×2, no runtime failsafe changes | ✅ |
| Browser-verified E2E incl. mobile width, role gates, console clean | ✅ |
| typecheck / lint / production build green | ✅ |
| Docs + FD record + README + worklog updated | ✅ |

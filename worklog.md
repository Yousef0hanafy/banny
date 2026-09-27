# Bunny Library — Worklog

---
Task ID: 0
Agent: Super Z (main agent, lead product engineer)
Task: Phase 0 — Product, Market, Legal, and Architecture Discovery Gate for Bunny Library

Work Log:
- Inspected repository: fresh/empty (no app code, `.env` placeholder only).
- CRITICAL FINDING: the four source documents (PRD.md, PRODUCT_STRATEGY.md, COMPETITOR_ANALYSIS.md, MARKET_RESEARCH.md) were NOT found — `/home/z/my-project/upload/` is empty. Filesystem search confirmed absence. No document contents were fabricated; flagged throughout outputs.
- Loaded web-search skill; executed 32 live web searches (2026-09-28) across market, competitors, legal, and technical tracks; raw results retained in `/home/z/my-project/research/*.json`.
- Key verified findings: Manga Arabia Arabic webtoons (Apr 2025); Rakuten MangaOasis Arabic (Jun 2025); Shueisha MANGA MILLION 100+ languages incl. Arabic (Aug 2026); Manga Productions/SRMG licensing record; Azora still active © 2026; global webcomics ~$7.6B (2024); GCC anime $644M→$1.265B; Arabic paid adoption lags (ad-supported norm); Saudi/UAE/Egypt copyright frameworks verified (SA new law 2026, UAE F38/2021, Egypt 82/2002).
- Technical verification: Next.js 16 stable + Turbopack default; Supabase RLS best practices + Storage smart CDN; Tailwind v4 + shadcn/ui on App Router; IBM Plex Sans Arabic typography rules; env-var safety; Sentry @sentry/nextjs v11; PostHog Next.js path; Vercel+Supabase deployment pattern.
- Reference product azorafly.com: direct browser inspection blocked by Cloudflare (only search-indexed metadata verified: active domain, DMCA/privacy pages, community, genre chips). Recorded honestly; deeper IA teardown queued.
- Wrote the four required Phase 0 deliverables in `/home/z/my-project/docs/`:
  - DISCOVERY_REPORT.md (verified findings w/ sources, unverified assumptions, competitor delta, legal constraints, risks, GO recommendation, Unverified Research Queue)
  - DECISIONS.md (23 decision records D-01…D-23 + open questions + human-approval list + assumption-challenge record)
  - PROTOTYPE_SCOPE.md (Prototype Now / Production-Preparation / Explicitly Deferred, roles, routes, demo data, 18 acceptance criteria)
  - ARCHITECTURE.md (stack, app architecture, DB entities/relations, auth/roles, RLS matrix, storage, security, RTL plan, deployment, 4-layer testing plan)
- Created persisted research scripts in `/home/z/my-project/scripts/` (phase0_search.sh, phase0_search2.sh).

Stage Summary:
- Phase 0 COMPLETE. Recommendation: GO for prototype with 5 guardrails (no payments, no real content, no downloads, no licensed claims, no auth hardening beyond demo).
- Top risks: (1) missing source docs, (2) unproven willingness to pay, (3) licensed incumbents shrinking differentiation window, (4) content-leakage legal risk, (5) RTL/typography quality in LTR-centric ecosystem.
- NEXT: awaiting user approval before Phase 1 (Foundation). Re-upload of the 4 source docs requested as blocking gate for Phase 2 sign-off.

---
Task ID: 0.1
Agent: Super Z (main agent, lead product engineer)
Task: Phase 0.1 — Source Reconciliation Gate

Work Log:
- DELIVERY FAILURE CONFIRMED (2nd occurrence): source documents absent from /docs/source/ (directory does not exist) and /upload/ (completely empty, no hidden files); filesystem search negative. Reconciliation against the documents NOT executed and NOT fabricated, per the task's own integrity rules.
- Executed source-independent portions of the gate:
  - Attempted full-text verification upgrades of key claims: MANGA Plus MAX page VERIFIED full-text (Standard/Deluxe tiers); manga.com.sa VERIFIED live ("Manga Productions | Inspiring Heroes of Tomorrow"); ANN + azorafly.com remain Cloudflare-blocked (labeled).
  - Wrote /docs/SOURCE_VERIFICATION.md — every external claim labeled (Verified-FT / Verified-SN / Inference / Unverified) with exact URL + date; 6 downgrades applied (M4 13.6% → Inference/low-confidence; C8 localization-negation → Unverified; M3 → indicative; T10 → Inference; M7 conclusion → hypothesis; C1/C4 URL-depth limitations noted).
  - Wrote /docs/CONTRADICTION_REPORT.md — 12 internal contradictions/overreach items found & resolved (release structure, 6-vs-12 series, novel deferral, admin screen mapping, continue-reading semantics, analytics placement, comments placement, monitoring/accessibility placement, inference-labeling, scheduler deferral, conditional GO, claim confidence); source-reconciliation section marked BLOCKED with a ready per-document checklist.
  - Wrote /docs/RELEASE_PLAN.md — founder-directed Release A/B/C with ruthless scope change log (8 items moved/cut) and per-release exit criteria.
  - Wrote /docs/FOUNDER_DECISIONS.md — FD-1..FD-9 with recommendations (FD-1 = source-doc delivery via chat paste is the blocker).
  - Updated all four Phase 0 docs: DISCOVERY_REPORT (conditional GO banner + M4 downgrade), DECISIONS (D-17 release-mapped; D-23 moved to B; new D-24..D-27), PROTOTYPE_SCOPE (release mapping banner + seed split A=6/B=12), ARCHITECTURE (A/B/C schema & stub phasing note).

Stage Summary:
- Phase 0.1 partially complete: everything except source-vs-discovery reconciliation (blocked on file delivery, not on effort).
- Scope now structured as Release A (6 series, 2 readers, secure admin core) → B (complete demo, 12 series) → C (polish & production prep).
- BLOCKED ITEM: the four source documents must be re-delivered (recommend: paste full text into chat) to run CONTRADICTION_REPORT §2; gates Release B, not Release A.
- STOPPING as instructed — awaiting founder approval on FOUNDER_DECISIONS FD-1..FD-9 (notably FD-9: start Release A).

---
Task ID: A (Release A build)
Agent: Super Z (main agent, lead product engineer)
Task: Release A — Foundation and Core Proof (founder approved FD-1..FD-9 with recommendations)

Work Log:
- Loaded fullstack-dev skill; initialized scaffold (Next.js 16.1.1, React 19, Tailwind v4, shadcn/ui, Prisma+SQLite, NextAuth v4).
- ENVIRONMENT ADAPTATION (documented): no live Supabase project provisionable in sandbox → data layer = Prisma/SQLite with authorization matrix enforced at data-access layer; Supabase/Postgres schema + FULL RLS policy set shipped as supabase/migrations/0001_release_a_schema_rls.sql (verified parity mapping in README).
- Schema: profiles, series, chapters, chapter_pages, reading_progress, analytics_events, editorial_collections (A-scope subset per RELEASE_PLAN).
- Design system: midnight-library tokens (globals.css), RTL root (lang=ar dir=rtl), IBM Plex Sans Arabic via next/font, letter-spacing 0 + line-height 1.75.
- Content: scripts/release-a-data.mjs manifest — 6 original fictional series (3 manga + 3 webtoon, FD-3a), Arabic synopses/metadata, 26 chapters (incl. 1 review, 1 draft, 1 locked premium demo ch on زفاف القمر الأحمر ch5), 2 collections, 3 demo accounts, ~320 events.
- Art: scripts/generate-art.mjs (sharp, deterministic) → 226 original abstract webp covers/pages/panels — no text, no characters, non-infringing (D-05).
- Auth: NextAuth credentials + JWT role claim; 3-layer admin guard (middleware → admin layout → requireRole in every action/query); scrypt password hashing.
- Public pages: home (reader-first hero with localStorage+DB merge, latest updates, collections, trending, newest, genre browse), explore (search/filters/sort/empty states), series detail (CTAs state-aware, chapter list read/unread/locked, related series), basic /profile stub, Arabic 404.
- Readers: webtoon (vertical, scroll progress throttled-save, immersive), manga (paged, RTL/LTR toggle with RTL-aware keyboard/tap zones, page slider, immersive); progress → localStorage always + DB via Server Action when signed in; locked premium chapter panel (no purchase flow).
- Admin: dashboard-lite (counts, recent activity, top series, content status bar), series list w/ filters, series create/edit forms (zod), chapters manager (workflow select + premium lock toggle), chapter creation (placeholder abstract pages auto-generated), duplicate-number validation (Arabic error).
- QA (agent-browser E2E, all verified): home RTL dark render; series detail; webtoon read + scroll; manga pagination (page 3/12 + localStorage sync); locked chapter state; admin login; reader-role denial screen; dashboard metrics; publish review→published reflected publicly (DB + UI); chapter creation (8 placeholder pages); duplicate rejection; explore search + no-results; mobile 390px layout with bottom nav; console error-free; ESLint clean; no 500s.
- FIXES DURING QA: SessionProvider → client AuthProvider wrapper (context-in-server-component error); AnalyticsEvent.series relation added to Prisma schema (validation error on dashboard include); hero rewritten to render-time derivation (react-hooks/set-state-in-effect lint rule); stale dev server process killed and restarted via official supervisor.
- Deliverables: README.md (setup/env/seed/accounts/routes/QA evidence/limitations), worklog updated.

Stage Summary:
- RELEASE A COMPLETE and browser-verified end to end.
- Founder decisions adopted: FD-2 (localStorage continue-reading), FD-3a (3+3 series), FD-4a (no comments in A), FD-5a (no scheduler), FD-6a (status-cards admin landing), FD-7a (shared demo accounts), FD-8a (locked-demo chapter kept), FD-9a (A started).
- PENDING for Release B sign-off: source documents re-delivery + CONTRADICTION_REPORT §2 reconciliation (still blocked), then comments/moderation, novel reader, library/updates/profile, collections admin, dashboard analytics, 12-series seed.

---
Task ID: A-NEON (Release A → Neon PostgreSQL migration, Phase 1: offline preparation)
Agent: Super Z (main agent, lead product engineer)
Task: Founder-approved migration of Release A runtime from local SQLite to Neon PostgreSQL before Release B (D-28). Two-connection-string setup (DATABASE_URL pooled / DIRECT_URL direct), Prisma ORM + versioned migrations, NextAuth unchanged, Supabase removed from runtime, no unexecuted RLS claims, strict secrets discipline.

Work Log:
- GATE FINDING: zero Neon URLs exist in the environment — .env holds only the legacy SQLite file: DATABASE_URL + NEXTAUTH_* (inspected by NAME/protocol only, values never printed); no .env.local, no DIRECT_URL anywhere. All migration commands against Neon are therefore BLOCKED per founder instruction; offline preparation completed fully instead.
- SECURITY REMEDIATION: .env (contains NEXTAUTH_SECRET) and db/custom.db were git-TRACKED → `git rm --cached` + commit ce9e196; .gitignore hardened (.env* with !.env.example exception, /db/ ignored). Historical commits still contain the old .env (sqlite path + NEXTAUTH_SECRET) — noted in report; rotation recommended if repo ever leaves the sandbox.
- Schema audit (SQLite → PG): only required change = provider + directUrl; cuid/@updatedAt/Float/compound-uniques/cascades all PG-compatible; zero raw SQL in app. String-typed vocabularies promoted to NATIVE Postgres enums (user_role, series_format, series_status, chapter_workflow, reading_direction, analytics_event_type) — values unchanged, so zod/session checks untouched; JSON-as-String columns kept (jsonb deferred to B).
- Versioned migration generated OFFLINE (`prisma migrate diff --from-empty --to-schema-datamodel`, no DB connection) → prisma/migrations/20260927220347_init/migration.sql + migration_lock.toml; SQL reviewed: 6 enums, 7 tables, 6 unique indexes, 7 FKs (CASCADE for chapter/page/progress, SET NULL for analytics), TIMESTAMP(3) defaults. `db push` script REMOVED from package.json.
- src/lib/db.ts rewritten: lazy Proxy client — fails LOUDLY at first DB use on missing DATABASE_URL or non-postgres scheme (sentinel messages contain variable NAMES only, never values); explicit `datasourceUrl` so Prisma's own .env auto-loading can't override; build stays env-independent (all DB routes already force-dynamic).
- Supabase cleanup: supabase/migrations/0001_release_a_schema_rls.sql moved to docs/archive/supabase-sql-not-executed/ with a NOT-EXECUTED banner; ARCHITECTURE §4/§5 and queries.ts comments corrected — NO database-level RLS exists or is claimed; enforcement = app layer (middleware → layout → requireRole) + PG enums/FKs/uniques.
- Ops tooling: scripts/with-env.mjs (loads .env.local for Prisma CLI without printing values); npm scripts db:status / db:migrate:deploy / db:migrate:dev / db:seed / db:studio / db:reset / typecheck; .env.example (names only); README fully rewritten (Neon env table, migrate/seed commands, rollback/PITR guidance, "What is enforced where" matrix).
- scripts/verify-neon-constraints.mjs prepared (post-migration): tables/enums/column-types/uniques/FK-rules/timestamp-defaults + behavior probes (enum 22P02, unique 23505, FK 23503, cascade delete, role values) with cleanup; scripts/db-failsafe-check.mjs + failsafe-probe.ts.
- DEBUGGING NOTE (bun env semantics, cost 3 iterations): bun injects project .env at boot AND @prisma/client re-loads it at module load (tryLoadEnvs) — probe now normalizes process.env AFTER import, before first client use.
- QA (offline, all green): typecheck CLEAN (incl. seed.ts — fixed pre-existing createMany 'never' error + enum casts), lint CLEAN, production build GREEN with NO Neon URLs (all DB routes ƒ dynamic; only /login + /_not-found static), fail-safe checks 3/3 PASS (missing env → sentinel; sqlite file: → sentinel; unreachable PG → loud PrismaClientInitializationError, no silent fallback). Commits: ce9e196, 26ad6b9.

Stage Summary:
- OFFLINE PREPARATION 100% COMPLETE; NOTHING has been applied to Neon (no migration command run against any remote database — gate honored).
- BLOCKED ON: founder pasting BOTH Neon connection strings into /home/z/my-project/.env.local: DATABASE_URL = POOLED url (hostname contains -pooler) and DIRECT_URL = direct url (no -pooler) — copied from the Neon dashboard, never typed by hand, never pasted into chat.
- NEXT (once .env.local exists): bun run db:status → db:migrate:deploy → node scripts/verify-neon-constraints.mjs → db:seed ×2 (idempotency proof) → restart dev/standalone → runtime QA (guest browse, reader progress persistence via Server Action, admin auth + publish reflected publicly from Neon) → final migration report (files, schema deltas, test results, Neon limitations, no-secret confirmation). Release B stays blocked until this QA completes.

---
Task ID: A-NEON (Phase 2: pooled URL received — gate still active for DIRECT_URL)
Agent: Super Z (main agent, lead product engineer)
Task: Founder pasted the Neon POOLED connection string into chat; store securely, verify read-only, remain stopped on migration until DIRECT_URL arrives.

Work Log:
- SECURITY: founder pasted a live credential into chat (against own rule). Stored VERBATIM into .env.local as DATABASE_URL (caught + fixed one transcription slip against the original paste; final file byte-checked). .env.local: chmod 600, gitignored, untracked, never printed. Recommended password rotation in the report. DIRECT_URL NOT derived by hostname mutation (founder rule).
- SANDBOX HAZARD FOUND & FIXED: the sandbox exports a stale scaffold DATABASE_URL (sqlite file:) as an ambient shell env var that out-precedes .env.local for bun/Next/Prisma-CLI. Hardening (commit 61e69cf):
  * src/lib/db-url.ts resolveDatabaseUrl(): postgres-scheme process.env → .env.local (one-time name-only warning) → undefined; db.ts single sentinel error; explicit datasourceUrl keeps Prisma's env auto-loading out of the picture.
  * with-env.mjs: .env.local keys OVERRIDE ambient env for all db:* CLI commands.
  * dev/start scripts: `env -u DATABASE_URL -u DIRECT_URL` prefix; stale DATABASE_URL line removed from untracked .env (NEXTAUTH_* kept).
  * failsafe runner moved to cwd=/tmp (resolver can't see project .env.local → true-absence semantics); sentinel message unified; re-verified 3/3 PASS + typecheck 0 errors + lint clean.
- READ-ONLY verification of pooled URL (SELECT 1 + counts only — no migration command): pooled=true, sslmode=require accepted, channel_binding=require accepted by Prisma without adjustment, connectivity OK, public tables = 0 (empty baseline), PostgreSQL server_version 18.6.
- NOTHING has been migrated, seeded, or schema-touched on Neon (gate honored).

Stage Summary:
- Pooled URL stored + verified working; empty DB confirmed — safe to proceed the moment DIRECT_URL arrives.
- BLOCKED ON: DIRECT_URL = the direct (non-pooled) string for the same project/role/db (hostname WITHOUT "-pooler"), copied from Neon dashboard "Connect" with the Pooled toggle OFF, into .env.local as DIRECT_URL=...
- NEXT on receipt: db:status → db:migrate:deploy (20260927220347_init) → verify-neon-constraints.mjs → db:seed ×2 → runtime QA (guest/progress/admin/publish from Neon) → final report. Release B remains gated.

---
Task ID: A-NEON (Phase 3: identical pooled URL re-received — DIRECT_URL gate still held)
Agent: Super Z (main agent, lead product engineer)
Task: Founder pasted a connection string in chat again; determine if it is new information; re-verify staged readiness; keep the no-migration gate active.

Work Log:
- Hash-equality compare of the pasted string vs stored .env.local DATABASE_URL (values never printed): IDENTICAL — byte-for-byte the same pooled URL from Phase 2. No new information.
- DIRECT_URL line in .env.local inspected by emptiness/shape only: EMPTY PLACEHOLDER (no value). Gate blocker unchanged.
- Security re-check: .env.local chmod 600, matched by .gitignore (.env*), untracked; only .env.example tracked in git.
- READ-ONLY re-probe of stored pooled URL (SELECT 1 + table count, no migration command): connectivity OK, pooled=true, sslmode+channel_binding accepted, public tables = 0 (still empty — nothing has ever been applied to Neon), PostgreSQL server_version 18.6.
- Confirmed staged assets intact: prisma/migrations/20260927220347_init/migration.sql + migration_lock.toml; db:status / db:migrate:deploy / db:seed / verify-neon-constraints.mjs all present.
- NOTHING migrated, seeded, or schema-touched on Neon (one-URL stop condition honored). DIRECT_URL still NOT derived (founder rule).

Stage Summary:
- Readiness re-confirmed end-to-end; the single remaining blocker is DIRECT_URL (same project/role/db, hostname WITHOUT "-pooler"), copied from Neon Console → Connect → "Pooled connection" toggle OFF.
- Plan B offered to founder: explicit reply "derive it" authorizes constructing DIRECT_URL from the verified pooled host (strip -pooler), validated by a READ-ONLY probe BEFORE any migration command, logged as a founder-approved exception to the no-derivation rule.
- NEXT unchanged upon DIRECT_URL availability: db:status → db:migrate:deploy → verify-neon-constraints.mjs → db:seed ×2 (idempotency) → restart + runtime QA (guest browse, reader progress persistence, admin auth, publish reflected from Neon) → typecheck/lint/build → final migration report. Release B remains gated.

---
Task ID: A-NEON (Phase 4: DIRECT_URL received — migration executed and fully verified)
Agent: Super Z (main agent, lead product engineer)
Task: Founder delivered the direct (non-pooled) connection string; execute the full migration chain: store → migrate deploy → constraint verification → seed ×2 → production runtime QA → final report.

Work Log:
- Stored DIRECT_URL verbatim via scripts/set-env-local.mjs (stdin, never echoed; 0600 kept); verified shape by metrics only: direct (no -pooler), sslmode=require present, distinct from DATABASE_URL. GATE CLEARED.
- db:status (baseline): 1 migration found, not applied — confirmed gate had held. db:migrate:deploy: 20260927220347_init applied successfully. db:status: "Database schema is up to date!".
- verify-neon-constraints.mjs: first run exposed a SCRIPT bug (unquoted camelCase identifiers → PG folds titleAr→titlear, 42703; Prisma wraps raw failures as P2010 with real code in meta.code). FIXED (quoted identifiers, pgCode() helper, probes supply updatedAt — @updatedAt has no DB default). Re-run: 27/27 PASS — tables, 6 enum label sets, enum-typed columns, 6 unique indexes, 7 FK rules, createdAt default; behavioral probes: 22P02 (invalid enum), 23505 (duplicate slug), 23503 (orphan FK), cascade delete proven; probes cleaned up.
- Seed ×2 idempotency PROOF: identical counts both runs (series 6, chapters 26, pages 220, profiles 3, collections 2, progress 3, events 318).
- typecheck CLEAN, lint CLEAN, production build GREEN (all DB routes ƒ dynamic; only /login + /_not-found static).
- Sandbox lesson: detached background servers are reaped between tool calls (su-session cleanup) — every QA phase ran as one self-contained call (setsid server start → agent-browser steps → DB peek).
- Runtime QA (standalone production build reading Neon via pooled URL): guest home renders all 6 series RTL (zero errors); reader sign-in → webtoon read → progress persisted (readingProgress 3→4, events +2) via Server Action; admin 3-layer guard admits admin → dashboard live metrics (321 events); publish flow: review ch6 wedding-of-the-red-moon → published via Radix select (23→24 published), publish date stamped, publicly visible to GUESTS "today"; manga reader renders (p1/11, RTL nav). qa-neon-home.png saved.
- NON-BLOCKING finding (honest log): one minified React #418 hydration warning during session; pages fully functional; suspected pre-existing relative-date rendering — queued to Release C polish audit.
- Secrets discipline: no credential ever printed to chat/logs/commits/reports; .env.local 0600 + gitignored + untracked (verified post-run). Rotation recommendation recorded.
- Wrote docs/MIGRATION_REPORT.md (outcome, two-URL table, applied schema, verification results, fixes, Neon limitations/open security decisions, secrets confirmation, rollback pointers). Committed.

Stage Summary:
- NEON MIGRATION COMPLETE AND VERIFIED END-TO-END: versioned migration applied, 27/27 constraint checks, idempotent seed ×2, production runtime QA green. Release B gate ① (migration QA) CLEARED.
- Release B still gated by ② source-document reconciliation (FD-1) — founder has not yet delivered the four docs.
- Open items: password rotation post-cutover (recommended), prisma.config.ts before Prisma 7, React #418 → Release C.

---
Task ID: B (Release B — Complete Demo Experience)
Agent: Super Z (main agent, lead product engineer)
Task: Founder directed "ok continue" after migration QA cleared gate ①; recorded as FD-10 (proceed without source docs, reconciliation post-hoc); build the full Release B scope per RELEASE_PLAN.

Work Log:
- Recorded FD-10 in docs/FOUNDER_DECISIONS.md with rationale; Release B build started.
- B-1 SCHEMA: two versioned migrations generated offline and deployed to Neon — (1) 20260927230754_release_b_novel_library_community: series_format+='novel', enums library_shelf/comment_status, tables LibraryItem/Comment/CommentReport/Rating (composite uniques, FK CASCADE), Chapter.novelBody; (2) 20260927231129_release_b_scheduler: Chapter.scheduledFor. Constraint verifier extended for B schema: 41/41 PASS. Caught + fixed two verifier bugs during extension (table_name IN filter missing LibraryItem/Comment; probe value 'novel' became valid → switched to 'audiobook').
- B-2..B-5 CODE: constants (+novel/shelves/comment status), queries (+liveChapterWhere() public rule = published AND not future-scheduled, applied to every public surface; library/updates/comments/ratings/profile/admin-moderation/users/collections/dashboard queries), actions (setLibraryItem, markSeriesRead, postComment, reportComment, setRating w/ aggregate recompute, updateProfile, moderateComment, deleteComment, upsertCollection, deleteCollection, setUserRole w/ self-demotion guard; chapter schemas + scheduledFor/novelBody), UI (novel reader + route, LibraryButton/LibraryCardActions/RatingWidget/CommentsSection/ProfileSettings/RoleSelect/ModerateActions/CollectionForm/ActivityChart, /library /updates /profile /admin/moderation /admin/collections /admin/users, dashboard chart+community cards, scheduler inputs in chapter forms, chrome nav 5-item with المكتبة/التحديثات, format typing widened everywhere).
- B-6 SEED: scripts/release-b-data.mjs — 6 new series (4 novels × 3 chapters of original Arabic prose, 1 manga, 1 webtoon w/ scheduled ch4), 24 comments (1 flagged spam, 1 hidden), 21 ratings, 2 reports, 7 library items, novels collection "أصوات مُحبَّرة". generate-art.mjs: 6 new motifs, novel skip, 299 files. Seed ×2 idempotent (byte-identical counts: series 12, chapters 46, pages 287, collections 3, libraryItems 7, comments 24, ratings 21, reports 2).
- B-7 QA: typecheck 0 errors, lint clean, production build green (new dynamic routes /library /updates /read/novel /admin/users /admin/moderation /admin/collections). Browser E2E (one-call pattern, standalone+Neon): guest home 12-series markers; novel series page word-counts; novel reader prose + sepia theme switch; scheduler badge "ينشر قريبًا" public; reader library tabs + unread badges; comment posted → Neon 24→25 → renders; rating widget state; admin moderation hide → flagged→hidden DB-verified; users roles + self-guard; collections CRUD screens; dashboard chart + community pulse. Screenshots saved.
- INCIDENT (resolved): stale standalone server from migration QA still held port 3000 with the pre-B Prisma client → transient 500 ('novel' not found in enum). Killed stale process; fresh build verified. Documented in report.
- Deliverables: README rewritten to Release B (feature matrix), docs/RELEASE_B_REPORT.md, screenshots research/qa-neon-b-dashboard.png.

Stage Summary:
- RELEASE B COMPLETE: novel reader + library/updates/profile + community + moderation + collections/users/dashboard + scheduler + 12-series seed, all on Neon, browser-verified end to end.
- Live chapter rule introduced app-wide: workflow=published AND scheduledFor<=now; scheduled chapters surface publicly as "ينشر قريبًا".
- Open: source-doc reconciliation stays post-hoc (FD-10); Release C next (RTL/responsive audit, error/empty states, monitoring placeholders, accessibility, security audit, deployment docs) + React #418 audit + prisma.config.ts + Neon password rotation recommendation.

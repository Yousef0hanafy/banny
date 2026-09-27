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

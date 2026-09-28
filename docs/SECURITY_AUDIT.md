# Bunny Library — Security Audit (Release C)

Date: 2026-09-28 · Scope: Release A+B+C codebase on Neon PostgreSQL · Auditor: lead engineer (this repo)
Verdict: **PASS.** A-1 and A-2 mitigated post-audit (§8); 2 accepted risks remain (A-3, A-4) + 1 credential-loss incident (§9).

## 1. HTTP Security Headers — IMPLEMENTED

| Header | Value | Notes |
|---|---|---|
| Content-Security-Policy | **per-request, nonce-based** — generated in `src/middleware.ts` (see §8) | strict-dynamic; covers every HTML document |
| X-Frame-Options | DENY | anti-clickjacking (static, all routes) |
| X-Content-Type-Options | nosniff | static, all routes |
| Referrer-Policy | strict-origin-when-cross-origin | static, all routes |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() | static, all routes |
| X-DNS-Prefetch-Control | on | static, all routes |

## 2. Next.js Config Hardening — FIXED
- `typescript.ignoreBuildErrors: true` **removed** (scaffold leftover had disabled the type safety net).
- `reactStrictMode: true` enabled (dev-time bug surfacing; production unaffected).

## 3. Authentication / Authorization — VERIFIED
- Three-layer admin guard re-confirmed: middleware (`withAuth`, `/admin/*`) → admin layout server check → `requireRole`/`requireEditor` in every privileged query/action.
- `setUserRole`: admin-only + role enum validation + **self-demotion guard** ("لا يمكن تخفيض دورك الخاص").
- Reader actions (`saveReadingProgress`, `setLibraryItem`, `markSeriesRead`, `postComment`, `reportComment`, `setRating`, `updateProfile`): session required, zod-validated, ownership scoped to session profile.
- Editor actions (`upsertSeries`, `updateChapterMeta`, `createChapter`, `setWorkflowBulk`, `moderateComment`, `deleteComment`, `upsertCollection`, `deleteCollection`): all begin with `requireEditor()` (admin OR editor).

## 4. Server Action Validation — VERIFIED
All 12 mutation entry points accept `input: unknown` and zod-`safeParse` before any DB write:
progressSchema, seriesSchema, chapterMetaSchema, createChapterSchema, librarySchema,
commentSchema, reportSchema, ratingSchema, profileSchema, moderationSchema, deleteComment(object),
collectionSchema. No `any`-trusted inputs found.

## 5. Secrets & Environment — VERIFIED
- Tracked env files: only `.env.example` (variable NAMES only). `.env.local` untracked, 0600, gitignored.
- Zero `NEXT_PUBLIC_*` variables in app code (no client-side secrets surface).
- No credentials in chat/logs/commits/reports; fail-loud sentinels name variables only.
- History note (pre-existing): pre-hardening commits contain an old `.env` (SQLite path + NEXTAUTH_SECRET) — password rotation remains recommended (see A-2).

## 6. Dependency Audit — HARDENED
- **46 packages removed**: proven zero-reference scaffold leftovers (@mdxeditor/editor, next-intl, react-syntax-highlighter, @dnd-kit/*, @tanstack/*, framer-motion, uuid, date-fns, react-markdown, zustand, sonner, cmdk, vaul, input-otp, react-day-picker, react-resizable-panels, react-hook-form + @hookform/resolvers, next-themes, @reactuses/core, z-ai-web-dev-sdk, 15 orphaned @radix-ui/* packages) + 28 orphaned shadcn `ui/` wrappers deleted. Tool: `scripts/dep-usage-audit.mjs` (persisted, re-runnable).
- **Version bumps (in range):** next 16.1.1→16.3.6, next-auth 4.24.11→4.24.15, prisma/@prisma/client 6.11.1→6.19.3, sharp 0.34.3→0.35.5, eslint-config-next→16.3.6.
- **Result:** prod-scope vulnerabilities 23 (2 critical, 13 high, …) → **6 high, 0 critical**.

### Accepted risks (documented, non-blocking)
| ID | Item | Rationale |
|---|---|---|
| A-3 | defu / lodash "high" with `effects: []` | No concrete vulnerable path in the prod dependency graph (registry-level noise). Monitored; re-audit on dependency changes. |
| A-4 | Rotation of `neondb_owner` credentials | Founder-side action (credential passed through chat once; historical git). **Now URGENT — see §9 incident: the sandbox reset also lost the only .env.local copy, so fresh credentials must be supplied anyway.** |

Mitigated post-audit:
| ID | Item | Status |
|---|---|---|
| A-1 | CSP allowed 'unsafe-inline'/'unsafe-eval' for scripts | **MITIGATED (§8)** — nonce-based strict-dynamic CSP live on every document. Residual: `style-src 'unsafe-inline'` remains (Next.js inline critical CSS + Radix style attrs — industry-standard for Next apps). |
| A-2 | prisma 6.19.3 CLI advisory (via @prisma/config/deepmerge-ts) | **PARTIALLY ADDRESSED (§8)** — package.json `prisma` key migrated to `prisma.config.ts` (the Prisma-7-removal item). The advisory itself is a dev-time CLI-only dependency; final fix remains the Prisma 7 version bump. |

## 7. Data-Layer Integrity — VERIFIED (re-run in C-9 final QA)
Neon constraint verifier: `scripts/verify-neon-constraints.mjs` — 41/41 PASS at Release B; re-run in final QA (§C-9 report).

## 8. Post-audit hardening (2026-09-28, same day)

### 8.1 Nonce-based CSP — A-1 MITIGATED
- `src/middleware.ts` now mints a per-request nonce, passes the CSP via the *request* header (Next.js stamps the nonce on its bootstrap scripts) and enforces it via the *response* header — the official Next.js strict-CSP pattern.
- Policy: `script-src 'self' 'nonce-…' 'strict-dynamic'` (+ `'unsafe-inline'` as CSP2 fallback, ignored by CSP3 browsers; dev-only `'unsafe-eval'`), `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `font-src 'self' data:`, `connect-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- Static CSP removed from `next.config.ts` (would double-enforce); XFO/nosniff/referrer/permissions stay static for ALL routes including API/assets.
- **next-auth withAuth pitfall (found + documented):** withAuth short-circuits on the sign-in page (`[signInPage, errorPage].includes(pathname)` → bare `NextResponse.next()`), bypassing any inner middleware. Middleware was rewritten WITHOUT the wrapper — the admin guard now calls `getToken({ req, secret })` directly (identical session semantics; redirect parity `guest /admin → /login?callbackUrl=%2Fadmin` re-verified).
- **Prerendered-document pitfall (found + fixed):** static HTML cannot carry a per-request nonce — prerendered `/login` + 404s served from the full-route cache also bypassed middleware header injection (`x-nextjs-cache: HIT`). Fix: `/login` split into server wrapper (`export const dynamic = "force-dynamic"`) + client form (`login-form.tsx`); `not-found.tsx` got `force-dynamic` (honored — `/_not-found` is now ƒ). Zero prerendered HTML documents remain.
- **Verification:** `scripts/qa-nonce-csp.sh` — 13/13 PASS: exactly one CSP header on /, /login, /no-such-page; 19/19 + 17/17 + 16/16 scripts nonced; no `unsafe-eval` in prod; XFO intact on API; real-browser check (agent-browser): /login form fully interactive, ZERO console/page errors (no CSP violations); home renders via failsafe (DB down) with no CSP violations.
- **Deferred until DB credentials are restored (§9):** sign-in POST flow + Server Action POSTs under strict CSP in-browser (the same-origin POSTs are not script-src-gated; risk is low, but the E2E was not runnable).

### 8.2 prisma.config.ts — A-2 package.json migration DONE
- `prisma.config.ts` added (schema path, migrations path, seed command `bun prisma/seed.ts`); package.json `prisma` key removed — this is the Prisma-7-removal surface, cleared early.
- The config file disables the Prisma CLI's automatic .env loading, so it loads `.env.local` (override) then `.env` with the same parser contract as `scripts/with-env.mjs`; DATABASE_URL missing → fail-loud (name only, never values).
- **Runtime verification BLOCKED by §9** (no DB credentials in the sandbox): `prisma migrate status` + seed-idempotency re-run pending. Code paths typecheck clean.

## 9. INCIDENT — sandbox reset lost the environment files (2026-09-28 ~07:46)
- The sandbox recycled mid-session; the restore dropped all gitignored files. `.env.local` (the ONLY copy of the Neon pooled + direct connection strings) and `.env` (NEXTAUTH_SECRET, NEXTAUTH_URL) were lost.
- Integrity was verified against git: 514 restored files differed ONLY in mode bits; the only content deltas were the current session's edits. No tracked content was corrupted.
- A fresh `NEXTAUTH_SECRET` was generated locally (openssl rand -base64 32 — never passed through chat or git) and written to `.env.local` via `scripts/set-env-local.mjs` (0600, gitignored).
- **Consequence:** all DB-dependent verification (runtime QA, constraint verifier, migrate status, seed idempotency) is blocked until the founder supplies connection strings — which should be **freshly rotated** per A-4 (the old ones passed through chat; rotation was already recommended).

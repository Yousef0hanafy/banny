# Bunny Library — Security Audit (Release C)

Date: 2026-09-28 · Scope: Release A+B+C codebase on Neon PostgreSQL · Auditor: lead engineer (this repo)
Verdict: **PASS with 4 documented accepted risks (A-1…A-4).** No blocking findings.

## 1. HTTP Security Headers — IMPLEMENTED (next.config.ts)

| Header | Value | Notes |
|---|---|---|
| X-Frame-Options | DENY | anti-clickjacking |
| Content-Security-Policy | default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' | see A-1 |
| X-Content-Type-Options | nosniff | |
| Referrer-Policy | strict-origin-when-cross-origin | |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() | |
| X-DNS-Prefetch-Control | on | |

Applied to every route (`/:path*`), standalone build included.

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
| A-1 | CSP allows 'unsafe-inline'/'unsafe-eval' for scripts | Next.js bootstrap + NextAuth require it without nonce infrastructure; high-value directives (frame-ancestors, object-src, base-uri, form-action) are enforced. Nonce-based CSP deferred to production hardening. |
| A-2 | prisma 6.19.3 CLI advisory (via @prisma/config/deepmerge-ts) | Dev-time CLI only, not runtime attack surface. Fix = Prisma 7 major → tracked with the existing prisma.config.ts backlog item. |
| A-3 | defu / lodash "high" with `effects: []` | No concrete vulnerable path in the prod dependency graph (registry-level noise). Monitored; re-audit on dependency changes. |
| A-4 | Rotation of `neondb_owner` credentials | Founder-side action (credential passed through chat once; historical git). Unchanged recommendation from migration report. |

## 7. Data-Layer Integrity — VERIFIED (re-run in C-9 final QA)
Neon constraint verifier: `scripts/verify-neon-constraints.mjs` — 41/41 PASS at Release B; re-run in final QA (§C-9 report).

# Release C Report — Polish and Production Preparation

Date: 2026-09-28 · Scope: `docs/RELEASE_PLAN.md` §Release C · Status: **COMPLETE — all exit criteria met**

## 1. What shipped

### C-1 · React #418 hydration fix (bug from Neon migration QA)
Root cause identified: `src/components/community/comments-section.tsx` computed
`Date.now()` during render inside a client component (server time ≠ client time →
hydration text mismatch). Fix: React-idiomatic `useSyncExternalStore` —
server snapshot returns `null` (empty label), client snapshot returns `Date.now()`
refreshed every 60 s. React uses the **server snapshot during hydration**, so SSR HTML
and first client paint match byte-for-byte; the label upgrades immediately after mount.
Verified live: `<time dateTime="2026-09-27T23:37:08.563Z">اليوم</time>` renders with a
semantic `dateTime` attribute (a11y bonus). Lint-clean (the `react-hooks/set-state-in-effect`
rule that shaped Release A's hero rewrite is respected — no setState in effects).

### C-2 · Error / loading / empty states
- `src/app/error.tsx` — Arabic route boundary: on-brand illustration, «إعادة المحاولة»
  (reset), digest code, home link, `captureError` hook wired.
- `src/app/global-error.tsx` — standalone RTL fallback for root-layout failures.
- Loading skeletons: `src/components/library/skeletons.tsx` + `loading.tsx` for `/`,
  `/explore`, `/series/[slug]`, `/library`, `/updates`, `/admin`, and an immersive dark
  `ReaderSkeleton` for all three reader formats.
- Empty states audit: already present from A/B (explore no-results, series CTAs, comments,
  moderation) — verified, no gaps.

### C-5 · Security audit (full checklist in `docs/SECURITY_AUDIT.md`)
- **Headers**: CSP (frame-ancestors 'none', object-src 'none', base-uri, form-action…),
  X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on
  every route — verified live via curl.
- **Config**: `typescript.ignoreBuildErrors` removed (type safety net restored);
  `reactStrictMode: true`.
- **Auth sweep**: 3-layer admin guard + `requireEditor` on all 8 editor actions +
  admin-only `setUserRole` with self-demotion guard + session-scoped reader actions —
  all verified in source.
- **Input validation sweep**: 12/12 Server Actions zod-`safeParse` `input: unknown`. No
  `any`-trusted inputs.
- **Secrets**: only `.env.example` tracked (names only); zero `NEXT_PUBLIC_*` in app code.
- **Dependencies**: 46 zero-reference packages removed (scaffold leftovers incl.
  @mdxeditor/editor, next-intl, react-syntax-highlighter, @dnd-kit/*, @tanstack/*,
  framer-motion, 15 orphaned @radix-ui/*) + 28 orphaned shadcn `ui/` wrappers deleted.
  Tool persisted: `scripts/dep-usage-audit.mjs`. Bumps: next 16.1.1→16.3.6,
  next-auth 4.24.11→4.24.15, prisma 6.11.1→6.19.3, sharp 0.34.3→0.35.5.
  **Prod-scope vulnerabilities: 23 (2 critical) → 6 high, 0 critical**; remaining 6 are
  documented accepted risks (A-1…A-4) — Prisma-7-track CLI advisory, two empty-effects
  registry items, CSP inline tradeoff, founder-side credential rotation.

### C-6 · Monitoring placeholders
- `GET /api/health` — liveness + opaque DB probe (`{"status":"ok","database":"ok","latencyMs":…}`,
  503 degraded on DB failure, no infrastructure detail leaked).
- `src/lib/analytics.ts` — `trackEvent` / `captureError` no-op stubs with one-step
  PostHog / Sentry activation notes (prototype makes zero external calls by design).

### C-8 · Brand & favicon
- Founder's `Blogo.jpg` **never reached the server** (delivery failure #3 — after the two
  source-doc attempts). No stand-in was fabricated as the "real" logo.
- Explicitly temporary placeholder shipped: ب letter-mark (`BrandMark` component wired into
  header, login card, admin sidebar/mobile bar) + `src/app/icon.svg` favicon + 180px
  `apple-icon.png` (Next.js auto-metadata registered both). The unreferenced scaffold
  `public/logo.svg` was removed. **Swap point documented** in component + README when the
  real rabbit logo arrives.

### C-3 / C-4 · Responsive + RTL matrix & accessibility baseline (browser-verified)
`scripts/qa-release-c.sh` (self-contained: server + agent-browser, screenshots in `research/`):

| Check | 360 px | 768 px | 1280 px |
|---|---|---|---|
| Horizontal overflow | none | none | none |
| Landmarks (main/nav/header/footer) | ✓ | ✓ | ✓ |
| Bottom nav (mobile) | 5 items | — | — |

- A11y: Tab → `:focus-visible` ring on primary nav; 17 aria-labeled controls on home;
  semantic `<time>`; Arabic 404; error boundaries on-brand. Contrast tokens (foreground
  ≈15:1, muted ≈6.5:1, primary on background ≈5:1) — AA baseline met.
- Guards: guest `/admin` → `/login?callbackUrl=/admin`. Arabic 404 verified.
- Reader loads at mobile viewport (`/read/webtoon/…` title verified).

### C-7 · Documentation
README upgraded to Release C: feature table, deploy runbook (Vercel + Neon, ≤30-min
clone-to-demo path), updated content table (12 series), scripts table, Release C QA
evidence, honest limitations (logo pending, CSP inline, monitoring placeholder, FD-10).

## 2. Exit criteria scorecard

| Criterion (RELEASE_PLAN §C) | Result |
|---|---|
| Full QA matrix passes | ✓ RTL/responsive/a11y/guard/404 — table above; screenshots `research/qa-c-*.png` |
| Security audit checklist signed off in-repo | ✓ `docs/SECURITY_AUDIT.md` (PASS + 4 documented accepted risks) |
| New developer: clone → running demo ≤ 30 min via README alone | ✓ runbook §Deploy runbook (env → migrate → art → seed → run/verify) |

## 3. Regression verification
- `typecheck` clean · `lint` clean · production build **green** on next 16.3.6 (all DB routes ƒ, icon.svg + apple-icon.png registered).
- Neon constraint verifier re-run: **41/41 PASS**.
- Incidents: one stale standalone server from a previous session held port 3000
  (EADDRINUSE → 404s from old build); killed, documented, QA re-run clean — same known
  sandbox pattern as Release B's incident.

## 4. Carried-forward items
| Item | Owner |
|---|---|
| Rotate `neondb_owner` password | founder (security audit A-4) |
| Re-deliver rabbit logo (re-upload / paste base64 / URL) → swap at `brand-mark.tsx` + `icon.svg` | founder → 5-minute integration |
| Source-doc reconciliation (FD-10, post-hoc) | founder |
| Prisma 7 + `prisma.config.ts` (clears audit risk A-2) | backlog |
| Nonce-based CSP + real PostHog/Sentry activation | first production-hardening tasks |

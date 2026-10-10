# Bunny reader design implementation plan

> **For agentic workers:** execute as one Antigravity implementation package using executing-plans, with the coordinator integrating and one combined checkpoint review. User-approved review cadence overrides per-component review/commit ceremonies.

**Goal:** Implement the approved discovery and reading design over existing functional behavior, with four real content categories separate from reader format.

**Architecture:** Extend existing queries and shared library components, adding category as nullable metadata. Preserve the three reader route families, server authorization, publication rules, guest/account progress and community actions. Build responsive public views from real data; no sample-board import.

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind, Prisma 6/PostgreSQL, existing Radix and Lucide, existing isolated Playwright QA runner.

**Spec:** PRODUCT.md, DESIGN.md; complete confirmed UX brief at C:/Users/user/.codex/visualizations/2026/10/09/bunny-discovery-design/visual-direction.md.

## Constraints

Keep self-hosted Arabic font, NextAuth, C1 access checks, existing URLs/progress, functional settings, notifications/comments/ratings. No dependency replacement, live database, real-content import, generated screenshot embedding, pricing, Anime or production deployment. UI mockup illustrations are not actual covers. Additive category migration only; keep unclassified legacy webtoon explicit.

## Package tasks

- [x] Category foundation: prisma/schema.prisma, new additive migration, src/lib/constants.ts, src/lib/queries.ts, src/lib/actions.ts and the existing create/update series controls. Add manga/manhwa/novel/comic metadata independently of format; retain old format filters and validate category/reader compatibility. Use existing action authorization. Add meaningful tests for filtering/validation and legacy unknown mapping before changing behavior.
- [x] Shared visual foundation: src/app/globals.css, src/components/library/chrome.tsx, series-card.tsx, continue-reading-hero.tsx and small dedicated shared components. Maintain responsive theme/accessibility and real guest/returning state. Avoid unrelated admin redesign.
- [x] Home and explore: src/app/page.tsx, src/app/explore/page.tsx, explore-filters.tsx and affected queries. Show actual category entries; group latest chapters per work; use real collection titles; desktop filter panel and mobile dialog, URL synchronization, true result count, meaningful empty state. Preserve search scoring and suggestion behavior.
- [x] Work page: src/app/series/[slug]/page.tsx and dedicated client chapter-list/tab components. Keep actual start/resume destination, library/community actions and live chapter filtering. Chapter search/order and read/progress states must work, not just render.
- [x] Readers: existing manga/webtoon/novel reader components and reader-tool components. Apply compact visual tools and optional focus mode without rewriting navigation, double-page bounds, long-scroll progress or novel settings. Preserve existing acceptance journeys.
- [x] Checkpoint: worker runs narrow meaningful tests, Prisma validation and typecheck. Coordinator independently runs lint/typecheck and one isolated QA build/browser checkpoint with new category/discovery journeys plus existing reader/access regressions. Capture home/explore/work/reader at desktop+mobile once. Fix material failures in one batch, confirm only affected cases. Review/integrate after evidence; no repeated full-suite loops for minor CSS.

## Acceptance

All four content categories filter by persisted category, not guessed layout. Unknown legacy webtoon is accessible without inaccurate classification. Novel category/text layout compatibility is enforced. Reader URLs/progress survive. Search/filter count, clear controls, work chapter tabs/search/order and reading actions are functional. Current live chapter privacy and assigned-team restrictions survive. No mockup statistics or credits enter application data. Responsive screenshots show content-led composition and no obstructive controls/overflow. Migration is checked on isolated PostgreSQL only; report actual gate results and remaining deployment requirements.

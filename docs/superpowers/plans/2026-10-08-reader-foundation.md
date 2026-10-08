# Reader Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. التنفيذ عبر codex-delegate في مهمة محددة النطاق، مع مراجعة مستقلة وفق إعداد الـ fleet المعتمد.

**Goal:** Make chapter navigation, reader links and saved-position resume trustworthy, and prove those journeys against an isolated local PostgreSQL database on Windows.

**Architecture:** Keep the Next.js/Prisma app and existing three readers. Add a cross-platform isolated QA runner and browser regression suite, scope chapter navigation to its series, centralize reader URLs, and restore validated per-chapter progress before any persistence effect runs. No schema or publishing-role changes in this package.

**Tech Stack:** Existing Next.js, React, Prisma, TypeScript and embedded-postgres; Bun for existing seed tooling; Playwright for real browser regression tests.

**Spec:** `docs/superpowers/specs/2026-10-08-team-publishing-mvp-design.md`, sections 8, 9 phase B and 11. The publishing acceptance criteria in section 10 belong to phase C, not this package.

## Global Constraints

- No Anime; no import or publication of v4 assets.
- No production database access, production credentials, payment/download features, role changes or schema migrations.
- Preserve Arabic/RTL visual identity and the current framework; no unrelated redesign.
- QA must run against a temporary loopback-only database and leave no server processes running after success or failure.
- Child environment overrides must not read/write `.env.local` or overwrite the user's database variables.
- Implementers do not commit; the coordinator reviews, reruns gates and commits.
- Tests must show the original failure before implementation. Do not weaken regressions to obtain green results.

## Task 1 — Isolated Windows-capable regression harness

**Files:** Create `scripts/qa-reader.mjs`, `playwright.reader.config.ts`, `tests/reader/reader-foundation.spec.ts`; modify `package.json` and `bun.lock`; document the invocation in `README.md`.

**Interfaces:** `bun run test:reader` invokes `node scripts/qa-reader.mjs`. The runner launches a local PostgreSQL cluster and Next server, supplies their ports/URLs to child processes, deploys existing migrations, seeds original demo content, executes Playwright, and stops both services in `finally`. `READER_TEST_BASE_URL` is the browser suite's baseURL.

- [x] Add `@playwright/test` as a dev dependency and install Chromium for the local browser tests; retain the lockfile.
- [x] Make a runner that uses the installed embedded-postgres API and a fresh temporary directory. Listen only on 127.0.0.1, allocate unused ports, use a unique database, and supply `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, and a generated `NEXTAUTH_SECRET` only to test child processes.
- [x] Run Prisma directly using its installed JS entry point with `process.execPath`, not the existing `with-env` wrapper, because that wrapper can override the isolated database from `.env.local`. Seed via Bun with the same isolated environment.
- [x] Start Next directly with its installed JS entry point, with a bounded readiness timeout. Do not use shell-specific `env`, `tee`, `cp` commands from the historical package scripts.
- [x] Use bounded shutdown and terminate the recorded test process tree on Windows when necessary. Never kill processes identified only by a generic name or port. Verify the created data directory before cleanup.
- [x] Create regressions for tasks 2–4 below and run them against the unchanged app. Save failure evidence to the coordinator's external run artifacts.

Runner command:

```sh
bun run test:reader
```

Expected before fixes: the suite reaches the app and fails navigation, novel-link or progress assertions, rather than failing environment setup. No test may use an ambient or remote database URL.

## Task 2 — Correct chapter navigation and homepage reader links

**Files:** Modify `src/lib/queries.ts`, `src/app/page.tsx`; create `src/lib/reader-route.ts`; modify the task-1 regression suite. Reuse this helper at reader-link call sites touched by the fixes, without broad unrelated refactoring.

**Interfaces:** `readerHref(format: Format, seriesSlug: string, chapterNumber: number): string` returns `/read/${format}/${seriesSlug}/${chapterNumber}` for the existing validated Format vocabulary. `getChapterForReading` continues returning its current shape, but siblings belong to the requested series and are live/published only.

- [x] Seed/use at least two series with overlapping chapter numbers and a published chapter that exists only in the other series. Include a future-scheduled chapter.
- [x] Assert the first series' reader moves to its own next chapter, never itself or a chapter exclusive to the other series; future/draft chapters are excluded. Inspect real navigation links and their destinations, not source text.
- [x] Assert a novel listed in homepage updates links to `/read/novel/...` and opens the novel reader.
- [x] Watch these regressions fail against the old code.
- [x] Apply the scoped sibling query:

```ts
where: { seriesId: series.id, ...liveChapterWhere() }
```

- [x] Implement the route helper:

```ts
import type { Format } from "@/lib/constants";
export function readerHref(format: Format, seriesSlug: string, chapterNumber: number) {
  return `/read/${format}/${seriesSlug}/${chapterNumber}`;
}
```

- [x] Replace the homepage label-based manga/webtoon ternary with `readerHref(u.series.format, u.series.slug, u.number)`.
- [x] Rerun navigation regressions, including novel, manga and webtoon destinations.

Representative browser assertion (use the seed's actual slugs and accessible link labels):

```ts
const href = await page.getByRole("link", { name: /الفصل التالي/ }).getAttribute("href");
expect(href).toBe(`/read/manga/${seriesSlug}/2`);
```

## Task 3 — Restore paged-reader progress without resetting it

**Files:** Modify `src/lib/queries.ts`, `src/lib/progress-local.ts`, `src/components/readers/manga-reader.tsx`, `src/app/read/manga/[series]/[chapter]/page.tsx`; create `src/lib/reader-progress.ts` if shared selection/validation is needed; extend the regression suite.

**Interfaces:** Readers receive optional `initialProgress: { pageIndex: number; percent: number; updatedAt: number } | null` from the authenticated chapter-specific DB record. Guest lookup is restricted to the same series, chapter and format. If both records are eligible, use the newer timestamp; never mix chapters or trust malformed storage. Authenticated pages pass progress for their own session profile only.

- [x] Preload a guest progress record for page 3 of a multi-page manga chapter, open/reload it, and assert the displayed page is page 3 and local storage is not reset to page 1.
- [x] Add a different-chapter record and assert the current chapter starts at page 1. Add malformed JSON/invalid numbers and assert the reader remains usable. Clamp a valid stored page index when page count has shrunk.
- [x] Test an authenticated reader with chapter-specific server progress, with empty local storage, to prove cross-session resume.
- [x] Capture red results before implementation.
- [x] Resolve and validate progress once per reader identity before enabling writes. Block persistence until restoration finishes and session status has resolved; remount or reset restoration when series/chapter changes.
- [x] Do not write progress for premium-demo locked chapters or empty content. Preserve existing read-complete semantics for real content.
- [x] Rerun all manga regressions and confirm advancing a page persists its new position.

Representative assertion:

```ts
await expect(page.getByRole("img", { name: /صفحة 3 من/ })).toBeVisible();
await page.reload();
await expect(page.getByRole("img", { name: /صفحة 3 من/ })).toBeVisible();
```

## Task 4 — Restore scroll-reader progress and verify the package

**Files:** Modify `src/components/readers/webtoon-reader.tsx`, `src/components/readers/novel-reader.tsx`, their server route pages, and shared progress helpers; extend task-1 tests and `README.md`.

**Interfaces:** Scroll readers consume the same initialProgress interface. Stored percentage maps to the actual scrollable content range after font preferences/content layout are ready. Restoration finishes before the read-start mirror or scroll listener may save.

- [x] Store 45% progress for a webtoon and a novel, open each and assert the scroll ratio returns near 45%; reload and confirm the saved percentage is not replaced with 1%.
- [x] Test the novel after restoring a non-default font size so layout changes do not invalidate the resume position. Exercise desktop and a 390px mobile viewport.
- [x] Capture original red results. Restore scroll once layout is stable, with bounded observers/animation-frame work and cleanup; do not repeatedly force the user back to the saved position while they read.
- [x] Ensure future layout adjustments during initialization cannot save 0/1% over the selected saved position. Leave locked content progress unchanged.
- [x] Remove/reset read-start initialization that overwrites saved local progress; keep normal subsequent progress writes and completion behavior.
- [x] Rerun the complete browser suite. Add a locked-content and chapter-change check so navigating from one chapter does not carry the previous chapter's position.
- [x] Run the project gates using cross-platform direct entry points:

```sh
bun run lint
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/prisma/build/index.js generate
node node_modules/next/dist/bin/next build
bun run test:reader
```

Use harmless local placeholder database URLs only for generate/build when required; do not connect or migrate production. The standalone copy step in the existing build script is not part of Next's compile gate and must be reported separately if not executed.

- [x] Independently review the complete diff against the approved spec and this package's scope; fix correctness findings, rerun affected gates, then record results.
- [x] Coordinator commits the verified package on its work branch; no push, deployment, production migration or publication is included.

## Plan review

This plan implements the reader defects and isolated-test portion of phase B. It intentionally does not implement phase C publishing roles, taxonomy migrations, content ingestion or visual redesign. It preserves the existing three internal reader formats until the separate content-category model is designed. Each regression checks a user-visible behavior or a real database boundary rather than mirroring source text.

Verification: [2026-10-09 report](../reports/2026-10-09-reader-foundation-verification.md).

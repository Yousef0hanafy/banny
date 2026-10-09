# Team Access Foundation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for this bounded phase-C package. Antigravity owns file implementation; the coordinator owns terminal commands, tests, review and integration. No recursive delegation.

**Goal:** Introduce assigned contributor/editor workspaces with server-enforced boundaries and admin-only publication authority.

**Architecture:** Add a contributor enum value and a unique profile/series assignment relation. Reuse existing NextAuth/Prisma and admin forms; privileged reads and writes derive identity from the session and permissions from the current database profile. Restrict non-admin changes to assigned draft/review chapters. Keep existing admin publication temporarily until the separate revision/approval package.

**Tech Stack:** Next.js, Prisma/PostgreSQL, TypeScript, Bun's existing test runtime and Playwright/isolated QA runner.

**Spec:** `docs/superpowers/specs/2026-10-08-team-publishing-mvp-design.md`, sections 2, 4 and acceptance 1–3, 8–9. This is C1, not the complete publishing subsystem.

## Global Constraints

- Founder has approved the publishing design and now explicitly authorized starting this next package.
- Antigravity is the primary implementer (`gemini-3.8-flash-medium`, medium). After the measured write_file denial, the founder explicitly approved --dangerously-skip-permissions. This auto-approves all Antigravity tool permissions; the brief still restricts it to native file edits and the coordinator executes commands. No global fleet/config changes.
- Work only in the isolated `team-access-foundation` worktree. No production credentials/database, v4 import, deployment, category migration, real uploads, account provisioning or unrelated fixes.
- Keep Arabic/RTL identity; contributor/editor are capabilities, while author/translator remain credits.
- Existing public queries retain published-only chapter visibility. No approval/version state is invented in C1. Audit history, protected uploads and separating revisions remain explicit C2/D work.
- Do not modify `tests/reader/team-access.spec.ts`: this coordinator-authored regression is immutable. Add meaningful real action/DB checks, not source-text assertions.

## Task 1 — Role, assignment and authorization boundary

**Files:** `prisma/schema.prisma`; additive SQL migration under `prisma/migrations`; `src/lib/constants.ts`; a small server authorization module if needed; `src/lib/actions.ts`, `src/lib/queries.ts`.

**Interfaces:** `Role` includes `contributor`; `SeriesAssignment` uniquely links `profileId` and `seriesId` with foreign keys/cascades and a series index. `setSeriesAssignment(input: unknown): Promise<ActionResult>` accepts `{seriesId, profileId, assigned: boolean}`, derives its admin actor from the current database profile, and grants/revokes idempotently only for contributor/editor targets. No caller-supplied actor identity.

- [x] Coordinator reproduces unauthorized editor creation through the actual unchanged server action and immutable regression; preserve real failure/cleanup evidence. The browser regression separately covers draft visibility at the final checkpoint.
- [x] Add the enum/relation/migration without changing existing assignments or assigning every editor automatically.
- [x] Add fresh-profile staff/admin/moderator checks. No authorization uses the JWT's cached role alone; no circular imports between queries and new guards.
- [x] Make series create/update, collections changes and bulk workflow admin-only. Preserve editor/admin moderation; contributor cannot moderate.
- [x] Allow contributor/editor chapter creation only in assigned works, with draft/review workflow, no scheduling or premium flag. Permit metadata changes only to assigned stored draft/review chapters, limited to title, reading direction and draft/review workflow. Use a conditional database write including stored workflow and assignment membership, so a concurrently published chapter cannot be overwritten. Return clear forbidden/not-found/duplicate/conflict results.
- [x] Implement idempotent admin assignment mutation and reject reader targets. Re-check the target role transactionally. Revoke assignments when a user becomes a reader.
- [x] Make role changes transactional/serializable, re-reading the actor inside the transaction. Preserve self-downgrade protection and enforce at least one admin under concurrent cross-demotions; retry bounded serialization failures or return conflict.

## Task 2 — Scoped queries and usable team controls

**Files:** relevant `src/app/admin/{layout,page,series,chapters,collections,users}` pages, `src/app/studio/page.tsx`, `src/lib/queries.ts`, `src/components/admin/admin-client.tsx`, `role-select.tsx`, and new `team-assignment-panel.tsx`.

- [x] Enforce staff access inside privileged query helpers and pages themselves, since layout gating alone does not secure data fetching. Series/detail/chapters/studio expose only assigned works for non-admins; unassigned detail returns null/notFound. Scope new-chapter dropdown and fix its raw unscoped query. Preserve format filtering.
- [x] `/admin` gives non-admin staff a simple assigned-work landing view with no redirect loop. Global dashboard queries are admin-only. Readers/guests cannot read draft data even with a stale privileged JWT.
- [x] Include contributor in role labels/select. Let admins grant/revoke assignments from the existing series detail page. No new account/invite flow.
- [x] Hide public series editing/creation, collections/users/global links and publication/scheduling/premium controls from unauthorized roles. Draft/review controls remain usable for assigned staff; published chapter controls are read-only for them. Server checks remain authoritative against tampered requests.

## Task 3 — Focused acceptance and final checkpoint

**Files:** `tests/team-access/actions.test.ts`; additional browser journeys may use a new test file; `scripts/qa-reader.mjs` adds an isolated Bun action-test stage; README/verification report.

Use the actual action implementations and real migrated loopback PostgreSQL. A controlled test session/cache adapter is acceptable in Bun for invoking server actions; do not mock Prisma or authorization decisions. Keep browser coverage for actual credential sessions, scoped routes, stale-role denial and a usable admin assignment/contributor path. Document that action invocation tests are not HTTP transport tests.

- [x] Cover assigned draft/review creation and edit, unassigned denial with unchanged DB, forbidden publish/schedule/premium and published/scheduled content changes, admin-only bulk/public metadata/collections, role and assignment revocation in the next request, idempotent assignment/reader-target rejection, concurrent admin cross-demotions, and moderation role separation.
- [x] Run action checks as a stage of the existing isolated runner, with its generated env and temp cwd. Fail nonzero before the expensive build if an action test fails. Never attach to ambient DB settings.
- [x] Coordinator runs focused checks during iteration; one complete relevant gate at the final checkpoint: Prisma generate/validate, lint, non-incremental tsc, and the isolated production/browser suite (existing reader tests plus C1 journeys). No repeated broad suite without a new failure/change.
- [x] Claude reviews the final authorization boundaries read-only once, using the existing debate session and an immutable source snapshot. Coordinator reviews tests/diff, fixes actionable findings and reruns affected checks.
- [x] Record actual outcomes/known interim limits, commit verified work and fast-forward locally after main-clean/revision checks. No push or deployment.

## Known interim limits

Admin publication still uses the legacy workflow until C2 supplies version-specific approval and revisions. Existing generated demo art uses public paths; private real-upload storage is not implemented by C1. Team audit history and account invitations/provisioning are deferred. This package must not be described as the complete team publishing MVP.

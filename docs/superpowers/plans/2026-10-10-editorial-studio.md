# Editorial studio and version approval implementation plan

> **For agentic workers:** Execute the approved tasks sequentially with targeted checks. User-approved fleet: Antigravity implementation with coordinator verification and one Claude read-only review for the package. Do not repeat approval or run review tournaments.

**Goal:** Complete team chapter preparation, review feedback, version-specific approval, publication/scheduling/withdrawal and editorial history.

**Architecture:** Keep Chapter and ChapterPage as the public projection so reader URLs, comments and progress retain their identities. Separate ChapterRevision snapshots hold editable text/metadata/page references and explicit workflow state. Serializable, permission-checked transitions with expected version numbers atomically update snapshots, public projections and history. Published snapshots are immutable; editing creates a new draft.

**Tech stack:** Next.js, Prisma/PostgreSQL, NextAuth, Arabic RTL React.

**Spec:** docs/superpowers/specs/2026-10-08-team-publishing-mvp-design.md, sections 4–7. This package completes the chapter editorial journey; uploads, account provisioning and versioned series metadata are separate packages and must not be claimed complete.

## Constraints

- Preserve main's local preview, supplied images/logo, existing readers, saved progress and C1 team assignment authorization. No production database, deploy, push, external service setup or PDF import.
- User approved this stage and existing four-role/administrator-only publishing design. Contributor prepares assigned works; editor returns/recommends assigned work; only admin approves/publishes/schedules/withdraws.
- Use current database role/assignment in privileged transactions. Reject stale writes with a useful conflict message. Editing approved/scheduled content invalidates approval and cancels its schedule.
- Keep published content until replacement publication. Publish only approved immutable snapshot content. Audit actor/time/reason/version; require return and withdrawal reasons.
- No public credential shortcuts or prototype notices. Preserve accurate unavailable-feature messaging.
- Real uploads remain absent; snapshots may reference only existing chapter assets, not arbitrary uploaded file paths. Explicitly document that current static assets are public.

## Tasks

- [x] Add revision state/schema, snapshot/history tables and additive migration. Backfill existing chapters without changing visible content; lazy initialization covers seeded chapters created after migration.
- [x] Add server-only editorial permission/transaction services and action wrappers: open/edit draft, submit, return, recommend, approve, publish, schedule/cancel, withdraw, due-publication execution. Guard all legacy publication routes against bypass.
- [x] Build /studio workspace and /studio/chapters/[id] editor with scoped queue filters, text/metadata editor, existing page preview, review notes, status-specific actions, version badge and history. Link existing admin chapter tables into studio and remove misleading direct-publish controls.
- [x] Add protected due-publication endpoint plus operator trigger and document scheduler activation. Only publish when due, idempotently, with notifications at actual publication. No external scheduler activation.
- [x] Verify on isolated PostgreSQL: role/assignment denial, stale writes, version approval invalidation, live-content preservation, direct API/bulk bypass denial, return reason, due scheduling and duplicate execution. One focused desktop/mobile browser batch, scoped lint and one production build via existing QA runner. One final read-only Claude review; fix material issues together and rerun only affected checks.
- [x] Integrate locally and migrate only the explicitly verified loopback preview database so founder can inspect /studio. Retain audit/verification report with honest operational limits.

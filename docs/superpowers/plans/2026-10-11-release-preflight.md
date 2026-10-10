# Release preflight implementation plan

> Execute bounded preparation in the existing isolated worktree. Antigravity implements the offline rehearsal utility; Codex owns remote read-only export, local checks and integration. No push, deployment or source-database mutation until preparation is complete.

**Goal:** Rehearse all five pending migrations against an exact private snapshot of the existing Neon dataset and prepare the release inventory.

**Architecture:** Coordinator obtains a consistent READ ONLY / REPEATABLE READ snapshot of public tables and migration history. A utility accepts that private JSON, bootstraps a disposable loopback PostgreSQL from the matching historical migrations, restores the snapshot, runs pending migrations only against the disposable database and verifies original data preservation. No demo seed. Output only aggregate counts/checks; retained private data stays in gitignored local storage.

**Tech Stack:** Node, pg, embedded-postgres, Prisma 6.19 migrations, Git.

**Approved scope:** The founder approved preparation and rehearsal on 2026-10-11. Preserve production and keep upload last; SMTP/Resend remains deferred.

- [x] Create `scripts/release-preflight.mjs`: input private snapshot; validate legacy migrations against LF-normalized hashes; fresh loopback cluster; restore historical schema and data transactionally, including original migration records; execute Prisma deploy from a private cwd with explicit loopback URLs; compare original columns of every original row plus expected category/account/editorial backfills; stop owned PG gracefully. No credential values, raw rows or hashes in logs. Refuse nonloopback destination and source env inheritance. Keep ignored private input and local rehearsal output.
- [x] Coordinator export and run: source connection only BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; bounded SELECTs, then rollback. Snapshot all existing public base tables and schema columns. No external branch creation or writing. Restore source schema on local PG and rehearse five migrations. No seed/reset commands.
- [x] Inventory release assets/untracked user files and confirm GitHub head/transport read-only if reachable. Identify metadata patches separately from migrations; do not assign unknown manhwa/comic classifications or overwrite content.
- [x] Consolidated utility review and targeted safety/error verification, record aggregate evidence and unresolved publishing prerequisites. Commit locally, integrate locally; no push or deployment.

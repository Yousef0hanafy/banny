# Team Access Foundation (C1) — verification, 2026-10-09

C1 is implemented and verified locally. This is the team authorization and assignment foundation, not the complete publishing MVP. No push, deployment, production database migration or v4 import was performed.

## Delivered

- Contributor role and additive SeriesAssignment migration with unique membership and cascading foreign keys. No automatic assignments for existing editors.
- Fresh database roles govern privileged queries, layouts and actions. Contributors/editors see assigned works only; the chapter selector and studio are scoped. Admins retain global access.
- Assigned staff can create draft/review chapters and edit eligible draft metadata. Published/scheduled chapters, publication/premium/scheduling changes, public series metadata, collections and bulk workflow remain admin-only. Conditional metadata writes repeat workflow, schedule, assignment and current-role constraints.
- Admin assignment controls on series detail; staff landing, contributor role labels and appropriate navigation/control visibility. Moderation remains editor/admin.
- Serializable assignment and role changes, current actor/target checks, bounded conflict retries, assignment cleanup on reader demotion, self-demotion and last-admin protection. Duplicate chapter numbers return a clean action failure.

## Independent verification

- Prisma validate/generate passed. Additive migration deployed successfully into fresh isolated loopback PostgreSQL, never the production database.
- Non-incremental TypeScript and full ESLint passed after coordinator restored three still-used imports and fixed nullable role narrowing. Affected-file ESLint passed after the final small corrections. Final production webpack builds and their TypeScript checks passed.
- Actual server-action baseline reproduced unauthorized unassigned-editor creation before implementation: expected forbidden, received success. Immutable baseline now passes. Browser and action baseline SHA256 hashes remain C08EA98FC9763905EE5F452F02CCCA7EDC64F470D9F5FD11B5306479B649E1C9 and E4AD8D0B3937D8A8A092CE8EDB645838D0A9B67EDB6FC4FE327BECD844F59A64.
- Final real-database action suite: 20 passed, 0 failed, 79 assertions. Session/cache import adapters are controlled; Prisma and permission decisions are real. These are direct action-invocation tests, not HTTP transport tests.
- Complete browser run: 75 passed, 2 intentionally skipped mobile duplicates, 1 failed solely because the new journey assumed HTTP 404. The generated page actually rendered the not-found screen with HTTP 200; screenshot confirmed no work content. The corrected test asserts the not-found heading and absence of work/chapter content, preserving the authorization requirement. Its isolated targeted rerun passed (1/1). No product code changed for this correction.
- Combined browser coverage: all 72 existing reader cases, 2 immutable unassigned-editor checks (desktop/mobile), and 2 new desktop journeys passed. The journeys exercise real credential sessions, admin grant/revoke, contributor review submission saved in DB, and stale editor JWT denial after DB demotion.
- Both final QA runs verified zero owned children, closed application/PostgreSQL ports and removed temporary database data.

Full run artifacts: C:\Users\user\AppData\Local\Temp\bunny-reader-qa-pzgoqR.
Targeted final run: C:\Users\user\AppData\Local\Temp\bunny-reader-qa-3iZIr5.
Original behavioral RED: C:\Users\user\AppData\Local\Temp\bunny-reader-qa-68J7TQ.

## Actual delegation and review

Antigravity 1.3.2 / gemini-3.8-flash-medium implemented schema, server authorization, UI and acceptance tests in conversation 08c02d25-c1ba-4101-885b-fdca220ad0b9. Initial headless write_file was denied; the founder explicitly approved dangerously-skip-permissions before the successful resumed runs. The worker continued native file editing; coordinator ran commands and verification. No global permission/fleet setting was changed.

Claude performed one scope debate and one final Read/Glob/Grep-only review of an immutable source snapshot, reporting no blocking findings and zero touched files. Coordinator reviewed the diff and tests, added independent security-edge cases, restored imports, fixed role null narrowing, made UI capability defaults deny by default, and added bounded P2002 assignment retries. Final test correction addressed an evidenced response-status assumption.

Delegation artifacts: C:\Users\user\AppData\Local\Temp\bunny-team-access-b286935336d94354957fd9c1b7c164a0.

## Explicit interim limits

Admin publishing still uses the legacy direct workflow. Version-specific approval/revisions, team audit history, protected real uploads, invitations/account provisioning and taxonomy migration remain future work. Existing generated demo art is public. An in-flight draft creation can finish if revocation races its initial authorization; the next request is denied. Assignment rows retained when staff become admin are harmless and not revocable through the staff-only assignment contract. Known Next middleware/Edge build warnings and Bun Windows tsconfig diagnostic remain non-blocking maintenance items.

Integration base: main at dfff044. The coordinator-owned worktree is codex/team-access-foundation. Main's unrelated untracked file named run is preserved. Integration is local fast-forward only; no remote publication.

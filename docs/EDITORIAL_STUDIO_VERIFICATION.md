# Editorial studio verification — 2026-10-10

Base: `fd7a16874f8e19c781716b00dd95986bd66e3ffe`.

## Delivered

- Assigned team queue, chapter snapshots, revision editing and existing-page reorder/removal.
- Submit, editorial return/recommendation, administrator approval, publish, schedule/cancel and withdrawal.
- Fresh transactional role/assignment checks, optimistic version conflicts and immutable publication snapshots.
- Stable public chapter identity and previous content retained until replacement publication.
- Transactional publication notifications and audit history; guarded due-publication endpoint and manual administrator trigger.
- Legacy direct publication, scheduling and bulk state changes blocked.

## Fleet and review

Antigravity (`gemini-3.8-flash-medium`) produced initial backend work but the broad task timed out after 14 minutes. The coordinator corrected and simplified the transaction service. A narrower Antigravity UI task completed successfully. One Claude read-only review (`claude-opus-5-5`) completed without a read-only violation.

Both important review findings were fixed: migration schedules only previously published chapters, and due processing skips unapproved rows; page dirty detection compares normalized field values rather than JSON object key order. The browser batch also exposed and verified a mobile withdrawal-form overflow fix. No second external review was run.

## Evidence

- Isolated PostgreSQL migrations, seeding and 39 team/editorial action tests passed (157 assertions).
- Optimized Next webpack production build passed, including TypeScript.
- Desktop/mobile browser batch: 9 of 10 passed. The remaining mobile assertion ambiguously matched both reader renderings; it was scoped to the named reading region and the affected full edit → submit → approve → publish → public-reader case passed alone against the same unchanged production build.
- Visual-chapter submission verified on both devices, including the JSONB field-order regression. Mobile 375px overflow and 44px return-link checks passed.
- Scoped ESLint and `git diff --check` passed. Independent legacy-boundary test SHA256 stayed `E5D2A0FB299E244684A7BE6CF839C3BA380F2940C6A759A0BFC335B1F576C39F`.
- Final build/browser artifacts: `C:/Users/user/AppData/Local/Temp/bunny-reader-qa-Rfz3uq`; targeted confirmation: `C:/Users/user/AppData/Local/Temp/bunny-reader-qa-WVhg99`. Both runners confirmed zero remaining children, closed ports and deleted owned temporary PostgreSQL data. Desktop/mobile screenshots were inspected.

## Operational boundary

No external database, scheduler or deployment was changed. Scheduling needs an operator-configured authenticated recurring POST in production; local preview offers a manual due-publication button. Uploads, protected file storage, PDF import, team provisioning and versioned series metadata remain separate packages. Current static assets are public.

# Accounts and onboarding verification — 2026-10-10

Baseline: `1959be6ce093f9b46c67d1f80d44909c897f848d`. Scope: reader accounts, email confirmation/recovery, profile settings, optional onboarding, admin invitations and account status. Preserve existing reading/content/studio identities. No deployment or external database writes.

## Evidence

- Isolated loopback PostgreSQL: additive migration and demo/reader seed passed. Final action batch: **62 pass, 0 fail, 277 assertions** across eight files. Artifacts: `C:/Users/user/AppData/Local/Temp/bunny-reader-qa-DSEqCr`.
- Next production webpack build: exit 0, typechecking and standalone output passed. Artifacts: `C:/Users/user/AppData/Local/Temp/bunny-reader-qa-ZfLKyN/build.log`. Pre-existing middleware-to-proxy deprecation remains.
- Accounts and editorial browser batch: **16 passed**, two legacy login locator failures. The old locator matched both heading and submit button after the login redesign; changed it to the exact heading. Targeted desktop/mobile confirmation: **2 passed**, artifacts `C:/Users/user/AppData/Local/Temp/bunny-reader-qa-sMb9DL`. Thus all 18 distinct browser cases passed on the same verified production source. Test-only confirmation reused the build; no unnecessary rebuild.
- New journeys cover signup, explicit confirmation without GET consumption, returning to the work after optional onboarding, recovery with old JWT invalidation, contributor invitations, private mailbox protection, guest reading and unsafe return destinations.
- Existing studio checks cover guest authorization, visual chapter submission, complete edit/review/publish cycle, scheduler authorization and mobile layout. Existing boundary assertions were preserved; fixtures now explicitly create verified profiles.
- Scoped ESLint passed; `git diff --check` passed. Desktop/mobile registration and admin screenshots inspected.
- One Claude read-only review, `claude-opus-5-5`, completed with `readOnlyViolation=false`; artifacts `C:/Users/user/AppData/Local/Temp/bunny-account-stage/review`. Coordinator resolved email pre-registration takeover, invitation issuer revocation, recipient/global throttling, inactive admin guards and invitation return messaging. Targeted regressions cover mailbox-owner password selection, replay, revoked issuers, trusted-client isolation and separate recovery limits.

## Workflow and limitations

Antigravity produced the backend and UI in two bounded dispatches, both reaching their timeout (12 and 10 minutes). They did not return successful gate reports. The coordinator completed integration and independently verified the gates above. No claim of a verified pre-implementation RED run is made. An initial Bun 1.4 static-module mock issue was resolved with the fixture preload. A concurrent Prisma generation attempt failed because Windows held the DLL during browser QA; checks were subsequently run sequentially and passed.

Final isolated QA cleanup verified owned processes stopped, ports closed and its temporary database removed. An earlier interrupted/cleanup-failed run retained its temporary data and logs outside the repository; it is not application data.

Email tests capture privately on loopback. No Gmail messages sent or credentials committed. Live SMTP validation, trusted production proxy/edge throttling, external migration/deployment, social login, arbitrary uploads, advanced recommendations and SEO remain outside this phase. See `docs/account-email-setup.md`.

Local integration verified: main fast-forwarded to a90adeb, dependencies installed with the frozen lockfile, saved PostgreSQL stopped gracefully and restarted without reseeding. Migration 20261010200000_account_onboarding applied successfully to the loopback bunny_local_preview database. Main preview is running at localhost:3000. Mobile registration smoke: HTTP 200, zero horizontal overflow; authenticated admin users and private mailbox pages: HTTP 200 with their expected headings. Initial cold dev compilation exceeded the 30-second browser navigation default; the warm/120-second confirmation passed. Main retains the unrelated untracked AGENTS.md, CLAUDE.md, public/series and run files.


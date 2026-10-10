# Release preparation — 2026-10-11 (Africa/Cairo)

Scope: prepare locally, rehearse source data preservation, reconcile GitHub history. No GitHub push, deployment, mail delivery or mutation of the original Neon database.

## Database rehearsal

Coordinator exported a consistent `REPEATABLE READ READ ONLY` Neon snapshot, rolled back the transaction and saved it under the main checkout's ignored `.local-preview/release-preflight/2026-10-11/source.json`. Never commit or publish that file: it includes private account records. Export size: 209,084 bytes. Source has three completed migrations; all three match the committed SQL and LF-normalized checkout checksums. Historical migrations were not changed.

Antigravity implemented the offline utility, guide and boundary tests. Codex reviewed the result and added fail-closed snapshot/history validation, exact original-table row counts, genuine backfill assertions, revision page/prose verification and private database-error suppression. Gates were run by the coordinator.

Final successful rehearsal: `C:/Users/user/AppData/Local/Temp/bunny-preflight-u32SaX/summary.json`. A fresh randomly named loopback PostgreSQL restored all 743 source rows (740 business records plus three migration-history records), applied five pending migrations, then matched every original row and column. No seed or reset. The owned cluster stopped gracefully and its data directory was removed. One earlier rehearsal also passed; the final rerun followed a cleanup failure-handling correction so unsuccessful shutdown/cleanup cannot report overall success.

| Original table | Rows preserved |
|---|---:|
| AnalyticsEvent | 330 |
| Chapter | 46 |
| ChapterPage | 287 |
| Comment | 25 |
| CommentReport | 2 |
| EditorialCollection | 3 |
| LibraryItem | 7 |
| Profile | 3 |
| Rating | 21 |
| ReadingProgress | 4 |
| Series | 12 |
| _prisma_migrations | 3 |

Five pending migrations: Release E notifications/likes; team access foundation; series category; chapter revisions/editorial history; account onboarding. Final history contains eight migrations. Backfills: three profiles retain their data and receive `emailVerifiedAt=createdAt`, `authVersion=0`, `disabledAt=NULL`; four manga and four novels receive matching categories; four legacy webtoons remain unclassified. All 46 chapters receive one matching revision and one migration audit event; revision page lists/prose match the existing published data. Source had no future-scheduled published chapters.

Boundary tests: 6/6 passed. Targeted ESLint for the helper, tests, postbuild script and Prisma config: exit 0. Syntax checks passed. Production webpack build, including TypeScript and static generation: exit 0, with database/provider/auth variables removed and no worktree dotenv files. Environment-free root `prisma generate` also exited 0 and loaded the merged config. Postbuild asset assembly exited 0. Next's existing middleware deprecation warning remains; it did not fail the build. Earlier application/browser test suites were not repeated for this tooling-only change.

## GitHub reconciliation

Cached `origin/main` was stale at `8b78354`. Public GitHub API and an explicit HTTPS fetch confirmed actual main at `542d646f5cbbb1c5e93987cb2e44de57c0f1784e`, two commits ahead of that cached base. GitHub records a successful Production deployment for that head. This proves a deployment record, not access to the current Vercel dashboard settings.

The two commits were merged locally, retaining current Windows local-preview scripts and all application changes while preserving the upstream Vercel postinstall/build fixes. The package conflict was resolved by keeping `dev`/`dev:local` and adding the upstream `postinstall`/portable `build`. `bun.lock` was refreshed with `--lockfile-only --ignore-scripts`; only trusted-dependency metadata changed. Explicit HTTPS fetch works. Configured SSH transport previously failed public-key authentication; no authentication settings were changed and nothing was pushed.

## Assets and remaining release conditions

- All 12 source cover paths and displayed replacements exist locally, as do all 287 source chapter-page paths. Supplied-cover mapping is presentation-only; it needs no database reseed or metadata patch.
- Ten original supplied PNG illustrations, ten optimized WebP derivatives and the logo derivatives are already tracked. Five user PDFs in `public/series` remain untracked, about 75 MB total; they were preserved and excluded from this release preparation. Main `AGENTS.md`, `CLAUDE.md` and `run` were not staged.
- Confirm the exact Vercel project/domain and production environment values privately. `.env.local` is ignored and does not configure Vercel. Set production database URLs, auth secret and HTTPS auth/application origins through the provider dashboard.
- Obtain a current provider recovery point/fresh rehearsal snapshot before applying migrations. Never deploy schema-dependent code to the unmigrated database or reseed production.
- Decide the four legacy webtoon classifications explicitly (manhwa or comic); migrations deliberately do not guess.
- Replace/disable known privileged demo accounts and configure the real owner/team before public production. Existing three source profiles were identified as demo accounts; the migration preserves them rather than silently rotating credentials.
- Mail remains deferred. SMTP local capture is for loopback preview only; a Resend API key alone does not configure the current Nodemailer implementation. Without a real mail provider, verification/reset/invitation journeys cannot be advertised as fully usable publicly. No verification bypass was introduced.
- Real recurring media uploads need durable object storage or a hosting model with persistent writable storage. Legacy `createChapter` still has a placeholder path that copies files into `public`; that behavior is unsuitable for Vercel serverless production. Existing committed assets can be served normally. Address actual publishing storage before relying on cloud team uploads.

Release preparation is verified locally; public production launch remains conditional on the items above. The original Neon database and GitHub deployment remain unchanged.

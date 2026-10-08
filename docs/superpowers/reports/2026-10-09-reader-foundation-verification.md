# Reader Foundation — verified package

Verified on Windows on 2026-10-09 (Cairo), against the approved [implementation plan](../plans/2026-10-08-reader-foundation.md). This completes its four tasks, within the first reader package of phase B.

## Result

- Chapter navigation stays within the current series and excludes draft/future chapters. Homepage updates open the correct manga, webtoon or novel reader.
- All three readers restore eligible chapter-specific local/server progress before persistence. The newer valid record wins; manga positions clamp to the available pages. Malformed storage, other chapters/formats, locked chapters and empty content are covered.
- Scroll readers restore after layout/font readiness, preserve subsequent movement and reset correctly when following a chapter link. A stalled session does not block restoration or cause writes while loading.
- The manga footer fits a 390px viewport with two rows and 44px touch targets. Desktop retains one row. Actual buttons, the slider, reading-direction changes, image gestures and immersive mode are tested. Native slider keys no longer also trigger the reader's keyboard shortcut.

## Independent verification

The coordinator reran the final tree after the responsive and keyboard corrections:

| Gate | Result |
| --- | --- |
| `node scripts/qa-reader.mjs` (same runner as `bun run test:reader`) | Exit 0; 72 passed, 36 desktop + 36 mobile; 0 skipped, unexpected or flaky |
| `bun run lint` | Exit 0 |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Exit 0 |
| Prisma generation | Exit 0, within the independent QA run |
| Direct Next production build | Exit 0, within the independent QA run |
| Generated standalone server and Node static/public copy | Exercised by all browser tests |
| `git diff --check` | Exit 0 |

The complete browser run took 308.8 seconds, with one worker and no retries. It used a fresh UTF-8 loopback PostgreSQL database. The final artifact directory is `C:/Users/user/AppData/Local/Temp/bunny-reader-qa-eXXC32`; `runner.log`, `build.log`, `playwright.log` and `results.json` retain the evidence and screenshots.

`cleanup.json` records zero remaining owned children, removed PostgreSQL data and closed ports. The coordinator also independently bound ports 53819 and 53820 after shutdown and confirmed that the data directory was absent.

## Review and regression evidence

Implementation ran through the configured Codex delegation lane. Two Claude reviews used an immutable snapshot with read-only tools; the second had no actionable findings. The coordinator reviewed the final source, QA boundary and new responsive/keyboard changes before integration.

Original user-visible failures were reproduced before their fixes: incorrect same-series navigation, novel update URL, missing saved-position restoration, and restoration delayed by a stalled session. The mobile footer's offscreen next button was retained in a failed browser trace. The new footer test also reproduced a native-slider/reader-keyboard double advance; the final test covers both native slider keys and ordinary reader shortcuts.

Earlier RED evidence remains in external QA directories `bunny-reader-qa-P9rtsI`, `bunny-reader-qa-vzlp5A`, `bunny-reader-qa-h1PMpf`, `bunny-reader-qa-HqxYsY` and `bunny-reader-qa-19XPDe`. Cold-server/environment failures were not counted as behavioral RED evidence.

## Boundaries

Windows was executed; macOS/Linux portability has not been verified on those hosts. The historical package build script's shell copy stage was not executed; QA uses Node copying and the generated standalone server instead. Existing middleware deprecation and metadataBase warnings remain.

This package does not make the whole MVP production-ready. Publishing roles, assignments, approval/version history, the four-category migration, real content uploads, deployment and production database setup require their separate plans. Clock-skew and shared-device local-progress policy remain future decisions; the local mirror retains one latest record per series. No schema, publishing actions, production database, credentials or v4 assets were changed.

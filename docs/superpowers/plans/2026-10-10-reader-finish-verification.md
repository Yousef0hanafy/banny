# Stage 4 verification

Reader UI follows img2's compact tools and content-led composition while retaining paged manga, vertical webtoon/comic and novel prose. Existing chapter files are demo content; the illustrated panels in the design board were not imported as chapter content.

## Implementation

Antigravity completed its assigned reader-chrome.tsx implementation successfully (exit 0), including direct chapter-control slots, settings dialog, 44px tools, accessible/inert focus mode and responsive navigation. Codex independently inspected the diff, adjusted header height, and integrated the three readers and routes. Chapter options use the existing server-filtered chapterList; no new query or schema is needed. Width preferences restore before vertical scroll restoration. Novel font/theme settings remain per-device. Failed images have a genuine retry action; absent content has an explicit empty state without progress writes or a false end-of-chapter card.

## Evidence

- Scoped ESLint passed across all changed reader/community/route/test files, and again on the keyboard correction and extended test.
- Impeccable detector returned `[]`.
- Initial isolated QA: `C:/Users/user/AppData/Local/Temp/bunny-reader-qa-WS8Ko7`. Production build/TypeScript, 20 team-access tests and all **38 desktop/mobile browser cases passed**. Cases cover new chapter selection and locks, preference persistence, focus keyboard recovery, image retry, existing navigation bounds, comments typing, empty chapters and guest progress restoration.
- One combined Claude read-only review completed successfully with `readOnlyViolation: false`. It found that excluding every button/link from the manga key handler disabled shortcuts after toolbar clicks. The correction retains the guards for form fields/contenteditable/dialogs and permits shortcuts from ordinary toolbar buttons.
- Focused final confirmation: `C:/Users/user/AppData/Local/Temp/bunny-reader-qa-bAAvAt`. Production build/TypeScript and 20 team-access tests passed, followed by **6 desktop/mobile cases passing**. These explicitly exercise arrows and `f` after toolbar clicks, protected dialog/select controls, actual naturalWidth after image retry, and the existing footer/slider/focus regression. No second Claude review or broad test rerun.
- Both QA runners exited 0, stopped all owned children, closed their ports, and removed their temporary PostgreSQL data. No live database was used.
- One desktop/mobile visual batch covered all three reader layouts plus vertical/novel settings. `C:/Users/user/.codex/visualizations/2026/10/10/bunny-reader-finish/inspection.json` reports no horizontal overflow or broken images at 1440px/390px. Captures are from the initial production build; the subsequent correction changes keyboard behavior only, with no visual/CSS changes.
- Git whitespace check passed. Existing middleware deprecation, Edge-runtime and metadataBase warnings remain outside this package.

## Integration

Local integration only. No push, deployment, live migration, new paid/double-page behavior, SEO work or content import. Independent dependencies/build cache remain in the reused worktree for subsequent stages. Next UI package: personal library and updates/returning-reader journey.

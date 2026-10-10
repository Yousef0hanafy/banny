# Stage 4: reader finish

Approved target: v3/img2.png, preserving manga paged navigation, vertical webtoon/comic presentation and novel typography. The approval and one combined review cadence already apply.

- Antigravity owns reader-chrome.tsx: compact 44px header controls, accessible settings dialog for real controls, actual chapter control slot, bounded mobile/desktop navigation bar and inaccessible hidden focus-mode controls.
- Codex owns reader-tools.tsx and three reader/page integrations: native direct chapter selection from the already-filtered chapterList; vertical image width preferences restored before progress; novel settings in the shared dialog and chapter navigation; paged manga shortcuts protected from interactive controls/dialogs. Keep real content, read boundaries, progress and existing controls.
- Improve chapter images without rounding/cropping the strips or decorative frames. Neutral image failure/retry and empty states; no invented pages or conversion of board art into chapters.
- One combined Claude read-only review and scoped lint/detector. One isolated production/browser QA batch with new selector/settings/empty cases plus relevant existing progress, navigation, locks and keyboard regressions. Desktop/mobile captures together; one material correction batch and focused confirmation only if needed.
- No schema, live database, deployment, SEO work, new reader route family, or fake double-page/paid features.

# Top Unresolved Decisions Requiring Founder Approval

Blocking items for the next step, each with a recommendation so approval can be one-word per item.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **FD-1** | **Source document delivery** ⛔ blocker for reconciliation | (a) Paste full text of each doc into chat; (b) retry file upload; (c) proceed without sources and cancel the reconciliation gate | **(a)** — file transfer has failed twice; pasted text is reliable and timestamped |
| **FD-2** | Release A "Continue Reading" semantics | (a) localStorage for guests + seeded progress for demo reader; (b) require login before any progress; (c) defer continue-reading entirely to B | **(a)** — proves the reader-first hero immediately, zero DB complexity in A |
| **FD-3** | Release A 6-series mix | (a) 3 manga + 3 webtoon; (b) 4 webtoon + 2 manga (webtoon flagship); (c) 2+2 + 2 "surprise" series | **(a)** — equal proof for both readers, genre spread achievable |
| **FD-4** | Comments UI in Release A series detail | (a) none in A (cleaner proof, B adds community); (b) read-only approved comments in A | **(a)** — founder's release list puts comments in B |
| **FD-5** | Chapter scheduling UI | (a) Release B; (b) Release A | **(a)** — publish/unpublish proves the workflow; scheduling is operational polish |
| **FD-6** | `/admin` landing screen in Release A (before dashboard analytics exist) | (a) simple status cards (counts only, no charts); (b) redirect to series list | **(a)** — secure landing beats redirect for demo flow |
| **FD-7** | Demo account credential strategy | (a) one shared admin + one shared reader, credentials in README; (b) per-reviewer accounts | **(a)** — prototype-grade, documented, revocable |
| **FD-8** | Locked/premium demo chapter visual in Release A | (a) keep on one webtoon series (visual only, no purchase); (b) defer to B | **(a)** — it's central to the premium narrative and costs almost nothing |
| **FD-9** | Approval to begin **Release A** build | (a) approve now; (b) hold until FD-1 reconciliation completes | **(a)** — Release A has no dependency on the missing docs; reconciliation gates B, not A |

**Standing legal guardrails (no approval expected, restated):** no real/licensed content, no payments, no downloads, no "licensed/official" claims — lawyer review required before any of these ever changes.

# Bunny Library — Discovery Report (Phase 0)

> **⚠️ Phase 0.1 UPDATE (2026-09-28):** Source Reconciliation Gate partially executed — the four source documents were **not delivered** (evidence in `CONTRADICTION_REPORT.md`). Claim labeling & downgrades applied per `SOURCE_VERIFICATION.md`; scope re-structured into Releases A/B/C per `RELEASE_PLAN.md`. The **GO is now conditional**: Release A may start; Release B sign-off requires completed source reconciliation.

| | |
|---|---|
| **Date** | 2026-09-28 |
| **Phase** | 0 — Product, Market, Legal & Architecture Discovery Gate |
| **Status** | Complete — **conditional GO** (Release A only; see Phase 0.1 banner above) |
| **Inputs** | 4 source documents referenced by the brief (PRD.md, PRODUCT_STRATEGY.md, COMPETITOR_ANALYSIS.md, MARKET_RESEARCH.md) — **NOT FOUND in `/home/z/my-project/upload/`** (directory empty). Findings below are built from independent primary web research + the task brief itself. |
| **Method** | 32 live web searches performed on 2026-09-28 via the `web_search` API. Direct browser visit to the reference site was attempted and blocked by Cloudflare (see §2). No piracy/unofficial aggregator sites were used as sources for legal, licensing, or market claims. |

> **Integrity statement:** Every claim marked ✅ below has a real, retrieved source URL. Every claim marked ⚠️ is an assumption or hypothesis that remains unverified. Nothing in this report was fabricated. The four internal source documents were not available, so all "PRD assumptions" analyzed here are those stated in the Phase 0 brief; they must be re-cross-checked when the documents are re-supplied.

---

## 1. Executive Summary

The Arabic comics/webtoon market has changed **materially** in the last 18 months, and the change is concentrated exactly where Bunny Library wants to play. Between April 2025 and August 2026, three major licensed Arabic-first content initiatives went live: Manga Arabia began publishing Korean webtoons in Arabic (April 2025), Rakuten's MangaOasis launched officially in Arabic (June 2025), and Shueisha launched **MANGA MILLION worldwide with titles in 100+ languages including Arabic** (August 2026). Saudi Arabia's Manga Productions continues to acquire regional distribution and localization rights (Grendizer, GREAT PRETENDER, Nioh 3 with Arabic localization). In parallel, the free-aggregator ecosystem (Azora and dozens of clones) remains large, active, and messy — it defines user habits but not a defensible business.

**Implication for Bunny Library:** the "official Arabic manga platform" slot is being claimed by global and Saudi incumbents with content advantages Bunny Library will never match in this iteration. The defensible wedge is the one the brief already identifies — a **reader-first personal library experience** (continuity, follow-updates, calm premium UX) rather than catalog-first aggregation. This validates the core product thesis while killing any assumption that catalog breadth or "licensed content" claims can be the differentiator.

On legality: hosting real manga/webtoon/novel content requires rights acquisition (translation, digital distribution, regional territory) per Saudi, UAE, and Egyptian copyright frameworks — all three protect translation and digital exploitation as economic rights of the author. **The prototype must and will use 100% fictional, original demo content.** Several PRD-family assumptions (unlimited offline downloads, early-access tiers, translation rights) depend entirely on future licensing and are capped accordingly in scope.

**Recommendation (updated in Phase 0.1): conditional GO** — Release A (foundation, two readers, publishing workflow, 6 series) may start immediately; Releases B/C are gated on source-document reconciliation (`CONTRADICTION_REPORT.md` §2). Five scope guardrails unchanged: no payments, no downloads, no "licensed" claims, no real content, no email/OTP hardening.

---

## 2. Research Method & Transparency

- **Search execution:** 32 queries executed live on 2026-09-28 (market, competitors, legal, technical). Raw results retained in `/home/z/my-project/research/*.json` with URLs, dates, and snippets.
- **Source quality policy:** preference order = official company announcements → government/official bodies (WIPO, SAIP) → reputable press → market-research summaries. Aggregator/piracy sites were **not** used for any legal, licensing, or market-size claim. Aggregators are mentioned only as observed competition (a fact about the ecosystem, not a source of legitimacy).
- **Reference product inspection:** `https://azorafly.com/` was opened in a headless browser and returned a **Cloudflare "Attention Required" block page**; automated inspection is not possible. Verified about Azora via search metadata only: active official domain azorafly.com with © 2026 footer, a published Privacy Policy, a DMCA page, a Discord community link, genre chips (e.g., كوميدي، دراما), and third-party catalog mirrors showing manhwa titles with star ratings and chapter counts. Deeper IA analysis of Azora is **queued as unverified**; Bunny Library will rely on the brief's description (latest releases / popular / series detail / chapter lists) which matches the observed metadata pattern.
- **Missing inputs:** the four attached documents did not reach `/upload/`. A cross-check pass against them is the first item of the Unverified Research Queue (§9). Product decisions in `DECISIONS.md` are based on the brief; any contradiction found in the real PRD will trigger a decision review.

---

## 3. Verified Findings (with sources)

### 3.1 Market

| # | Finding | Source |
|---|---|---|
| M1 | Global webcomics market ≈ **USD 7.6B (2024)**, sustained growth projected | Credence Research, Dec 2024 — https://www.credenceresearch.com/report/webcomics-market |
| M2 | Global webtoon market projected **USD 10.85B (2025) → 14.44B (2026)** (Mordor Intelligence) | GII Research — https://www.giiresearch.com |
| M3 | **GCC anime market USD 644M (2024) → USD 1,265M (2033), CAGR ~7.8%** | OpenPR, Jul 2025 — https://www.openpr.com |
| M4 | Wider MENA anime market growth (~13.6%/yr) and "Saudi at its core" — ⚠️ **downgraded to Inference/low-confidence in Phase 0.1** (undated, blog-grade source); directional only | Vivify Japan — https://www.vivify-jp.com |
| M5 | MENA SVOD (paid streaming) market ≈ USD 2.77B (2022), CAGR ~7.9% — useful proxy that paid digital content appetite in the region exists but is mid-sized | UnivDatos — https://univdatos.com |
| M6 | Light-novels global market ≈ USD 9.4B (2025), CAGR ~7.9% — the "novels" leg of the catalog has real global demand | Dataintelo — https://dataintelo.com |
| M7 | **"Arabic-language webtoons are gaining traction via partnerships with local publishers. Monetization relies heavily on ad-supported models, as paid adoption lags."** — willingness to pay in Arabic remains the weakest link | 24Market Reports — https://www.24marketreports.com |
| M8 | Community infrastructure is real: Middle East Film & Comic Con (Abu Dhabi) active Aug 2026; Riyadh hosts major anime/gaming events | Arab News Japan backup — https://backup.arabnews.jp ; events.stackedgame.com |

**Read:** the demand side (readers, events, fandom) is verified and growing; the monetization side (M7) is explicitly lagging in Arabic. A premium UX prototype is viable; a revenue model is not yet provable.

### 3.2 Competitive landscape — what changed

| # | Finding | Source |
|---|---|---|
| C1 | **Manga Arabia (Saudi) began offering Korean webtoons in Arabic "for the first time" — April 2025** — direct licensed Arabic webtoon supply now exists | Korea JoongAng Daily, Apr 15 2025 — https://www.koreajoongangdaily.com |
| C2 | **SRMG/Manga Productions: "first-ever Arab entity to own copyrights to adapt and localize manga for Arab audiences"**; Manga Arabia expanded licensing partnerships into Asia (Malay, Chinese adaptations) | Zawya — https://www.zawya.com ; Saudi Exchange media deck, Apr 2023 — https://www.saudiexchange.sa |
| C3 | **Manga Productions acquisitions:** GREAT PRETENDER distribution/licensing (Nov 2023), Grendizer new series (Aug 2023), **Nioh 3 MENA publishing with Arabic localization (Jun 2025)**, strategic partnership with Dynamic Planning for all-rights licensing | manga.com.sa — https://manga.com.sa ; Arab News — https://www.arabnews.com ; Asharq Al-Awsat EN — https://english.aawsat.com ; IMDb News — https://www.imdb.com |
| C4 | **Rakuten MangaOasis officially available in Arabic (Jun 23, 2025)**; platform launched 2024; Middle East entertainment business event hosted Feb 2026 | Rakuten Global — https://global.rakuten.com ; SHIFT inc. note — https://note.shiftinc.jp ; meatechwatch.com |
| C5 | **Shueisha launched MANGA MILLION (Aug 6, 2026): worldwide digital manga platform with titles in 100+ languages including Arabic**; MANGA Plus also sells a MAX subscription at $1.99/month | Anime News Network — https://www.animenewsnetwork.com/news/2026-08-06/shueisha-launches-manga-million-digital-platform-worldwide-with-titles-in-100-lan ; MANGA Plus official — https://mangaplus.shueisha.co.jp/web_pages/1177 |
| C6 | **Azora (azorafly.com) is still active in 2026** as an Arabic manga/manhwa reading site (official domain, © 2026, Privacy Policy + DMCA + Discord + community page; genre chips كوميدي/دراما). Self-described translation team ("فريق لترجمة المانجا"). A third-party app-listing describes it as a free Arabic manga/manhwa reading platform | azorafly.com (search-indexed snippets) — https://azorafly.com ; https://azorafly.com/privacy-policy ; X — https://x.com/azora_manga ; tanzelat.org listing, Sep 2026 |
| C7 | The unofficial aggregator field in Arabic is crowded and low-quality (Mangatek, MangaWi, Mangamello, عرب تونز, and many spam-adjacent clones) — confirms both (a) entrenched free-reading habits and (b) a large UX/trust gap a premium product can exploit | Arabic-language search result set, Sep 2026 (retained in `/research/ar-query.json`) |
| C8 | Global manhwa apps (Manta, Tappytoon, Lezhin) appear in regional app-store charts (e.g., Tunisia top comics apps) but no verified Arabic-localized product was found in this pass | appfigures — https://appfigures.com |

**Read:** Bunny Library cannot out-catalog licensed incumbents and should not try. Differentiation must be experience-layer: reader-first personal library, continuity, calm premium RTL-native UX — plus an eventual pivot toward **original Arabic works** (which no global player is supplying), noted as a strategy hypothesis for later phases.

### 3.3 Target markets (Saudi, UAE, Egypt) — verdict

- ✅ **Verified as sensible prototype narrative targets:** Saudi Arabia is the verified anchor — Manga Productions/SRMG institutional investment (C2, C3), MENA anime growth centered on KSA (M4), Riyadh events (M8). UAE has strong legal infrastructure for digital content (L2) and MEFCC community gravity (M8). Egypt has deep comics tradition and reader volume (al-Fanar coverage of Arab digital comics; historical AK Comics precedent via IEMed — https://al-fanarmedia.org, https://www.iemed.org).
- ⚠️ **Unverified:** relative per-country reader volume, ARPU, and payment-method maturity for a paid reading product. Keep the three-market narrative for the prototype; do not hard-code any country-specific feature.

### 3.4 Legal & content constraints (fact layer only — **not legal advice**)

| # | Verified fact | Source |
|---|---|---|
| L1 | **Saudi Arabia adopted a new Copyright Law with key changes (reported Feb 2026)**; authors hold economic rights (printing, publishing, **translation**, material exploitation) and moral rights (attribution, objection to modification); SAIP operates a copyright registration system | Mondaq, Feb 26 2026 — https://www.mondaq.com ; SAIP — https://saip.gov.sa ; Legal500 — https://www.legal500.com |
| L2 | **UAE: Federal Law No. 38 of 2021 on Copyright and Neighbouring Rights** governs digital works; infringement can carry severe penalties (reported incl. deportation for IP infringement) | Nour Attorneys, Aug 2026 — https://www.nourattorneys.com ; Alkabban, Dec 2025 — https://alkabban.com ; Legal500 — https://www.legal500.com |
| L3 | **Egypt: Law No. 82 of 2002 (Book Three), amended by Laws 26/2015 and 144/2019**, governs copyright incl. translation and digital use | WIPO Lex — https://www.wipo.int ; Andersen Egypt translation, Oct 2025 — https://eg.andersen.com |
| L4 | Supabase Storage access control is built on Postgres RLS — technical control layer for any future licensed-content gating | Supabase docs — https://supabase-supabase.mintlify.app/storage-access-control |

**🚫 Lawyer-required items (explicitly out of scope for this team):** drafting/acquiring translation + digital distribution licenses; territory definitions (GCC vs. MENA vs. global); DMCA/takedown policy text for the real product; age-rating and censorship compliance per country; payment/PDPL (Saudi personal data protection) compliance; app-store contracts. Every one of these must be handled by a qualified IP lawyer or rights specialist **before** any real content is hosted. The prototype contains zero real content and therefore has no dependency on the above.

### 3.5 Technical readiness (verified against current docs/ecosystem)

| # | Finding | Source |
|---|---|---|
| T1 | **Next.js 16 stable (released Oct 21, 2025); Turbopack is now the default bundler for new projects; App Router + React 19 standard; Server Actions are the primary mutation path**; 16.2 current in 2026 | InfoQ, Dec 2025 — https://www.infoq.com ; shubhra.dev — https://shubhra.dev ; Vercel docs mirrors — https://vercel-next-js.mintlify.app |
| T2 | **Supabase RLS best practice:** enable RLS on all tables (project setting "lock new tables"), use `(select auth.uid()) = user_id` pattern, avoid over-broad `authenticated` grants, role-based admin policies; RLS with zero policies = fully denied (not open) | Gart production guide — https://gartsolutions.com ; dev.to security guide, Mar 2026 — https://dev.to ; vibeappscanner checklist |
| T3 | **Supabase Storage: S3-backed with Smart CDN + image transformations**; file access controlled via Postgres RLS | Supabase docs — https://supabase-supabase.mintlify.app/storage-access-control ; github.com/mvanhorn/clawdbot-skill-supabase |
| T4 | Supabase free tier: ~500 MB DB / ~1 GB file storage / ~50K MAU; idle projects pause — sufficient for a prototype, with known ceilings | choosemystack.com ; letrelay.com, Sep 2026 — https://www.letrelay.com |
| T5 | **Tailwind CSS v4 (CSS-first `@import "tailwindcss"` config) works with shadcn/ui on Next.js 16 App Router** (community-verified upgrade path) | GitHub discussion #11952 — https://github.com ; dev.to Next16+Tailwind4+shadcn starter, Sep 2026 |
| T6 | **Arabic web typography:** IBM Plex Sans Arabic available open-source (Google Fonts / Fontsource / Adobe); guidance for screen-optimized Naskh-style fonts (Cairo, Tajawal, Almarai, IBM Plex Arabic); line-height ≥1.7; **letter-spacing must be 0 on Arabic text**; never rely on Latin fallback for Arabic glyphs | Google Fonts — https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic ; Fontsource — https://fontsource.org ; voxire RTL guide 2026 — https://voxire.com ; santa-media RTL rules — https://santa-media.co |
| T7 | **Env-var safety:** only `NEXT_PUBLIC_*` reaches the client bundle; everything else is server-only; use `server-only` package guard for secrets | Nashtech, Oct 2025 — https://blog.nashtechglobal.com ; eastondev, Jan 2026 — https://eastondev.com |
| T8 | **Sentry official `@sentry/nextjs` SDK v11 (Sep 2026) supports Next.js 15+/App Router/Turbopack; wizard installer** | Sentry docs — https://docs.sentry.io/platforms/javascript/guides/nextjs ; npm — https://www.npmjs.com/package/@sentry/nextjs |
| T9 | **PostHog: official Next.js (App Router) analytics guide incl. client+server capture and privacy-first configuration** | PostHog — https://posthog.com ; Vercel integration — https://vercel.com |
| T10 | **Next.js + Supabase + Vercel is a mainstream, well-supported deployment architecture** | liberateweb.com comparison, Mar 2026 ; multiple 2026 stack guides |

---

## 4. Assumptions That Remain Unverified ⚠️

These are the PRD-family assumptions and brief claims that could **not** be verified in this phase, split into (a) blocked by missing documents and (b) user-research questions.

**Blocked by missing source documents (must re-check when PRD/strategy docs are supplied):**
1. The PRD's user personas, market sizing, and feature inventory (including "unlimited offline downloads", "early access", "translation rights" features) as actually written.
2. The market research documents' data vintage and numbers — cannot confirm or refute any of their claims.
3. Competitor analysis documents' platform list — the live competitive set has changed (C1–C5), so the internal version is presumed stale.

**User-behavior hypotheses requiring primary validation before any real launch:**
4. **Willingness to pay** for Arabic premium reading (M7 suggests paid adoption lags; MENA SVOD M5 shows appetite exists for premium video — unproven for serialized reading).
5. **Genre preferences** in Arabic (fantasy/action/romance/mystery/historical/sci-fi/slice-of-life ranking) — no reliable Arabic-market genre data found; global webtoon data suggests romance/fantasy dominate but that is ⚠️ an extrapolation.
6. **Trusted content formats** (manga vs. manhwa vs. webtoon vs. novels) per market — unverified.
7. **Reading behavior** (session length, vertical-scroll vs. paged preference, binge patterns) — unverified.
8. **Platform expectations** (app vs. web, download expectations, offline reading) — unverified; aggregators have trained users to expect free + downloads, which is both an acquisition risk and a legal trap.
9. Saudi/UAE/Egypt as the highest-ROI launch trio (plausible per §3.3, not proven).
10. That "reader-first vs. catalog-first" positioning actually moves retention — this is the core product bet, testable only with real usage data.

**Reference-product gaps:**
11. Azora's exact current IA (homepage composition, reader controls, monetization mechanics) — Cloudflare blocked direct inspection; only metadata verified (§2).

## 5. Unverified Research Queue

| # | Question | Method when available |
|---|---|---|
| Q1 | Re-read 4 internal docs; diff their assumptions against this report | File review (re-upload) |
| Q2 | Arabic reader survey: willingness to pay, format trust, genre ranking | 15-question survey via Saudi/Egyptian reading communities (Discord/Telegram/X) |
| Q3 | Azora IA teardown (manual, human browser session, no scraping of content) | Human walkthrough; screenshots of structure only |
| Q4 | MangaOasis / MANGA MILLION Arabic UX audit: reader-first or catalog-first? | Official app store listings + manual inspection |
| Q5 | Payment rails readiness (Mada, STC Pay, Fawry, Telr) for future monetization | Provider docs review in Production-Preparation phase |
| Q6 | Legal opinion pack: translation/distribution licensing, PDPL, takedown policy | Qualified IP lawyer (mandatory gate before real content) |

---

## 6. Competitor & Differentiation Update (delta vs. brief's framing)

**What changed since the internal research was presumably written:**
1. **Arabic licensed supply is now real and accelerating** (C1, C2, C4, C5). Any positioning that implies "first Arabic platform" or relies on catalog breadth is dead on arrival.
2. **Shueisha MANGA MILLION Arabic (Aug 2026)** legitimizes Arabic-language digital manga as a market — it also sets a pricing anchor ($1.99/month MAX tier on MANGA Plus, C5) that is aggressive.
3. **Aggregators persist (C6, C7)** → user habits are free-first; trust and quality are the exploitable gap; premium positioning must justify itself through experience, not content exclusivity (which the prototype cannot claim anyway).

**Bunny Library's differentiation (validated as still-open space):**
- Reader-first home hierarchy (Continue Reading → library updates → personalized discovery → browse) — **no verified Arabic platform leads with personal library continuity**; aggregators and official apps alike are catalog-first (⚠️ hypothesis, high confidence from observed metadata patterns, to be confirmed in Q4).
- Arabic-native premium RTL experience (not translated UI) — the aggregator field is visually noisy (C7); the official entrants are translated-localized, not Arabic-native design.
- Multi-format calm library (manga + webtoon + novels in one collection-first identity).
- Future wedge (post-prototype): original Arabic works and Arabic creators — nobody in the verified set is doing this at scale.

## 7. Legal / Content Constraints for the Prototype (binding)

1. **100% fictional catalog.** All 12+ series, chapter content, covers, comments, and collections are original fiction created for the demo. No real titles, no parody-adjacent imitations of known franchises, no fan-art.
2. **Cover art:** generated original abstract/graphic placeholders only (no copyrighted artwork, no scraped images).
3. **No "licensed/official" claims** anywhere in UI copy; a visible "demo content" disclosure in footer/admin is required.
4. **No downloads** — the PRD-family "unlimited offline downloads" assumption depends on licensing and is capped: prototype renders a locked/disabled state at most.
5. **No purchase flow** — locked premium chapters are visually styled but non-purchasable.
6. **No legal pages impersonating a real operator** — Privacy/DMCA pages ship as clearly-marked demo templates.
7. **No legal advice produced by this project** — all licensing questions routed to the lawyer-required list (§3.4).
8. Community safety: moderation queue ships in admin so the pattern for handling reported content exists before any real UGC.

## 8. Main Risks

**Top 5 (detailed in the Phase 0 summary):**
1. **Missing source documents** — decisions may contradict the real PRD.
2. **Monetization hypothesis unproven** (M7) — premium features risk being demo-only forever; prototype must treat payment as a mocked concept.
3. **Licensed incumbents compressing the differentiation window** (C1/C4/C5) — reader-first UX bet must be validated early.
4. **Legal exposure via content leakage** — any real copyrighted material entering the seed data poisons the prototype; requires seed review discipline.
5. **RTL/typography quality risk in a LTR-centric component ecosystem** (T5/T6) — shadcn/ui defaults need systematic RTL hardening; this is where "premium" is won or lost.

**Secondary:** Supabase free-tier ceilings (T4) if the demo is shared publicly; Cloudflare/anti-bot friction when studying competitors; scope creep across 3 reader types; aggregator-trained expectations ("where are the real titles?") during demos.

## 9. Go / No-Go Recommendation

**GO** — build the prototype as specified in `PROTOTYPE_SCOPE.md`, under these gate conditions:
- Fictional content only (§7 enforced via seed review).
- Reader-first IA treated as the core validated bet; instrument it (seeded analytics + optional PostHog stub) so the hypothesis is measurable later.
- All §4 assumptions and §5 queue items tracked; re-validation against the real PRD documents is a **blocking gate for Phase 2 sign-off**, not for Phase 1 foundation work.
- No real-content workstreams (licensing, payments, downloads) enter any phase without the lawyer gate (§3.4).

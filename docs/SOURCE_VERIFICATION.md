# Source Verification Table — Phase 0.1

| | |
|---|---|
| **Date** | 2026-09-28 |
| **Purpose** | Label every external claim in the four Phase 0 documents with its exact source URL, publication date where available, and verification status. Downgrades applied to claims that cannot be directly supported. |
| **Legend** | **Verified-FT** = page fetched and claim read in full text. **Verified-SN** = claim stated in a retrieved search-index snippet of the cited source; full text not opened. **Inference** = synthesis across sources by this team, not a direct source statement. **Unverified** = could not be supported (kept only if clearly marked, or downgraded/removed). |

**Verification status snapshot:** 2 claims Verified-FT (upgraded this phase) · 24 claims Verified-SN · 6 claims Inference · 2 claims Unverified/downgraded · 2 sources Cloudflare-blocked (ANN, azorafly.com).

---

## 1. Market claims

| ID | Claim as used | Source URL | Pub. date | Label | Notes / action |
|---|---|---|---|---|---|
| M1 | Global webcomics market ≈ USD 7.6B (2024), growth projected | https://www.credenceresearch.com/report/webcomics-market | Dec 31, 2024 | Verified-SN | Third-party research firm; listing snippet only. Kept with medium confidence. |
| M2 | Global webtoon market USD 10.85B (2025) → 14.44B (2026), Mordor Intelligence | https://www.giiresearch.com | 2025 | Verified-SN | Report reseller snippet; Mordor is the underlying source. Kept. |
| M3 | GCC anime market USD 644M (2024) → 1,265M (2033), CAGR 7.8% | https://www.openpr.com | Jul 4, 2025 | Verified-SN | ⬇ Downgraded to *indicative*: openpr is a self-published press-release aggregator; treat as directional only. |
| M4 | "Wider MENA anime market to grow 13.6% annually beyond 2025, Saudi at its core" | https://www.vivify-jp.com | none shown | **Downgraded: Inference/low-confidence** | Undated blog-grade source; originally labeled Verified in DISCOVERY_REPORT. Re-labeled; must not be cited as a hard number. |
| M5 | MENA SVOD ≈ USD 2.77B (2022), CAGR ~7.9% (paid-content appetite proxy) | https://univdatos.com | none shown | Verified-SN | Proxy usage is an **Inference** (our analogy), source figure is Verified-SN. |
| M6 | Global light-novels market ≈ USD 9.4B (2025) | https://dataintelo.com | 2025 | Verified-SN | Kept, directional. |
| M7 | "Arabic-language webtoons gaining traction via local publisher partnerships; monetization heavily ad-supported, paid adoption lags" | https://www.24marketreports.com | none shown | Verified-SN (quote) / **Inference for conclusion** | Report body paywalled; quote from listing snippet. The strategic conclusion built on it remains a hypothesis to validate (founder-visible). |
| M8 | MEFCC Abu Dhabi active (Aug 2026); Riyadh hosts major anime/gaming events | https://backup.arabnews.jp ; https://events.stackedgame.com | Aug 11, 2026 | Verified-SN | Kept. |

## 2. Competitor claims

| ID | Claim as used | Source URL | Pub. date | Label | Notes / action |
|---|---|---|---|---|---|
| C1 | Manga Arabia began offering Korean webtoons in Arabic "for the first time" (Apr 2025) | https://www.koreajoongangdaily.com (root; article URL depth lost in search results) | Apr 15, 2025 | Verified-SN | Kept; limitation noted — exact article URL to be re-captured when re-verified. |
| C2 | SRMG/Manga Productions = "first-ever Arab entity to own copyrights to adapt and localize manga for Arab audiences"; Manga Arabia Asia partnerships | https://www.zawya.com ; https://www.saudiexchange.sa | Apr 2, 2023 | Verified-SN | Saudi Exchange deck is a strong corporate source. Kept. |
| C3 | Manga Productions licensing record: GREAT PRETENDER (Nov 2023), Grendizer (Aug 2023), Nioh 3 MENA + Arabic (Jun 2025), Dynamic Planning all-rights partnership | https://manga.com.sa ; https://www.arabnews.com ; https://english.aawsat.com ; https://www.imdb.com | Nov 17, 2023 / Aug 5, 2023 / Jun 17, 2025 | Verified-SN; **manga.com.sa Verified-FT** (site live, fetched 2026-09-28: "Manga Productions \| Inspiring Heroes of Tomorrow") | Official-site news pages not individually fetched; press corroboration is multi-outlet. Kept. |
| C4 | Rakuten MangaOasis officially available in Arabic (Jun 23, 2025); platform launched 2024; ME entertainment event Feb 2026 | https://global.rakuten.com (root; exact release URL not captured) ; https://note.shiftinc.jp ; https://meatechwatch.com | Jun 23, 2025 / Feb 9, 2026 | Verified-SN | Rakuten is a strong corporate source; press-release full text not opened. Kept with limitation note. |
| C5a | Shueisha MANGA MILLION launched worldwide (Aug 6, 2026) with titles in 100+ languages incl. Arabic | https://www.animenewsnetwork.com/news/2026-08-06/shueisha-launches-manga-million-digital-platform-worldwide-with-titles-in-100-lan | Aug 6, 2026 | Verified-SN; fetch attempt **Cloudflare-blocked** 2026-09-28 | Claim from ANN's own indexed snippet; kept with "blocked attempt" flag. Re-verify via mangaplus.shueisha.co.jp in Phase 1. |
| C5b | MANGA Plus MAX paid subscription exists (Standard/Deluxe tiers; $1.99/mo Standard) | https://mangaplus.shueisha.co.jp/web_pages/1177 | current page | **Verified-FT** (fetched 2026-09-28: "Subscribe to MANGA Plus MAX!", Standard + Deluxe headings confirmed) | Price $1.99 remains Verified-SN (app-store listing snippet). |
| C6 | Azora active in 2026 (official domain, © 2026 footer, Privacy Policy, DMCA, Discord, genre chips كوميدي/دراما); self-described translation team; third-party listing (Sep 2026) | https://azorafly.com ; https://azorafly.com/privacy-policy ; https://x.com/azora_manga ; https://tanzelat.org/azora-manga | Sep 6, 2026 (listing) | Verified-SN; direct fetch **Cloudflare-blocked** 2026-09-28 | Kept with blocked-attempt flag; no claims made about internals beyond indexed metadata. |
| C7 | Arabic aggregator field crowded and low-quality (Mangatek, MangaWi, Mangamello, عرب تونز, spam-adjacent clones) | search result set `/research/ar-query.json` (Sep 2026) | Sep 2026 | Verified-SN (observation) / qualitative | Kept as ecosystem observation. |
| C8 | Manta/Tappytoon/Lezhin appear in regional app-store charts (Tunisia) | https://appfigures.com | current | Verified-SN | **"No Arabic localization found" re-labeled: Unverified** — an absence claim from one search pass; do not rely on it. |

## 3. Legal claims (facts only — all legal conclusions still require qualified counsel)

| ID | Claim as used | Source URL | Pub. date | Label | Notes / action |
|---|---|---|---|---|---|
| L1 | Saudi: new Copyright Law key changes reported; economic rights incl. translation; SAIP registration exists; severe-enforcement reporting | https://www.mondaq.com ; https://saip.gov.sa ; https://www.legal500.com ; https://motaded.com.sa | Feb 26, 2026 / Jul 20, 2019 | Verified-SN | Law-firm commentary sources; official law text not opened. Sufficient for scoping, not for legal conclusions. |
| L2 | UAE: Federal Law No. 38 of 2021 governs digital works; infringement can carry severe penalties | https://www.nourattorneys.com ; https://alkabban.com ; https://www.legal500.com | Aug 22, 2026 / Dec 27, 2025 | Verified-SN | Kept. |
| L3 | Egypt: Law No. 82 of 2002 (Book Three), amended 26/2015 & 144/2019 | https://www.wipo.int ; https://eg.andersen.com | Oct 30, 2025 | Verified-SN | WIPO = official body. Kept. |
| L4 | Supabase Storage access control built on Postgres RLS | https://supabase-supabase.mintlify.app/storage-access-control | current | Verified-SN (official docs via mirror) | Canonical: supabase.com/docs — re-quote primary domain in Phase 1. |

## 4. Technical claims

| ID | Claim as used | Source URL | Pub. date | Label | Notes / action |
|---|---|---|---|---|---|
| T1 | Next.js 16 stable (Oct 21, 2025); Turbopack default bundler; App Router + React 19; Server Actions = primary mutation path; 16.2 current | https://www.infoq.com ; https://shubhra.dev ; https://vercel-next-js.mintlify.app | Dec 3, 2025 / Apr 16, 2026 | Verified-SN (multi-source corroboration) | Kept; pin exact version at install. |
| T2 | Supabase RLS best practices (RLS on all tables; `(select auth.uid())` pattern; zero-policy = denied) | https://gartsolutions.com ; https://dev.to ; https://vibeappscanner.com | Mar 29, 2026 | Verified-SN (professional/community) | Flag: quote supabase.com/docs primary pages in Phase 1 implementation docs. |
| T3 | Storage: S3-backed, smart CDN + image transformations, RLS-controlled | https://supabase-supabase.mintlify.app ; github.com/mvanhorn/clawdbot-skill-supabase | current | Verified-SN (mirror) | Same re-quote note as L4/T2. |
| T4 | Supabase free tier ≈ 500MB DB / 1GB storage / 50K MAU; idle pause | https://choosemystack.com ; https://www.letrelay.com | Sep 23, 2026 | Verified-SN (third-party) | Canonical supabase.com/pricing to be checked in Phase 1 before capacity claims. |
| T5 | Tailwind v4 (CSS-first) + shadcn/ui works on Next.js 16 App Router | https://github.com (shadcn-ui discussion #11952) ; https://dev.to | Sep 25, 2026 | Verified-SN (community-verified) | Kept; upgrade path documented. |
| T6 | IBM Plex Sans Arabic open-source (Google Fonts/Fontsource); Naskh-style screen fonts; line-height ≥1.7; letter-spacing 0 for Arabic | https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic ; https://fontsource.org ; https://voxire.com ; https://santa-media.co | Jun 1, 2026 (voxire) | Verified-SN (font foundries official; typography rules = practitioner sources) | Practitioner rules kept as **Inference-backed best practice**. |
| T7 | Only `NEXT_PUBLIC_*` reaches client bundle; server-only guard pattern | https://blog.nashtechglobal.com ; https://eastondev.com | Oct 31, 2025 / Jan 6, 2026 | Verified-SN (practitioner) | Re-quote nextjs.org docs in Phase 1. |
| T8 | Sentry `@sentry/nextjs` v11 (Sep 2026) supports App Router/Turbopack; wizard installer | https://docs.sentry.io/platforms/javascript/guides/nextjs ; https://www.npmjs.com/package/@sentry/nextjs | Sep 23, 2026 | Verified-SN (official SDK/docs) | Kept. |
| T9 | PostHog official Next.js App Router guide; privacy-first config | https://posthog.com ; https://vercel.com | Jul 15, 2025 | Verified-SN (official) | Kept. |
| T10 | Vercel + Supabase = mainstream supported pairing | https://www.liberateweb.com | Mar 7, 2026 | **Inference** (multiple independent 2026 stack guides) | Re-labeled from implied Verified to Inference; used only as deployment-pattern justification. |

## 5. Downgrade / removal log (applied this phase)

| Claim | Action taken | Reason |
|---|---|---|
| M4 "MENA anime +13.6%/yr, Saudi core" | **Downgraded** Verified → Inference/low-confidence | Undated, blog-grade source; no corroboration from a primary source |
| C8 "no Arabic localization for Manta/Tappytoon" | **Re-labeled** → Unverified | Absence claim from a single search pass |
| M3 GCC anime market size | **Weakened** to "indicative" | Press-release aggregator source |
| T10 Vercel+Supabase pairing | **Re-labeled** → Inference | Synthesis, not a single source statement |
| M7 conclusion "paid adoption lags" | Conclusion re-labeled **hypothesis** (quote stays Verified-SN) | Paywalled report body; strategic reliance must be validated |
| C1/C4 exact article URLs | Limitation note added | Search API returned root domains only; to re-capture |

## 6. Sources blocked during verification (2026-09-28)

| URL | Blocker | Consequence |
|---|---|---|
| https://azorafly.com | Cloudflare "Attention Required" | Only search-indexed metadata used for Azora claims |
| https://www.animenewsnetwork.com/... | Cloudflare "Just a moment..." | MANGA MILLION claim kept at snippet level with flag |

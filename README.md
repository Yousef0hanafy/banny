# مكتبة باني — Bunny Library

> Your personal Arabic library for stories worth getting lost in.
> **Release A — Foundation and Core Proof** (see `docs/RELEASE_PLAN.md`)

An Arabic-first, dark-mode, premium reading platform prototype for manga and webtoons — reader-first, RTL-native, fully functional, seeded with 100% original fictional content.

**Demo notice (binding):** this is a product prototype. All series, chapters, covers, names, and comments are original fictional content created for the demo. Nothing is licensed, official, or real. No payments. No downloads. No purchase flows.

---

## What's in Release A

| Surface | Routes |
|---|---|
| Home (reader-first: Continue Reading hero → latest updates → editorial collections → trending → newest → genre browse) | `/` |
| Explore (Arabic instant search, format/status/genre filters, popular/newest/rating sort, empty states) | `/explore` |
| Series detail (meta, Arabic synopsis, CTAs, chapter list with read/unread, locked-demo chapters, related series) | `/series/[slug]` |
| Webtoon reader (vertical continuous, progress, immersive mode) | `/read/webtoon/[series]/[chapter]` |
| Manga reader (paged, RTL/LTR toggle, page slider, keyboard nav, immersive mode) | `/read/manga/[series]/[chapter]` |
| Auth (demo credentials login) | `/login` |
| Basic account page (full profile ships in Release B) | `/profile` |
| Admin (guarded): dashboard-lite, series list/create/edit, chapters manager with draft→review→published workflow + publish/unpublish, chapter creation | `/admin`, `/admin/series`, `/admin/series/new`, `/admin/series/[id]`, `/admin/chapters`, `/admin/chapters/new` |
| 404 (Arabic) | any unknown route |

**Deferred to Release B/C** (intentionally absent here): novel reader, library/updates pages, comments/ratings/moderation, collections admin, dashboard analytics charts, scheduler UI, monitoring, full profile.

## Tech stack

- **Next.js 16 (App Router) + TypeScript strict + React 19**
- **Tailwind CSS v4** (CSS-first tokens in `src/app/globals.css`) + **shadcn/ui** (New York) + **Lucide icons**
- **Prisma + SQLite** for the local demo runtime
- **NextAuth v4** (credentials, JWT sessions, role in token)
- **IBM Plex Sans Arabic** via `next/font` (RTL-native typography: `dir="rtl"`, letter-spacing 0, line-height ≥ 1.75)
- **sharp** for deterministic generated cover/panel art (original abstract art — no copyrighted material)
- **Server Actions** for all mutations (progress saving, admin CRUD)

### Supabase production path

The demo runtime uses SQLite because this sandbox has no live Supabase project. The Supabase port is shipped and authoritative for production:

- `supabase/migrations/0001_release_a_schema_rls.sql` — Postgres schema (enums, tables, indexes) **+ full RLS policy set** (public read of published chapters only, owner-scoped progress, editor/admin content management, admin-only roles, storage bucket policies).
- The local data layer (`src/lib/queries.ts`, `src/lib/actions.ts`) enforces the same authorization matrix (session + role checks on every query/action) so behavior parity is testable locally.
- Swapping to Supabase later = provision project → run migration → port `src/lib/db.ts` to `@supabase/ssr` (data model and role model are unchanged).

## Getting started

```bash
bun install                # or npm install
bun run db:push            # create SQLite schema from prisma/schema.prisma
node scripts/generate-art.mjs   # generate all original cover/page/panel art (public/art/**)
bun prisma/seed.ts         # seed demo content (idempotent — safe to re-run)
bun run dev                # http://localhost:3000
```

`.env`:

```
DATABASE_URL="file:./db/custom.db"     # SQLite (scaffold default)
NEXTAUTH_SECRET=<any-long-random-string>
NEXTAUTH_URL=http://localhost:3000
```

## Demo accounts

| Role | Email | Password | Can do |
|---|---|---|---|
| Admin | `admin@bunny.demo` | `bunny-admin-2026` | Full admin panel incl. publish workflow |
| Reader | `reader@bunny.demo` | `bunny-reader-2026` | Synced reading progress (seeded mid-chapter) |
| Editor | `editor@bunny.demo` | `bunny-editor-2026` | Content management (no admin-only screens) |

Guests can browse and read; their progress persists in `localStorage` only (by design — DB-backed library is Release B).

## Seeded demo content (original fiction)

| Series | Format | Chapters | Notes |
|---|---|---|---|
| حارس بوابة الشفق | manga | 5 (1 review) | dark fantasy/action |
| مقهى أوراق النعناع | manga | 4 (completed) | slice of life |
| ملف حالة: مرسى الغائبين | manga | 4 (1 draft) | mystery |
| زفاف القمر الأحمر | webtoon | 6 (1 review, ch5 = locked premium demo) | romance/fantasy |
| نبض المدينة صفر | webtoon | 4 | sci-fi/action |
| خزانة زينب | webtoon | 3 (hiatus) | historical/drama |

Plus: 2 editorial collections, 3 seeded reading-progress rows for the reader account, ~320 analytics events, 226 generated art files.

## Admin workflow (what to demo)

1. Log in as admin → `/admin` shows live counts + recent activity + top series.
2. `/admin/chapters?workflow=review` → switch a chapter's workflow to **منشور** → the public series page immediately shows the new chapter (revalidated).
3. `/admin/chapters/new` → create a chapter (pages auto-generated as abstract placeholders).
4. Toggle **قفل تجريبي** on any chapter → it renders the locked-demo state publicly (no purchase flow exists).
5. `/admin/series/new` → create a series (cover upload arrives in Release B).
6. Log in as reader → `/admin` shows the Arabic "لا تملك صلاحية الوصول" screen (three-layer guard: middleware → layout → action).

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | dev server on :3000 |
| `bun run lint` | ESLint |
| `bun run db:push` | push Prisma schema |
| `bun prisma/seed.ts` | idempotent demo seed |
| `node scripts/generate-art.mjs` | regenerate all demo art |

## QA evidence (Release A exit criteria — browser-verified)

- Guest browse → read webtoon + manga chapters → progress resumes (localStorage mirror verified).
- Reader login → seeded continue-reading hero renders percentages + resume CTA.
- Reader-role admin denial screen verified.
- Admin login → dashboard metrics from seeded data.
- Publish workflow: review → published reflected publicly (DB + UI verified).
- Chapter creation with placeholder pages verified; duplicate chapter number rejected with Arabic error.
- Locked premium chapter state verified (no purchase affordance).
- Explore search + no-results state verified.
- RTL mirroring, mobile 390px layout (bottom nav), console error-free, ESLint clean.

## Known Release-A limitations (by design)

- «أضف إلى مكتبتي» button is visible but disabled with a «قريبًا» tag (library ships in B).
- New admin-created series have no cover art until the Release B upload flow.
- Comments, ratings, collections admin, scheduler, analytics charts → Release B.
- Monitoring/accessibility/deployment hardening → Release C.

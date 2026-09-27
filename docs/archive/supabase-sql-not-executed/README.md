# ⚠️ ARCHIVED — NOT EXECUTED — SUPERSEDED (2026-09-28)

**Status:** this SQL was never run against any database. It was a design-time
parity artifact written when the data layer was planned for a Supabase runtime
(docs/DECISIONS.md D-11). **No RLS policy, table, or storage rule in this file
has ever been created or executed.**

**Superseded by:** the founder-approved runtime migration to **Neon PostgreSQL**
(DECISIONS.md **D-28**):

- Runtime database = Neon Postgres via **Prisma** (ORM + versioned migrations in
  `prisma/migrations/`).
- `DATABASE_URL` = Neon pooled url (app runtime) · `DIRECT_URL` = Neon direct
  url (migrations/CLI).
- **No database-level RLS exists** — authorization is enforced at the
  application layer (middleware → admin layout → `requireRole` on every admin
  query/action), plus Postgres-level guarantees (enums, FKs, unique constraints).
- NextAuth remains the authentication layer. No Supabase SDK, storage, or Auth
  is used at runtime.

The file `0001_release_a_schema_rls.sql` is kept for historical reference only.
Do **not** execute it against Neon; it references Supabase-specific objects
(`auth.users`, storage buckets) that do not exist there.

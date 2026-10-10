# Offline Migration Rehearsal (`scripts/release-preflight.mjs`)

This operator guide outlines how to perform bounded, offline migration rehearsals using the preflight utility.

## Overview & Architecture

The preflight utility verifies that pending Prisma migrations execute cleanly and preserve existing data without connecting to any external database or running online queries.

- **Loopback Isolation:** Uses `embedded-postgres` bound strictly to `127.0.0.1` on a dynamically assigned port, initialized with `LC_COLLATE 'C'` and UTF8 encoding.
- **Credential & Secret Protection:** Generated database credentials and temporary database URLs are masked and never logged. Process outputs are scrubbed.
- **Clean Subprocess Lifecycle:** All processes set `windowsHide: true`. Graceful cluster shutdown is handled through `pg_ctl stop -m fast -w -t 30` before process termination.
- **Topological Transactional Restoration:** Historical tables and foreign key relationships are discovered from catalogue data, and data is inserted in dependency order in a single transaction.
- **Strict Verification:** Pre- and post-migration states are compared row-by-row on all original columns via `row_to_json` with UTC timestamps. Backfills (`Profile.emailVerifiedAt`, `Series.category`, and `ChapterRevision` editorial events) are asserted automatically.
- **No Side Effects:** Does not touch repository `.env` or `.env.local`, does not run `prisma generate` (which could overwrite built runtime client artifacts), and cleans up temporary data directories upon completion.

---

## Snapshot Specification

The snapshot fixture must be a read-only JSON export with the following schema:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-10-11T00:00:00.000Z",
  "migrations": [
    {
      "name": "20260927220347_init",
      "checksum": "942e7aaa77ecf2c1824e2fbfba1f1c648d18517cd85e4fd4f086f08a22efff8a"
    }
  ],
  "tables": [
    {
      "name": "Profile",
      "columns": ["id", "email", "name", "role", "createdAt", "updatedAt"],
      "rows": [
        {
          "id": "usr_example_1",
          "email": "operator@example.com",
          "name": "Operator",
          "role": "admin",
          "createdAt": "2026-09-27T22:04:00.000Z",
          "updatedAt": "2026-09-27T22:04:00.000Z"
        }
      ]
    }
  ]
}
```

### Constraints & Guardrails
- `schemaVersion` must be `1`.
- Table and column names must strictly match valid SQL identifier patterns (`^[a-zA-Z_][a-zA-Z0-9_]*$`).
- File size limit: 15 MB.
- Maximum dataset boundaries: 50 Series, 200 Chapters, 50 Profiles, and up to 50,000 total rows.
- Migration history must be a contiguous repository prefix with matching completed `_prisma_migrations` records and LF-normalized SHA256 checksums. Duplicate tables/columns, missing row columns and migration path traversal are rejected.
- A full public-table inventory is required; partial exports are refused. This rehearsal targets the current legacy dataset. Foreign-key cycles and future-scheduled published chapters require separate intentional-change verification and are refused.

---

## Running the Preflight Rehearsal

### Usage

```bash
node scripts/release-preflight.mjs --snapshot <ABSOLUTE_OR_RELATIVE_PATH_TO_SNAPSHOT>
```

Example:

```bash
node scripts/release-preflight.mjs --snapshot "C:/rehearsal-data/readonly-snapshot-20261011.json"
```

### Exit Codes
- `0`: Rehearsal succeeded. Historical data was restored, pending migrations applied cleanly, all original rows/columns matched, backfill checks passed, and the loopback PostgreSQL cluster was shut down cleanly.
- `1`: Rehearsal failed (or invalid input / missing snapshot argument). Details and sanitized failure logs are written to the temporary directory.

---

## Output Artifacts & Summary

Each run creates an isolated directory in the system temporary folder (`bunny-preflight-XXXXXX`), containing:

1. `preflight.log`: Redacted step-by-step runner log.
2. `postgres.log`: Generic engine error markers only; engine text is suppressed because it can contain private row values.
3. `prisma-migrate.log`: Output from `prisma migrate deploy`.
4. `summary.json`: An aggregated report containing aggregate numbers and booleans only (no hashes or row contents):
   - `snapshotMigrationsCount`
   - `snapshotTablesCount`
   - `originalRowsRestored` (per-table counts)
   - `postMigrationVerification` (matched row counts)
   - `backfillChecks` (Profile, Series, ChapterRevision, and `_prisma_migrations` stats)
   - `anomalies` (empty for the accepted legacy snapshot)

After shutdown and ownership/port checks, the disposable Postgres data directory is deleted while aggregate audit logs and `summary.json` are preserved. This is ordinary filesystem deletion, not secure erasure. Keep snapshots and temporary directories private and outside version control.

## Source export and release order

The utility never exports from Neon. The coordinator exports in a single `REPEATABLE READ READ ONLY` transaction, selects all public base tables and completed migration history, then rolls back. Credentials remain in memory; the private snapshot belongs in gitignored `.local-preview`, never `public` or release artifacts.

Before deployment, obtain a fresh snapshot and provider recovery point, rehearse against that snapshot, then run `prisma migrate deploy` against the confirmed direct production URL during the release window. Do not use `db:seed`, `db:reset` or `migrate dev` on production. Apply migrations before deploying code that queries the new columns. Application rollback alone cannot undo database migration; use the recovery point and an explicit recovery procedure if needed.

See `docs/superpowers/reports/2026-10-11-release-preflight.md` for this rehearsal's evidence and remaining publishing prerequisites.

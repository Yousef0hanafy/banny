import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { mkdtemp, readFile, realpath, rm, writeFile, readdir } from "node:fs/promises";
import { createWriteStream, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { createHash, randomBytes } from "node:crypto";
import { once } from "node:events";
import { fileURLToPath, pathToFileURL } from "node:url";

// Record and wrap child processes to enforce windowsHide and own process tracking
const repo = process.cwd();
const children = new Set();
const originalSpawn = childProcess.spawn;
childProcess.spawn = (command, args, options = {}) => {
  const child = originalSpawn(command, args, { ...options, windowsHide: true });
  children.add(child);
  child.once("exit", () => children.delete(child));
  child.once("error", () => children.delete(child));
  return child;
};
syncBuiltinESMExports();

// Sensible bounds for the snapshot dataset
const LIMITS = {
  MAX_FILE_BYTES: 15 * 1024 * 1024, // 15MB max file size
  MAX_SERIES: 50,
  MAX_CHAPTERS: 200,
  MAX_PROFILES: 50,
  MAX_TOTAL_ROWS: 50000,
  MAX_TABLE_ROWS: 25000,
};

// Safe identifier validation
const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
function assertIdentifier(name, kind = "identifier") {
  if (typeof name !== "string" || !IDENTIFIER_REGEX.test(name)) {
    throw new Error(`Invalid ${kind} name: ${String(name).slice(0, 30)}`);
  }
}

function escapeIdentifier(id) {
  assertIdentifier(id);
  return `"${id}"`;
}

export function computeNormalizedSha256(content) {
  const normalized = content.replace(/\r\n/g, "\n");
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function validateSnapshotFormat(snapshot, byteLength = 0) {
  if (byteLength > LIMITS.MAX_FILE_BYTES) {
    throw new Error(`Snapshot exceeds maximum allowed size (${byteLength} > ${LIMITS.MAX_FILE_BYTES} bytes)`);
  }
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Invalid snapshot format: must be a JSON object");
  }
  if (snapshot.schemaVersion !== 1) {
    throw new Error(`Unsupported snapshot schemaVersion: ${snapshot.schemaVersion} (expected 1)`);
  }
  if (!Array.isArray(snapshot.migrations)) {
    throw new Error("Invalid snapshot: 'migrations' array is required");
  }
  if (!Array.isArray(snapshot.tables)) {
    throw new Error("Invalid snapshot: 'tables' array is required");
  }

  let totalRows = 0;
  for (const mig of snapshot.migrations) {
    if (!mig || typeof mig.name !== "string" || typeof mig.checksum !== "string") {
      throw new Error("Invalid snapshot migration entry: 'name' and 'checksum' strings are required");
    }
    if (!/^\d{14}_[a-z0-9_]+$/.test(mig.name) || !/^[a-f0-9]{64}$/.test(mig.checksum)) {
      throw new Error("Invalid migration name or checksum format");
    }
  }

  for (const table of snapshot.tables) {
    if (!table || typeof table.name !== "string") {
      throw new Error("Invalid snapshot table entry: 'name' string is required");
    }
    assertIdentifier(table.name, "table");
    if (!Array.isArray(table.columns)) {
      throw new Error(`Table ${table.name} must have a 'columns' array`);
    }
    for (const col of table.columns) {
      assertIdentifier(col, "column");
    }
    if (!Array.isArray(table.rows)) {
      throw new Error(`Table ${table.name} must have a 'rows' array`);
    }
    if (table.rows.length > LIMITS.MAX_TABLE_ROWS) {
      throw new Error(`Table ${table.name} exceeds row limit (${table.rows.length} > ${LIMITS.MAX_TABLE_ROWS})`);
    }
    totalRows += table.rows.length;

    if (table.name === "Series" && table.rows.length > LIMITS.MAX_SERIES) {
      throw new Error(`Series count (${table.rows.length}) exceeds expected bounds (${LIMITS.MAX_SERIES})`);
    }
    if (table.name === "Chapter" && table.rows.length > LIMITS.MAX_CHAPTERS) {
      throw new Error(`Chapter count (${table.rows.length}) exceeds expected bounds (${LIMITS.MAX_CHAPTERS})`);
    }
    if (table.name === "Profile" && table.rows.length > LIMITS.MAX_PROFILES) {
      throw new Error(`Profile count (${table.rows.length}) exceeds expected bounds (${LIMITS.MAX_PROFILES})`);
    }
  }

  if (totalRows > LIMITS.MAX_TOTAL_ROWS) {
    throw new Error(`Total snapshot rows (${totalRows}) exceeds sensible limit (${LIMITS.MAX_TOTAL_ROWS})`);
  }

  if (new Set(snapshot.tables.map(t => t.name)).size !== snapshot.tables.length ||
      new Set(snapshot.migrations.map(m => m.name)).size !== snapshot.migrations.length) {
    throw new Error("Duplicate table or migration entry");
  }
  for (const table of snapshot.tables) {
    if (new Set(table.columns).size !== table.columns.length) throw new Error("Duplicate column entry");
    for (const row of table.rows) {
      if (!row || typeof row !== "object" || Array.isArray(row) ||
          Object.keys(row).length !== table.columns.length ||
          table.columns.some(c => !Object.hasOwn(row, c))) throw new Error("Invalid snapshot row shape");
    }
  }
  const chapters = snapshot.tables.find(t => t.name === "Chapter");
  if (chapters?.rows.some(r => r.workflow === "published" && r.scheduledFor && Date.parse(r.scheduledFor) > Date.now())) {
    throw new Error("Future-scheduled published chapters require explicit intentional-change verification");
  }

  return true;
}

export function sortTablesTopologically(tableNames, fks) {
  // fks: Array of { fromTable, toTable }
  const inDegree = new Map();
  const graph = new Map();

  for (const t of tableNames) {
    inDegree.set(t, 0);
    graph.set(t, new Set());
  }

  for (const { fromTable, toTable } of fks) {
    if (fromTable !== toTable && inDegree.has(fromTable) && inDegree.has(toTable)) {
      if (!graph.get(toTable).has(fromTable)) {
        graph.get(toTable).add(fromTable);
        inDegree.set(fromTable, inDegree.get(fromTable) + 1);
      }
    }
  }

  const queue = [];
  for (const [t, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(t);
  }

  const sorted = [];
  while (queue.length > 0) {
    queue.sort(); // Deterministic ordering
    const curr = queue.shift();
    sorted.push(curr);

    for (const neighbor of graph.get(curr)) {
      const newDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length < tableNames.length) {
    throw new Error("Foreign-key dependency cycle requires explicit restoration support");
  }

  return sorted;
}

async function freePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function bounded(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function redactText(text, secrets = []) {
  if (typeof text !== "string") return text;
  let res = text;
  for (const sec of secrets) {
    if (sec) {
      res = res.split(sec).join("[redacted]");
    }
  }
  return res;
}

export async function runPreflight(options = {}) {
  const snapshotPath = options.snapshotPath;
  if (!snapshotPath) {
    throw new Error("Missing required --snapshot path");
  }

  const resolvedSnapshotPath = path.resolve(snapshotPath);
  if (!existsSync(resolvedSnapshotPath)) {
    throw new Error(`Snapshot file does not exist: ${resolvedSnapshotPath}`);
  }

  const snapshotStat = await readFile(resolvedSnapshotPath);
  const rawJson = snapshotStat.toString("utf8");
  let snapshot;
  try { snapshot = JSON.parse(rawJson); } catch { throw new Error("Snapshot is not valid JSON"); }
  validateSnapshotFormat(snapshot, snapshotStat.byteLength);

  // Check repo migration files matching snapshot migration names and verify LF-normalized SHA256 checksums
  const migrationsDir = path.join(repo, "prisma/migrations");
  const repositoryMigrations = (await readdir(migrationsDir, { withFileTypes: true }))
    .filter(d => d.isDirectory()).map(d => d.name).sort();
  if (!snapshot.migrations.length || snapshot.migrations.some((m, i) => m.name !== repositoryMigrations[i])) {
    throw new Error("Snapshot history is not a contiguous repository migration prefix");
  }
  const history = snapshot.tables.find(t => t.name === "_prisma_migrations");
  if (!history || history.rows.length !== snapshot.migrations.length ||
      snapshot.migrations.some(m => !history.rows.some(r => r.migration_name === m.name &&
        r.checksum === m.checksum && r.finished_at && !r.rolled_back_at))) {
    throw new Error("Snapshot migration records do not match completed history");
  }
  const verifiedMigrations = [];
  for (const snapMig of snapshot.migrations) {
    const migSqlPath = path.join(migrationsDir, snapMig.name, "migration.sql");
    if (!existsSync(migSqlPath)) {
      throw new Error(`Migration ${snapMig.name} specified in snapshot not found in repository`);
    }
    const sqlContent = await readFile(migSqlPath, "utf8");
    const calcHash = computeNormalizedSha256(sqlContent);
    if (calcHash !== snapMig.checksum) {
      throw new Error(
        `Migration checksum mismatch for ${snapMig.name}`
      );
    }
    verifiedMigrations.push({ name: snapMig.name, sql: sqlContent.replace(/\r\n/g, "\n"), checksum: calcHash });
  }

  // Setup private isolated temporary directory outside repo
  const runDir = await mkdtemp(path.join(tmpdir(), "bunny-preflight-"));
  const dataDir = path.join(runDir, "postgres");
  const logsStream = createWriteStream(path.join(runDir, "preflight.log"));
  const secretsToRedact = [];

  const log = msg => {
    const redacted = redactText(msg, secretsToRedact);
    console.log(redacted);
    logsStream.write(`${redacted}\n`);
  };

  log(`Preflight run directory initialized: ${runDir}`);

  // Dynamic import of embedded-postgres
  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const { default: getBinaries } = await import(
    pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.resolve("embedded-postgres"))), "binary.js")).href
  );
  const binaries = await getBinaries();

  const pgPort = await freePort();
  const dbName = `preflight_${randomBytes(8).toString("hex")}`;
  const password = randomBytes(24).toString("hex");
  const dbUser = "preflight_qa";
  secretsToRedact.push(password);

  const loopbackDatabaseUrl = `postgresql://${dbUser}:${password}@127.0.0.1:${pgPort}/${dbName}`;
  secretsToRedact.push(loopbackDatabaseUrl);

  const pgLog = createWriteStream(path.join(runDir, "postgres.log"));
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: pgPort,
    user: dbUser,
    password,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    postgresFlags: ["-h", "127.0.0.1"],
    // PostgreSQL errors can contain row values or SQL; retain no engine text.
    onLog: () => {},
    onError: () => pgLog.write("PostgreSQL client error\n"),
  });

  const stopChild = async child => {
    if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
    if (process.platform === "win32") {
      const killer = childProcess.spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      await bounded(once(killer, "exit"), 10_000, "taskkill").catch(() => {});
    } else {
      child.kill("SIGTERM");
    }
  };

  const summaryReport = {
    rehearsalTimestamp: new Date().toISOString(),
    status: "failed",
    snapshotMigrationsCount: snapshot.migrations.length,
    snapshotTablesCount: snapshot.tables.length,
    originalRowsRestored: {},
    postMigrationVerification: {},
    backfillChecks: {},
    anomalies: [],
  };

  try {
    await bounded(pg.initialise(), 60_000, "pg initdb");
    await bounded(pg.start(), 60_000, "pg start");

    // Connect to maintenance database 'postgres' to create target db with LC_COLLATE 'C'
    const adminClient = pg.getPgClient("postgres", "127.0.0.1");
    try {
      await adminClient.connect();
      await adminClient.query(
        `CREATE DATABASE "${dbName}" ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`
      );
    } finally {
      await adminClient.end();
    }
    log(`Disposable loopback PostgreSQL database ${dbName} created (LC_COLLATE C)`);

    // Connect to the newly created database using pg Client
    const targetClient = pg.getPgClient(dbName, "127.0.0.1");
    await targetClient.connect();

    try {
      // 1. Ensure UTC timezone on session
      await targetClient.query("SET timezone = 'UTC'");
      await targetClient.query("SET statement_timeout = '15s'");

      // 2. Create _prisma_migrations table if not already present
      await targetClient.query(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
            "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
            "checksum"              VARCHAR(64) NOT NULL,
            "finished_at"           TIMESTAMPTZ,
            "migration_name"        VARCHAR(255) NOT NULL,
            "logs"                  TEXT,
            "rolled_back_at"        TIMESTAMPTZ,
            "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
            "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
        );
      `);

      // 3. Apply historical migrations sequentially
      for (const mig of verifiedMigrations) {
        log(`Applying snapshot migration: ${mig.name}`);
        await targetClient.query(mig.sql);
      }
      const catalogue = await targetClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
      const expectedTables = snapshot.tables.map(t => t.name).sort();
      if (JSON.stringify(catalogue.rows.map(r => r.table_name)) !== JSON.stringify(expectedTables)) {
        throw new Error("Snapshot table inventory differs from historical schema");
      }

      // 4. Query FK relationships from Postgres catalogue to determine topological restore order
      const fkQuery = `
        SELECT
            tc.table_name AS "fromTable",
            ccu.table_name AS "toTable"
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
      `;
      const fkRes = await targetClient.query(fkQuery);
      const snapshotTableNames = snapshot.tables.map(t => t.name);
      const sortedOrder = sortTablesTopologically(snapshotTableNames, fkRes.rows);

      // Map snapshot tables for quick lookup
      const tableMap = new Map();
      for (const t of snapshot.tables) {
        tableMap.set(t.name, t);
      }

      // 5. Restore snapshot data transactionally in topological order
      log("Restoring snapshot data inside single transaction...");
      await targetClient.query("BEGIN");
      for (const tableName of sortedOrder) {
        const tableObj = tableMap.get(tableName);
        if (!tableObj || tableObj.rows.length === 0) continue;

        const quotedTable = escapeIdentifier(tableName);
        const quotedCols = tableObj.columns.map(escapeIdentifier).join(", ");
        let restoredInTable = 0;

        for (const rowObj of tableObj.rows) {
          const values = [];
          const placeholders = [];
          for (let i = 0; i < tableObj.columns.length; i++) {
            const colName = tableObj.columns[i];
            let val = rowObj[colName] !== undefined ? rowObj[colName] : null;
            if (val !== null && typeof val === "object") {
              // Convert nested objects/arrays to JSON string for Postgres JSONB columns
              val = JSON.stringify(val);
            }
            values.push(val);
            placeholders.push(`$${i + 1}`);
          }
          const insertSql = `INSERT INTO ${quotedTable} (${quotedCols}) VALUES (${placeholders.join(", ")})`;
          await targetClient.query(insertSql, values);
          restoredInTable++;
        }
        summaryReport.originalRowsRestored[tableName] = restoredInTable;
      }
      await targetClient.query("COMMIT");
      log(`Restored all snapshot tables transactionally. Total tables: ${Object.keys(summaryReport.originalRowsRestored).length}`);

      // 6. Inspect snapshot for scheduled published chapters
      const chapterTable = tableMap.get("Chapter");
      if (chapterTable) {
        const now = new Date();
        const scheduledPublished = chapterTable.rows.filter(
          r => r.workflow === "published" && r.scheduledFor && new Date(r.scheduledFor) > now
        );
        if (scheduledPublished.length > 0) {
          const msg = `Snapshot contains ${scheduledPublished.length} future-scheduled published chapters; documented intentional migration changes will demote them to draft`;
          log(msg);
          summaryReport.anomalies.push({ type: "FUTURE_SCHEDULED_CHAPTERS", count: scheduledPublished.length });
        }
      }

      // 7. Run pending Prisma migrations deploy
      log("Executing Prisma migrate deploy against disposable cluster...");
      const prismaBinary = path.join(repo, "node_modules/prisma/build/index.js");
      const cleanEnv = {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        NODE_ENV: "production",
        DATABASE_URL: loopbackDatabaseUrl,
        DIRECT_URL: loopbackDatabaseUrl,
        PRISMA_DISABLE_WARNINGS: "1",
      };

      const migrateOut = createWriteStream(path.join(runDir, "prisma-migrate.log"));
      const migrateChild = childProcess.spawn(
        process.execPath,
        [prismaBinary, "migrate", "deploy", "--schema", path.join(repo, "prisma/schema.prisma")],
        {
          cwd: runDir,
          env: cleanEnv,
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      migrateChild.stdout.on("data", chunk => migrateOut.write(redactText(chunk.toString(), secretsToRedact)));
      migrateChild.stderr.on("data", chunk => migrateOut.write(redactText(chunk.toString(), secretsToRedact)));

      const [migrateExitCode] = await bounded(once(migrateChild, "exit"), 180_000, "Prisma migrate deploy");
      migrateOut.end();

      if (migrateExitCode !== 0) {
        throw new Error(`Prisma migrate deploy exited with code ${migrateExitCode}`);
      }
      log("Prisma migrate deploy succeeded");

      // 8. Verification against snapshot:
      // Compare every original table/row/column with snapshot.
      log("Verifying original rows and columns post-migration...");
      for (const tableObj of snapshot.tables) {
        const tableName = tableObj.name;
        const quotedTable = escapeIdentifier(tableName);

        // Fetch all rows as json via row_to_json with UTC
        const selectSql = `SELECT row_to_json(t) AS data FROM ${quotedTable} t`;
        const res = await targetClient.query(selectSql);
        const dbRows = res.rows.map(r => r.data);
        if (tableName !== "_prisma_migrations" && dbRows.length !== tableObj.rows.length) {
          throw new Error(`Unexpected row count after migration on ${tableName}`);
        }

        // Map dbRows by ID if primary key 'id' exists, else canonical key
        const hasId = tableObj.columns.includes("id");
        const dbRowMap = new Map();
        for (const row of dbRows) {
          const key = hasId ? String(row.id) : JSON.stringify(row);
          dbRowMap.set(key, row);
        }

        let verifiedRows = 0;
        let mismatchedRows = 0;

        for (const origRow of tableObj.rows) {
          const key = hasId ? String(origRow.id) : JSON.stringify(origRow);
          const currentDbRow = dbRowMap.get(key);

          if (!currentDbRow) {
            mismatchedRows++;
            continue;
          }

          let colsMatch = true;
          for (const col of tableObj.columns) {
            // Check documented intentional migration changes for Chapter
            if (tableName === "Chapter" && (col === "workflow" || col === "scheduledFor" || col === "publishedAt")) {
              const wasScheduledFuture =
                origRow.workflow === "published" && origRow.scheduledFor && new Date(origRow.scheduledFor) > new Date();
              if (wasScheduledFuture) {
                // Expected to be converted to draft, null, null
                continue;
              }
            }

            const origVal = origRow[col];
            const currVal = currentDbRow[col];

            // Normalize timestamp / ISO / JSON representation
            if (origVal === null && currVal === null) {
              continue;
            } else if (origVal === null || currVal === null) {
              colsMatch = false;
              break;
            } else if (typeof origVal === "object" || typeof currVal === "object") {
              if (JSON.stringify(origVal) !== JSON.stringify(currVal)) {
                colsMatch = false;
                break;
              }
            } else if (String(origVal) !== String(currVal)) {
              // Check if both are dates matching in epoch milliseconds
              const isTimestamp = /^\d{4}-\d{2}-\d{2}T/.test(String(origVal)) && /^\d{4}-\d{2}-\d{2}T/.test(String(currVal));
              const d1 = isTimestamp ? Date.parse(String(origVal)) : NaN;
              const d2 = isTimestamp ? Date.parse(String(currVal)) : NaN;
              if (!Number.isNaN(d1) && !Number.isNaN(d2) && d1 === d2) {
                continue;
              }
              colsMatch = false;
              break;
            }
          }

          if (colsMatch) {
            verifiedRows++;
          } else {
            mismatchedRows++;
          }
        }

        summaryReport.postMigrationVerification[tableName] = {
          expectedOriginalRows: tableObj.rows.length,
          verifiedMatchedRows: verifiedRows,
          mismatchedRows,
        };

        if (mismatchedRows > 0) {
          throw new Error(`Data verification mismatch on table ${tableName}: ${mismatchedRows} rows diverged`);
        }
      }

      // 9. Backfill Expectations Verification
      // a. Profile: emailVerifiedAt == createdAt, authVersion == 0
      const profileBackfillRes = await targetClient.query(`
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE "emailVerifiedAt" = "createdAt")::int AS verified_matches_created,
            COUNT(*) FILTER (WHERE "authVersion" = 0)::int AS version_zero_count,
            COUNT(*) FILTER (WHERE "disabledAt" IS NULL)::int AS non_disabled_count
        FROM "Profile";
      `);
      summaryReport.backfillChecks.profile = profileBackfillRes.rows[0];
      const profileCheck = profileBackfillRes.rows[0];
      if ([profileCheck.verified_matches_created, profileCheck.version_zero_count, profileCheck.non_disabled_count].some(n => n !== profileCheck.total)) {
        throw new Error("Profile backfill assertion failed");
      }

      // b. Series: manga/novel category backfill, webtoon null
      const seriesBackfillRes = await targetClient.query(`
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE "format" = 'manga' AND "category"::text = 'manga')::int AS manga_category_ok,
            COUNT(*) FILTER (WHERE "format" = 'novel' AND "category"::text = 'novel')::int AS novel_category_ok,
            COUNT(*) FILTER (WHERE "format" = 'webtoon' AND "category" IS NULL)::int AS webtoon_null_category_ok
        FROM "Series";
      `);
      summaryReport.backfillChecks.series = seriesBackfillRes.rows[0];
      const seriesCheck = seriesBackfillRes.rows[0];
      if (seriesCheck.manga_category_ok + seriesCheck.novel_category_ok + seriesCheck.webtoon_null_category_ok !== seriesCheck.total) {
        throw new Error("Series category backfill assertion failed");
      }

      // c. ChapterRevision counts: exactly matches Chapter count
      const chapterRevRes = await targetClient.query(`
        SELECT
            (SELECT COUNT(*)::int FROM "Chapter") AS chapter_count,
            (SELECT COUNT(*)::int FROM "ChapterRevision") AS revision_count,
            (SELECT COUNT(*)::int FROM "ChapterEditorialEvent" WHERE "action" = 'migration_backfill') AS editorial_events_count;
      `);
      summaryReport.backfillChecks.chapterRevisions = chapterRevRes.rows[0];
      const revisionsCheck = chapterRevRes.rows[0];
      if (revisionsCheck.chapter_count !== revisionsCheck.revision_count || revisionsCheck.chapter_count !== revisionsCheck.editorial_events_count) {
        throw new Error("Chapter revision/event count assertion failed");
      }
      const revisionContent = await targetClient.query(`SELECT COUNT(*)::int AS mismatches FROM "Chapter" c
        JOIN "ChapterRevision" r ON r."chapterId"=c.id
        WHERE r.id <> 'rev_' || c.id || '_1' OR r."revisionNumber" <> 1 OR r.version <> 1
        OR r.status::text <> c.workflow::text OR r."titleAr" IS DISTINCT FROM c."titleAr"
        OR r."novelBody" IS DISTINCT FROM c."novelBody" OR r."readingDirection" IS DISTINCT FROM c."readingDirection"
        OR r."isPremiumDemo" IS DISTINCT FROM c."isPremiumDemo"
        OR r."pagesJson" IS DISTINCT FROM COALESCE((SELECT jsonb_agg(jsonb_build_object('pageIndex', p."pageIndex", 'imagePath', p."imagePath", 'width', p.width, 'height', p.height) ORDER BY p."pageIndex") FROM "ChapterPage" p WHERE p."chapterId"=c.id), '[]'::jsonb)`);
      if (revisionContent.rows[0].mismatches !== 0) throw new Error("Chapter revision content assertion failed");
      summaryReport.backfillChecks.chapterRevisions.contentMatches = true;

      // d. _prisma_migrations record verification
      const prismaMigRes = await targetClient.query(`
        SELECT "migration_name", "checksum" FROM "_prisma_migrations" ORDER BY "started_at" ASC;
      `);
      const allAppliedNames = new Set(prismaMigRes.rows.map(r => r.migration_name));
      for (const snapMig of snapshot.migrations) {
        if (!allAppliedNames.has(snapMig.name)) {
          throw new Error(`Original migration ${snapMig.name} missing in final _prisma_migrations`);
        }
      }
      summaryReport.backfillChecks.prismaMigrations = {
        totalInDb: prismaMigRes.rows.length,
        originalRetained: snapshot.migrations.length,
        newlyApplied: prismaMigRes.rows.length - snapshot.migrations.length,
      };
      if (prismaMigRes.rows.length !== repositoryMigrations.length ||
          repositoryMigrations.some(n => !allAppliedNames.has(n))) throw new Error("Pending migration inventory assertion failed");

      summaryReport.status = "success";
      log("All post-migration verifications and backfill assertions passed successfully!");
    } finally {
      await targetClient.end().catch(() => {});
    }
  } catch (err) {
    summaryReport.status = "failed";
    // Driver errors can disclose private rows; expose only controlled errors.
    summaryReport.errorMessage = err.code ? `Database operation failed (${String(err.code).replace(/[^A-Za-z0-9]/g, "")})` : redactText(err.message, secretsToRedact);
    log(`Preflight rehearsal failed: ${summaryReport.errorMessage}`);
    process.exitCode = 1;
  } finally {
    // Graceful PostgreSQL shutdown
    if (pg.process && pg.process.exitCode === null) {
      log("Stopping owned PostgreSQL cluster...");
      const stop = childProcess.spawn(
        binaries.pg_ctl,
        ["-D", dataDir, "stop", "-m", "fast", "-w", "-t", "30"],
        { stdio: "ignore" }
      );
      const [code] = await bounded(once(stop, "exit"), 35_000, "PostgreSQL shutdown").catch(() => [1]);
      if (code !== 0) {
        summaryReport.status = "failed";
        summaryReport.cleanupFailed = true;
        process.exitCode = 1;
        log("Graceful PostgreSQL shutdown timed out or failed, stopping child process");
        await stopChild(pg.process);
      } else {
        log("Owned PostgreSQL cluster stopped successfully");
      }
      pg.process = undefined;
    }

    // Stop any remaining owned children
    for (const child of [...children]) {
      await stopChild(child).catch(() => {});
    }

    // Cleanup data directory safely
    const closedPorts = await Promise.all(
      [pgPort].map(
        port =>
          new Promise(resolve => {
            const probe = net.createServer();
            probe.once("error", () => resolve(false));
            probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
          })
      )
    );

    try {
      const root = await realpath(runDir);
      const temp = await realpath(tmpdir());
      if (
        path.dirname(root) === temp &&
        path.basename(root).startsWith("bunny-preflight-") &&
        path.resolve(dataDir) === path.join(root, "postgres") &&
        children.size === 0 &&
        closedPorts.every(Boolean)
      ) {
        await rm(dataDir, { recursive: true, force: true });
        log("Cleaned up temporary PostgreSQL database data directory");
      } else {
        summaryReport.status = "failed";
        summaryReport.cleanupFailed = true;
        process.exitCode = 1;
        log("Cleanup safety check failed; retaining runDir for analysis");
      }
    } catch (cleanupErr) {
      summaryReport.status = "failed";
      summaryReport.cleanupFailed = true;
      process.exitCode = 1;
      log(`Cleanup error: ${cleanupErr.message}`);
    }

    // Write final summary (aggregate counts and booleans only)
    await writeFile(path.join(runDir, "summary.json"), JSON.stringify(summaryReport, null, 2), "utf8");
    log(`Summary saved to ${path.join(runDir, "summary.json")}`);

    await Promise.all([
      new Promise(resolve => pgLog.end(resolve)),
      new Promise(resolve => logsStream.end(resolve)),
    ]);
  }

  return summaryReport;
}

// CLI entry point
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  let snapshotPath = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--snapshot" && i + 1 < args.length) {
      snapshotPath = args[i + 1];
      break;
    }
  }

  if (!snapshotPath) {
    console.error("Error: --snapshot <path> is required");
    process.exit(1);
  }

  runPreflight({ snapshotPath })
    .then(report => {
      if (report.status !== "success") {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });
}

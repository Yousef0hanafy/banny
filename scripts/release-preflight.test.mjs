import test from "node:test";
import assert from "node:assert/strict";
import {
  computeNormalizedSha256,
  validateSnapshotFormat,
  sortTablesTopologically,
} from "./release-preflight.mjs";

test("computeNormalizedSha256 produces consistent hashes regardless of CRLF vs LF", () => {
  const lfString = "CREATE TABLE test (\n  id TEXT PRIMARY KEY\n);\n";
  const crlfString = "CREATE TABLE test (\r\n  id TEXT PRIMARY KEY\r\n);\r\n";

  const hash1 = computeNormalizedSha256(lfString);
  const hash2 = computeNormalizedSha256(crlfString);

  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64);
});

test("validateSnapshotFormat rejects invalid schemaVersion and structures", () => {
  assert.throws(() => validateSnapshotFormat(null), /must be a JSON object/);
  assert.throws(
    () => validateSnapshotFormat({ schemaVersion: 2, migrations: [], tables: [] }),
    /Unsupported snapshot schemaVersion: 2/
  );
  assert.throws(
    () => validateSnapshotFormat({ schemaVersion: 1, tables: [] }),
    /'migrations' array is required/
  );
  assert.throws(
    () => validateSnapshotFormat({ schemaVersion: 1, migrations: [] }),
    /'tables' array is required/
  );
});

test("validateSnapshotFormat guards identifier names against injection", () => {
  assert.throws(
    () =>
      validateSnapshotFormat({
        schemaVersion: 1,
        migrations: [],
        tables: [{ name: "Users; DROP TABLE Important;", columns: ["id"], rows: [] }],
      }),
    /Invalid table name/
  );

  assert.throws(
    () =>
      validateSnapshotFormat({
        schemaVersion: 1,
        migrations: [],
        tables: [{ name: "ValidTable", columns: ["col--bad"], rows: [] }],
      }),
    /Invalid column name/
  );
});

test("validateSnapshotFormat enforces row boundary limits", () => {
  const overRows = Array.from({ length: 55 }, (_, i) => ({ id: `id-${i}` }));
  assert.throws(
    () =>
      validateSnapshotFormat({
        schemaVersion: 1,
        migrations: [],
        tables: [{ name: "Series", columns: ["id"], rows: overRows }],
      }),
    /Series count/
  );
});

test("sortTablesTopologically respects foreign-key dependencies", () => {
  const tables = ["Chapter", "Profile", "Series"];
  const fks = [
    { fromTable: "Series", toTable: "Profile" }, // Series depends on Profile (e.g. author/uploader)
    { fromTable: "Chapter", toTable: "Series" },  // Chapter depends on Series
  ];

  const sorted = sortTablesTopologically(tables, fks);
  assert.deepEqual(sorted, ["Profile", "Series", "Chapter"]);
});

test("snapshot refuses traversal, duplicate tables, malformed rows and implicit scheduled changes", () => {
  const fixture = () => ({ schemaVersion: 1, migrations: [], tables: [] });
  const badMigration = fixture();
  badMigration.migrations.push({ name: "../../private", checksum: "a".repeat(64) });
  assert.throws(() => validateSnapshotFormat(badMigration), /Invalid migration/);
  const duplicates = fixture();
  duplicates.tables = [{name:"Profile", columns:["id"], rows:[]}, {name:"Profile", columns:["id"], rows:[]}];
  assert.throws(() => validateSnapshotFormat(duplicates), /Duplicate table/);
  const badRow = fixture();
  badRow.tables = [{name:"Profile", columns:["id"], rows:[{passwordHash:"private"}]}];
  assert.throws(() => validateSnapshotFormat(badRow), /Invalid snapshot row shape/);
  const scheduled = fixture();
  scheduled.tables = [{name:"Chapter", columns:["workflow", "scheduledFor"], rows:[{workflow:"published",scheduledFor:"2999-01-01T00:00:00Z"}]}];
  assert.throws(() => validateSnapshotFormat(scheduled), /Future-scheduled/);
  assert.throws(() => sortTablesTopologically(["A", "B"], [{fromTable:"A",toTable:"B"},{fromTable:"B",toTable:"A"}]), /dependency cycle/);
});

/**
 * Bunny Library — local ephemeral PostgreSQL for QA (Release D).
 *
 * WHY: the sandbox reset wiped .env.local (Neon credentials lost, founder rotation
 * pending), but Release D needs full runtime QA against a REAL PostgreSQL. This
 * script boots an embedded PG 18 (same major as Neon) on 127.0.0.1:54329, using
 * a data dir under /tmp so NOTHING gitignored in the repo is touched.
 *
 * It NEVER prints connection contents with secrets (the URL it manages is local
 * and credential-free: postgres://qa:qa@127.0.0.1:54329/bunny_qa).
 *
 * Usage:
 *   node scripts/qa-local-pg.mjs start    # init (first run) + start, waits until ready
 *   node scripts/qa-local-pg.mjs stop     # pg_ctl stop
 *   node scripts/qa-local-pg.mjs status   # exit 0 if running
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const PORT = 54329;
const DATA_DIR = "/tmp/bunny-qa-pg";
const LOG = "/tmp/bunny-qa-pg.log";
const BIN = path.join(
  process.cwd(),
  "node_modules/@embedded-postgres/linux-x64/native/bin"
);
const pg = (cmd, args) =>
  spawnSync(path.join(BIN, cmd), args, { stdio: "pipe", encoding: "utf8" });

function ready() {
  // The embedded package ships no pg_isready/psql — a TCP connect against the
  // postmaster plus the pg_ctl start log is our readiness signal.
  return new Promise((resolve) => {
    const sock = net.connect({ host: "127.0.0.1", port: PORT, timeout: 1500 });
    sock.on("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => resolve(false));
    sock.on("timeout", () => {
      sock.destroy();
      resolve(false);
    });
  });
}

async function start() {
  if (await ready()) {
    console.log("QA-PG: already running");
    return;
  }
  if (!existsSync(path.join(DATA_DIR, "PG_VERSION"))) {
    mkdirSync(DATA_DIR, { recursive: true });
    const r = pg("initdb", ["-D", DATA_DIR, "-U", "qa", "-A", "trust", "-E", "utf8"]);
    if (r.status !== 0) {
      console.error("initdb failed:", r.stderr?.slice(0, 800));
      process.exit(1);
    }
  }
  const s = pg("pg_ctl", ["-D", DATA_DIR, "-l", LOG, "-o", `-p ${PORT} -c listen_addresses=127.0.0.1`, "start"]);
  if (s.status !== 0) {
    console.error("pg_ctl start failed:", s.stderr?.slice(0, 800));
    process.exit(1);
  }
  let up = false;
  for (let i = 0; i < 40; i++) {
    up = await ready();
    if (up) break;
    spawnSync("sleep", ["0.25"]);
  }
  if (!up) {
    console.error("QA-PG did not become ready in time");
    process.exit(1);
  }
  console.log(`QA-PG: ready on 127.0.0.1:${PORT} (create bunny_qa via prisma db execute)`);
}

function stop() {
  const r = pg("pg_ctl", ["-D", DATA_DIR, "stop", "-m", "fast"]);
  console.log(r.status === 0 ? "QA-PG: stopped" : "QA-PG: stop returned non-zero (maybe not running)");
}

async function status() {
  process.exit((await ready()) ? 0 : 1);
}

const cmd = process.argv[2] ?? "start";
if (cmd === "start") start();
else if (cmd === "stop") stop();
else if (cmd === "status") status();
else {
  console.error("unknown command:", cmd);
  process.exit(2);
}

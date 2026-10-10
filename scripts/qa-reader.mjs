import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { cp, mkdtemp, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { fileURLToPath, pathToFileURL } from "node:url";

// embedded-postgres uses Node's spawn internally but does not set windowsHide.
// Apply that option before importing it, and record only children of this runner.
const repo = process.cwd();
const runDir = await mkdtemp(path.join(tmpdir(), "bunny-reader-qa-"));
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
const { default: EmbeddedPostgres } = await import("embedded-postgres");
const { default: getBinaries } = await import(pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.resolve("embedded-postgres"))), "binary.js")).href);
const binaries = await getBinaries();
const dataDir = path.join(runDir, "postgres");
const logs = createWriteStream(path.join(runDir, "runner.log"));
const log = message => { console.log(message); logs.write(`${message}\n`); };
log(`Reader QA artifacts: ${runDir}`);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function freePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
const pgPort = await freePort();
const appPort = await freePort();
const name = `reader_qa_${randomBytes(8).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const databaseURL = `postgresql://reader_qa:${password}@127.0.0.1:${pgPort}/${name}`;
const baseURL = `http://127.0.0.1:${appPort}`;
const env = { ...process.env, DATABASE_URL: databaseURL, DIRECT_URL: databaseURL,
  NEXTAUTH_URL: baseURL, NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
  READER_QA_DATABASE_URL: databaseURL, READER_QA_DATABASE_NAME: name,
  READER_TEST_BASE_URL: baseURL, READER_QA_RUN_DIR: runDir, NEXT_TELEMETRY_DISABLED: "1",
  ACCOUNT_MAIL_MODE: "local", ACCOUNT_MAIL_LOCAL_DIR: path.join(runDir, "mailbox"), APP_ORIGIN: baseURL,
  HOSTNAME: "127.0.0.1", PORT: String(appPort), NODE_ENV: "production" };
const interruptController = new AbortController();
function start(command, args, label, cwd = repo) {
  const out = createWriteStream(path.join(runDir, `${label}.log`));
  const child = childProcess.spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  // Redact generated credentials even when a tool prints its datasource URL.
  const redact = chunk => out.write(chunk.toString().split(databaseURL).join("[isolated QA database]").split(password).join("[redacted]"));
  child.stdout.on("data", redact);
  child.stderr.on("data", redact);
  child.once("close", () => out.end());
  return child;
}
async function bounded(promise, ms, label, interruptible = true) {
  let timer;
  let onInterrupt;
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    if (interruptible) {
      onInterrupt = () => reject(new Error("Reader QA interrupted"));
      interruptController.signal.addEventListener("abort", onInterrupt, { once: true });
      if (interruptController.signal.aborted) onInterrupt();
    }
  })]); }
  finally { clearTimeout(timer); if (onInterrupt) interruptController.signal.removeEventListener("abort", onInterrupt); }
}
async function run(command, args, label, cwd) {
  const child = start(command, args, label, cwd);
  const [code] = await bounded(once(child, "exit"), label === "playwright" ? 1_200_000 : label === "build" ? 600_000 : 240_000, label);
  log(`${label}: exit ${code}`);
  if (code !== 0) throw new Error(`${label} failed; see ${label}.log`);
}
async function stopChild(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === "win32") {
    const killer = childProcess.spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    await bounded(once(killer, "exit"), 10_000, "taskkill", false);
  } else child.kill("SIGTERM");
  if (child.exitCode === null && child.signalCode === null) await bounded(once(child, "exit"), 10_000, "child shutdown", false);
  log(`Stopped owned PID ${child.pid}`);
}
const pgLog = createWriteStream(path.join(runDir, "postgres.log"));
const pg = new EmbeddedPostgres({ databaseDir: dataDir, port: pgPort, user: "reader_qa", password,
  persistent: true, initdbFlags: ["--encoding=UTF8", "--locale=C"], postgresFlags: ["-h", "127.0.0.1"],
  onLog: message => pgLog.write(`${message}\n`), onError: () => pgLog.write("PostgreSQL client error\n") });
let app;
let interrupted = false;
const interrupt = () => { interrupted = true; interruptController.abort(); };
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);
try {
  await bounded(pg.initialise(), 60_000, "initdb");
  await bounded(pg.start(), 60_000, "PostgreSQL start");
  const client = pg.getPgClient("postgres", "127.0.0.1");
  try { await client.connect(); await client.query(`CREATE DATABASE "${name}" ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`); }
  finally { await client.end(); }
  log(`Fresh loopback QA database ${name} created`);
  const prisma = path.join(repo, "node_modules/prisma/build/index.js");
  await run(process.execPath, [prisma, "generate", "--schema", path.join(repo, "prisma/schema.prisma")], "generate", runDir);
  await run(process.execPath, [prisma, "migrate", "deploy", "--schema", path.join(repo, "prisma/schema.prisma")], "migrate", runDir);
  // Temporary cwd prevents Bun's automatic project dotenv lookup.
  await run("bun", [path.join(repo, "prisma/seed.ts")], "demo-seed", runDir);
  await run(process.execPath, [path.join(repo, "tests/reader/seed.mjs")], "reader-seed", runDir);
  const actionTests = path.join(repo, "tests/team-access");
  const hasActionTests = await stat(actionTests).then(() => true, () => false);
  if (process.argv.includes("--actions-only") && !hasActionTests) throw new Error("Team action tests missing");
  if (hasActionTests) {
    await run("bun", ["test", `--tsconfig-override=${path.join(repo, "tsconfig.json")}`, `--preload=${path.join(actionTests, "session-fixture.ts")}`, actionTests], "team-access", runDir);
  }
  if (!process.argv.includes("--actions-only")) {
  await run(process.execPath, [path.join(repo, "node_modules/next/dist/bin/next"), "build", "--webpack"], "build");
  const files = JSON.parse(await readFile(path.join(repo, ".next/required-server-files.json"), "utf8"));
  const standaloneRoot = path.join(repo, ".next/standalone");
  const standaloneApp = path.resolve(standaloneRoot, files.relativeAppDir);
  const relativeApp = path.relative(standaloneRoot, standaloneApp);
  if (relativeApp.startsWith("..") || path.isAbsolute(relativeApp)) throw new Error("Standalone app escaped generated output");
  const server = path.join(standaloneApp, "server.js");
  if (!(await stat(server)).isFile()) throw new Error("Standalone server missing");
  await cp(path.join(repo, ".next/static"), path.join(standaloneApp, ".next/static"), { recursive: true });
  await cp(path.join(repo, "public"), path.join(standaloneApp, "public"), { recursive: true });
  log(`Starting generated standalone server: ${path.relative(repo, server)}`);
  app = start(process.execPath, [server], "next", standaloneApp);
  await bounded((async () => {
    while (!interrupted && app.exitCode === null && app.signalCode === null) {
      try { if ((await fetch(`${baseURL}/login`, { signal: AbortSignal.timeout(5000) })).ok) return; } catch {}
      await delay(500);
    }
    throw new Error("Next exited before readiness");
  })(), 300_000, "Next readiness");
  // Check the actual production routes before starting browser assertions.
  for (const route of ["/api/auth/session", "/", ...["manga", "webtoon", "novel"].map(format => `/read/${format}/qa-reader-${format}/1`)]) {
    const response = await bounded(fetch(`${baseURL}${route}`, { signal: AbortSignal.timeout(120_000) }), 125_000, `Warmup ${route}`);
    if (!response.ok) throw new Error(`Warmup failed for ${route}: ${response.status}`);
    await response.arrayBuffer();
  }
  await run(process.execPath, [path.join(repo, "node_modules/@playwright/test/cli.js"), "test", "--config", path.join(repo, "playwright.reader.config.ts"), ...process.argv.slice(2)], "playwright");
  }
} catch (error) {
  log(error.message);
  process.exitCode = 1;
} finally {
  await stopChild(app).catch(error => { log(error.message); process.exitCode = 1; });
  // Graceful shutdown is necessary on Windows PG 18: force-killing the
  // postmaster can leave IO workers holding its listening socket open.
  if (pg.process && pg.process.exitCode === null) {
    const stop = start(binaries.pg_ctl, ["-D", dataDir, "stop", "-m", "fast", "-w", "-t", "30"], "postgres-stop", runDir);
    const [code] = await bounded(once(stop, "exit"), 35_000, "PostgreSQL shutdown", false).catch(() => [1]);
    if (code !== 0) { log("Graceful PostgreSQL shutdown failed"); process.exitCode = 1; await stopChild(pg.process); }
    else log("Owned PostgreSQL cluster stopped gracefully");
    pg.process = undefined;
  }
  for (const child of [...children]) await stopChild(child).catch(error => { log(error.message); process.exitCode = 1; });
  const closedPorts = await Promise.all([pgPort, appPort].map(port => new Promise(resolve => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
  })));
  const root = await realpath(runDir);
  const temp = await realpath(tmpdir());
  log(`Cleanup checks: children=${children.size}; PostgreSQL port closed=${closedPorts[0]}; Next port closed=${closedPorts[1]}`);
  if (path.dirname(root) !== temp || !path.basename(root).startsWith("bunny-reader-qa-") || path.resolve(dataDir) !== path.join(root, "postgres") || children.size || closedPorts.some(closed => !closed)) {
    log("Cleanup guard failed; data retained"); process.exitCode = 1;
  } else {
    await rm(dataDir, { recursive: true, force: true });
    log("Cleanup verified: owned children stopped; temporary PostgreSQL data removed; logs retained");
    await writeFile(path.join(runDir, "cleanup.json"), JSON.stringify({ database: name, remainingChildren: children.size, dataRemoved: true, portsClosed: closedPorts.every(Boolean), pgPort, appPort }, null, 2));
  }
  await Promise.all([new Promise(resolve => pgLog.end(resolve)), new Promise(resolve => logs.end(resolve))]);
  // embedded-postgres's exit hook otherwise replaces process.exitCode with zero.
  process.exit(process.exitCode || 0);
}

import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import nextEnv from "@next/env";

// Keep every Windows helper hidden, including embedded-postgres's own children.
const originalSpawn = childProcess.spawn;
childProcess.spawn = (command, args, options = {}) => originalSpawn(command, args, { ...options, windowsHide: true });
syncBuiltinESMExports();
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(repo);
// Preserve the old dev command's protection against stale ambient DB values.
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;
nextEnv.loadEnvConfig(repo, true);
const local = process.argv.includes("--local") || !/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");
const stateDir = path.join(repo, ".local-preview");
const dataDir = path.join(stateDir, "postgres");
let pg, app, binaries, stopping = false;
const children = new Set();

async function freePort(port = 0) {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const result = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return result;
}

function spawn(command, args, cwd = repo) {
  const child = childProcess.spawn(command, args, { cwd, env: process.env, stdio: "inherit", windowsHide: true });
  children.add(child);
  child.once("exit", () => children.delete(child));
  return child;
}
async function run(command, args, cwd) {
  const child = spawn(command, args, cwd);
  const [code] = await Promise.race([once(child, "exit"), once(child, "error").then(([error]) => { throw error; })]);
  if (code !== 0) throw new Error(`Local setup command failed (${code}).`);
}
async function stopChild(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  if (process.platform === "win32") {
    const killer = childProcess.spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    await once(killer, "exit");
  } else child.kill("SIGTERM");
  await exited;
}
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of [...children]) await stopChild(child);
  if (pg?.process?.exitCode === null) {
    const stop = childProcess.spawn(binaries.pg_ctl, ["-D", dataDir, "stop", "-m", "fast", "-w", "-t", "10"], { stdio: "ignore", windowsHide: true });
    const [result] = await once(stop, "exit");
    if (result !== 0) { await stopChild(pg.process); code = 1; }
    pg.process = undefined;
  }
  process.exit(code);
}
process.once("SIGINT", () => { void shutdown(); });
process.once("SIGTERM", () => { void shutdown(); });

try {
  await freePort(3000).catch(() => { throw new Error("Port 3000 is already in use. Stop the previous dev server, then run bun run dev again."); });
  if (local) {
    console.log("Bunny Library: starting the saved local preview database. First setup may take a minute.");
    await mkdir(stateDir, { recursive: true });
    const configPath = path.join(stateDir, "config.json");
    let config;
    if (existsSync(configPath)) config = JSON.parse(await readFile(configPath, "utf8"));
    else {
      config = { password: randomBytes(24).toString("hex"), secret: randomBytes(32).toString("hex") };
      await writeFile(configPath, JSON.stringify(config), { mode: 0o600 });
    }
    if (!/^[a-f0-9]{48}$/.test(config.password) || !/^[a-f0-9]{64}$/.test(config.secret)) throw new Error("Invalid local-preview configuration; existing data has been preserved.");
    const port = await freePort();
    const { default: EmbeddedPostgres } = await import("embedded-postgres");
    const { default: getBinaries } = await import(pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.resolve("embedded-postgres"))), "binary.js")).href);
    binaries = await getBinaries();
    pg = new EmbeddedPostgres({ databaseDir: dataDir, port, user: "bunny_preview", password: config.password,
      persistent: true, initdbFlags: ["--encoding=UTF8", "--locale=C"], postgresFlags: ["-h", "127.0.0.1"],
      onLog: () => {}, onError: () => {} });
    if (!existsSync(path.join(dataDir, "PG_VERSION"))) await pg.initialise();
    await pg.start();
    const client = pg.getPgClient("postgres", "127.0.0.1");
    try {
      await client.connect();
      const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", ["bunny_local_preview"]);
      if (!rowCount) await client.query('CREATE DATABASE "bunny_local_preview" ENCODING \'UTF8\' TEMPLATE template0 LC_COLLATE \'C\' LC_CTYPE \'C\'');
    } finally { await client.end(); }
    const url = `postgresql://bunny_preview:${config.password}@127.0.0.1:${port}/bunny_local_preview`;
    process.env.DATABASE_URL = url;
    process.env.DIRECT_URL = url;
    process.env.NEXTAUTH_SECRET = config.secret;
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NODE_ENV = "development";
    // This branch creates its own loopback URL; configured external databases never reach setup commands.
    const prisma = path.join(repo, "node_modules/prisma/build/index.js");
    console.log("Bunny Library: preparing the local database schema...");
    await run(process.execPath, [prisma, "generate", "--schema", path.join(repo, "prisma/schema.prisma")], stateDir);
    await run(process.execPath, [prisma, "migrate", "deploy", "--schema", path.join(repo, "prisma/schema.prisma")], stateDir);
    if (!existsSync(path.join(stateDir, "seeded"))) {
      console.log("Bunny Library: loading demo works and accounts...");
      await run("bun", [path.join(repo, "prisma/seed.ts")], stateDir);
      await writeFile(path.join(stateDir, "seeded"), "Demo content initialized.\n");
    }
  }
  console.log(`Bunny Library: http://localhost:3000 (${local ? "local demo data" : "configured database"})`);
  app = spawn(process.execPath, [path.join(repo, "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", "3000", "-H", "127.0.0.1"]);
  app.once("error", () => { console.error("Unable to start Next.js."); void shutdown(1); });
  const [code] = await once(app, "exit");
  await shutdown(code ?? 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to initialize the local preview database. Existing data has been preserved.");
  await shutdown(1);
}

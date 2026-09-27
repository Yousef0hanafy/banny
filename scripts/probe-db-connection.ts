/**
 * probe-db-connection.ts — READ-ONLY connectivity probe for a stored connection
 * string. Runs `SELECT 1` and counts public tables. Never creates, alters, or
 * migrates anything. Never prints the URL or any credential — only shape
 * booleans and OK/FAIL. Error messages are withheld (only error name/code).
 * Run: bun scripts/probe-db-connection.ts   (bun auto-loads .env.local)
 */
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL: missing (nothing probed)");
  process.exit(1);
}

const pooled = /-pooler\./.test(url);
const tls = /sslmode=require/.test(url);
const channelBinding = /channel_binding=require/.test(url);
console.log(`url-shape: pooled=${pooled} sslmode-required=${tls} channel-binding=${channelBinding}`);

const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });

try {
  const ok = await prisma.$queryRawUnsafe<{ ok: number }[]>("select 1 as ok");
  console.log(`connectivity: ${ok[0]?.ok === 1 ? "OK" : "UNEXPECTED-RESULT"}`);
  const tables = await prisma.$queryRawUnsafe<{ n: number }[]>(
    "select count(*)::int as n from information_schema.tables where table_schema='public'"
  );
  console.log(`public tables currently present: ${tables[0]?.n}`);
  const version = await prisma.$queryRawUnsafe<{ v: string }[]>("select current_setting('server_version') as v");
  console.log(`postgres server_version: ${version[0]?.v}`);
} catch (e) {
  const name = e instanceof Error ? e.name : typeof e;
  const code = (e as { code?: string }).code ?? "";
  console.log(`connectivity: FAILED (name=${name}${code ? ` code=${code}` : ""}) — message withheld for safety`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

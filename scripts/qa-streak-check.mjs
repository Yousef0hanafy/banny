/**
 * QA probe (Release D): verify reader streak inputs on the local QA Postgres.
 * Uses the project's own Prisma client — run from the project root:
 *   DATABASE_URL=... DIRECT_URL=... bun scripts/qa-streak-check.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const reader = await db.profile.findUnique({ where: { email: "reader@bunny.demo" } });
if (!reader) {
  console.error("reader@bunny.demo not found");
  process.exit(1);
}
const since = new Date(Date.now() - 14 * 86400000);
const evs = await db.analyticsEvent.findMany({
  where: {
    profileId: reader.id,
    type: { in: ["read_start", "read_page", "read_complete"] },
    createdAt: { gte: since },
  },
  select: { createdAt: true },
});
const days = new Set(evs.map((e) => e.createdAt.toISOString().slice(0, 10)));
const prog = await db.readingProgress.findMany({
  where: { profileId: reader.id },
  select: { completed: true, percent: true, updatedAt: true },
});
console.log("reader event-days (14d):", [...days].sort().join(","));
console.log(
  "completed chapters:",
  prog.filter((p) => p.completed).length,
  "| in-progress:",
  prog.filter((p) => !p.completed).length
);
const future = evs.filter((e) => e.createdAt > new Date()).length;
console.log("future-dated events (must be 0):", future);
await db.$disconnect();

import { test, expect, afterAll } from "bun:test";
import { db, actions, setActor } from "./session-fixture";

afterAll(async () => { await db.$disconnect(); });
test("unassigned editor cannot create a chapter through the actual server action", async () => {
  const editor = await db.profile.findUniqueOrThrow({ where: { email: "editor@bunny.demo" } });
  const series = await db.series.findUniqueOrThrow({ where: { slug: "qa-reader-novel" } });
  setActor(editor.id);
  const before = await db.chapter.count({ where: { seriesId: series.id } });
  const result = await actions.createChapter({
    seriesId: series.id, number: 449900, titleAr: "اختبار منع الوصول", workflow: "review",
    isPremiumDemo: false, readingDirection: "rtl", pageCount: 1, novelBody: "نص خاص للاختبار",
  });
  expect(result).toEqual({ ok: false, error: "forbidden" });
  expect(await db.chapter.count({ where: { seriesId: series.id } })).toBe(before);
});

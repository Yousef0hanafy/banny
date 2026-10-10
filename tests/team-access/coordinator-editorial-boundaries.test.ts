import { afterAll, beforeAll, expect, test } from "bun:test";
import { actions, db, setActor } from "./session-fixture";

let chapterId: string;
let seriesId: string;
let adminId: string;

beforeAll(async () => {
  adminId = (await db.profile.findUniqueOrThrow({ where: { email: "admin@bunny.demo" } })).id;
  const series = await db.series.create({ data: {
    slug: "coordinator-editorial-boundary", titleAr: "حدود النشر", synopsisAr: "اختبار معزول",
    format: "novel", author: "اختبار", coverPath: "",
  } });
  seriesId = series.id;
  const chapter = await db.chapter.create({ data: {
    seriesId, number: 1, titleAr: "النسخة المتاحة", novelBody: "نص منشور يجب الحفاظ عليه.",
    workflow: "published", publishedAt: new Date(),
  } });
  chapterId = chapter.id;
});

afterAll(async () => {
  setActor(null);
  if (seriesId) await db.series.delete({ where: { id: seriesId } });
});

test("administrator cannot create a published chapter through the legacy action", async () => {
  setActor(adminId);
  const result = await actions.createChapter({ seriesId, number: 2, titleAr: "تجاوز الاعتماد",
    workflow: "published", isPremiumDemo: false, readingDirection: "rtl", pageCount: 1,
    novelBody: "نص لم يمر بالاعتماد.",
  });
  expect(result.ok).toBe(false);
  expect(await db.chapter.count({ where: { seriesId, number: 2 } })).toBe(0);
});

test("legacy metadata editing cannot replace the current published version", async () => {
  setActor(adminId);
  const result = await actions.updateChapterMeta({ id: chapterId, titleAr: "تعديل غير معتمد" });
  expect(result.ok).toBe(false);
  const chapter = await db.chapter.findUniqueOrThrow({ where: { id: chapterId } });
  expect(chapter.titleAr).toBe("النسخة المتاحة");
  expect(chapter.novelBody).toBe("نص منشور يجب الحفاظ عليه.");
});

test("bulk legacy changes cannot unpublish content without an audited withdrawal", async () => {
  setActor(adminId);
  const result = await actions.setWorkflowBulk([chapterId], "draft");
  expect(result.ok).toBe(false);
  expect((await db.chapter.findUniqueOrThrow({ where: { id: chapterId } })).workflow).toBe("published");
});

test("legacy scheduling cannot change visibility of the published version", async () => {
  setActor(adminId);
  const result = await actions.updateChapterMeta({ id: chapterId, scheduledFor: new Date(Date.now() + 86400000).toISOString() });
  expect(result.ok).toBe(false);
  const chapter = await db.chapter.findUniqueOrThrow({ where: { id: chapterId } });
  expect(chapter.workflow).toBe("published");
  expect(chapter.scheduledFor).toBeNull();
});

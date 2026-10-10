import { PrismaClient } from "@prisma/client";
import { isolatedDatabaseURL } from "./qa-env.mjs";

const db = new PrismaClient({ datasources: { db: { url: isolatedDatabaseURL() } } });
try {
  for (const format of ["manga", "webtoon", "novel"]) {
    const series = await db.series.create({ data: {
      slug: `qa-reader-${format}`, titleAr: `اختبار القارئ ${format}`, synopsisAr: "محتوى اختبار محلي", format,
      author: "فريق الاختبار", coverPath: "/art/covers/warden-of-the-twilight-gate.webp",
    } });
    for (const number of [1, 2, 3, 4, 8, 10]) {
      const chapter = await db.chapter.create({ data: {
        seriesId: series.id, number, titleAr: `رحلة الاختبار ${number}`,
        workflow: number === 4 ? "draft" : "published", publishedAt: new Date(Date.now() - number * 60000),
        scheduledFor: number === 3 ? new Date(Date.now() + 86400000) : null,
        isPremiumDemo: number === 8,
        novelBody: format === "novel" && number !== 10 ? Array.from({ length: 65 }, (_, i) => `فقرة ${i + 1}. ${"على أطراف المدينة وقف الحارس يتأمل الضوء والذكريات في رحلة طويلة نحو المكتبة. ".repeat(5)}`).join("\n\n") : null,
      } });
      if (format !== "novel" && number !== 10) {
        await db.chapterPage.createMany({ data: Array.from({ length: 5 }, (_, i) => ({
          chapterId: chapter.id, pageIndex: i, imagePath: `/art/pages/warden-of-the-twilight-gate/c1/p${String(i + 1).padStart(2, "0")}.webp`, width: 800, height: 1200,
        })) });
      }
    }
  }
  const other = await db.series.create({ data: { slug: "qa-reader-other", titleAr: "عمل آخر", synopsisAr: "اختبار", author: "اختبار", format: "manga", coverPath: "" } });
  await db.chapter.createMany({ data: [1, 2, 7].map(number => ({ seriesId: other.id, number, titleAr: "فصل من عمل آخر", workflow: "published", publishedAt: new Date(Date.now() - 30 * 86400000) })) });
} finally { await db.$disconnect(); }

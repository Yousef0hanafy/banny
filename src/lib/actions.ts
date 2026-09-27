"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { currentProfileOrNull } from "@/lib/queries";
import { revalidatePath } from "next/cache";
import { isWorkflow, type Workflow } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Reading progress (authenticated readers; guests mirror locally)     */
/* ------------------------------------------------------------------ */

const progressSchema = z.object({
  seriesSlug: z.string().min(1),
  chapterNumber: z.number().int().min(1),
  pageIndex: z.number().int().min(0),
  percent: z.number().min(0).max(100),
  completed: z.boolean(),
});

export type ActionResult = { ok: boolean; error?: string };

export async function saveReadingProgress(input: unknown): Promise<ActionResult> {
  const profile = await currentProfileOrNull();
  if (!profile) return { ok: false, error: "unauthenticated" };
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { seriesSlug, chapterNumber, pageIndex, percent, completed } = parsed.data;

  const series = await db.series.findUnique({ where: { slug: seriesSlug } });
  if (!series) return { ok: false, error: "not_found" };
  const chapter = await db.chapter.findFirst({
    where: { seriesId: series.id, number: chapterNumber, workflow: "published" },
  });
  if (!chapter) return { ok: false, error: "not_found" };

  const existing = await db.readingProgress.findUnique({
    where: { profileId_chapterId: { profileId: profile.id, chapterId: chapter.id } },
  });

  await db.readingProgress.upsert({
    where: { profileId_chapterId: { profileId: profile.id, chapterId: chapter.id } },
    update: { pageIndex, percent, completed, seriesId: series.id },
    create: {
      profileId: profile.id,
      seriesId: series.id,
      chapterId: chapter.id,
      pageIndex,
      percent,
      completed,
    },
  });

  if (!existing) {
    await db.analyticsEvent.create({
      data: { type: "read_start", seriesId: series.id, chapterId: chapter.id, profileId: profile.id },
    });
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Admin: series + chapters (role enforced here, again)                */
/* ------------------------------------------------------------------ */

async function requireEditor() {
  const profile = await currentProfileOrNull();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    throw new Error("FORBIDDEN");
  }
  return profile;
}

const seriesSchema = z.object({
  id: z.string().optional(),
  titleAr: z.string().min(2, "العنوان مطلوب"),
  titleOriginal: z.string().optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "المعرّف: أحرف لاتينية صغيرة وأرقام وشرطات فقط"),
  synopsisAr: z.string().min(20, "الملخص قصير جدًا (٢٠ حرفًا على الأقل)"),
  format: z.enum(["manga", "webtoon"]),
  status: z.enum(["ongoing", "completed", "hiatus"]),
  author: z.string().min(2, "المؤلف مطلوب"),
  translator: z.string().optional(),
  genres: z.array(z.string()).min(1, "اختر نوعًا واحدًا على الأقل"),
  isFeatured: z.boolean(),
});

export async function upsertSeries(input: unknown): Promise<ActionResult & { slug?: string }> {
  try {
    await requireEditor();
  } catch {
    return { ok: false, error: "forbidden" };
  }
  const parsed = seriesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  }
  const d = parsed.data;
  const data = {
    titleAr: d.titleAr,
    titleOriginal: d.titleOriginal || null,
    slug: d.slug,
    synopsisAr: d.synopsisAr,
    format: d.format,
    status: d.status,
    author: d.author,
    translator: d.translator || null,
    genresJson: JSON.stringify(d.genres),
    isFeatured: d.isFeatured,
  };

  if (d.id) {
    const existing = await db.series.findUnique({ where: { id: d.id } });
    if (!existing) return { ok: false, error: "not_found" };
    await db.series.update({ where: { id: d.id }, data });
    revalidatePath("/admin/series");
    revalidatePath(`/series/${d.slug}`);
    revalidatePath("/");
    return { ok: true, slug: d.slug };
  }

  const accentPalette = ["#9B7BFF", "#5FCB9B", "#E56B6F", "#DDBB77", "#7FA8C9", "#C98BD9"];
  const created = await db.series.create({
    data: {
      ...data,
      accent: accentPalette[Math.floor(Math.random() * accentPalette.length)],
      coverPath: "", // placeholder until cover art is uploaded (Release B upload flow)
    },
  });
  revalidatePath("/admin/series");
  revalidatePath("/");
  return { ok: true, slug: created.slug };
}

const chapterMetaSchema = z.object({
  id: z.string(),
  titleAr: z.string().min(2).optional(),
  workflow: z.enum(["draft", "review", "published"]).optional(),
  isPremiumDemo: z.boolean().optional(),
  readingDirection: z.enum(["rtl", "ltr"]).optional(),
});

export async function updateChapterMeta(input: unknown): Promise<ActionResult> {
  try {
    await requireEditor();
  } catch {
    return { ok: false, error: "forbidden" };
  }
  const parsed = chapterMetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { id, ...patch } = parsed.data;

  const chapter = await db.chapter.findUnique({ where: { id }, include: { series: true } });
  if (!chapter) return { ok: false, error: "not_found" };

  const data: Record<string, unknown> = { ...patch };
  if (patch.workflow === "published" && chapter.workflow !== "published" && !chapter.publishedAt) {
    data.publishedAt = new Date();
  }
  if (patch.workflow && patch.workflow !== "published") {
    data.publishedAt = null;
  }
  await db.chapter.update({ where: { id }, data });

  const wasPublished = chapter.workflow === "published";
  const nowPublished = (patch.workflow ?? chapter.workflow) === "published";
  if (!wasPublished && nowPublished) {
    await db.analyticsEvent.create({
      data: {
        type: "publish",
        seriesId: chapter.seriesId,
        chapterId: chapter.id,
        metaJson: JSON.stringify({ number: chapter.number }),
      },
    });
  }

  revalidatePath("/admin/chapters");
  revalidatePath(`/admin/series/${chapter.seriesId}`);
  revalidatePath(`/series/${chapter.series.slug}`);
  revalidatePath("/explore");
  revalidatePath("/");
  return { ok: true };
}

const createChapterSchema = z.object({
  seriesId: z.string(),
  number: z.number().int().min(1),
  titleAr: z.string().min(2, "عنوان الفصل مطلوب"),
  workflow: z.enum(["draft", "review", "published"]),
  isPremiumDemo: z.boolean(),
  readingDirection: z.enum(["rtl", "ltr"]),
  pageCount: z.number().int().min(1).max(30),
});

export async function createChapter(input: unknown): Promise<ActionResult & { id?: string }> {
  try {
    await requireEditor();
  } catch {
    return { ok: false, error: "forbidden" };
  }
  const parsed = createChapterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  }
  const d = parsed.data;
  const series = await db.series.findUnique({ where: { id: d.seriesId } });
  if (!series) return { ok: false, error: "not_found" };

  const exists = await db.chapter.findUnique({
    where: { seriesId_number: { seriesId: series.id, number: d.number } },
  });
  if (exists) return { ok: false, error: "رقم الفصل مستخدم في هذا العمل" };

  const chapter = await db.chapter.create({
    data: {
      seriesId: series.id,
      number: d.number,
      titleAr: d.titleAr,
      workflow: d.workflow,
      publishedAt: d.workflow === "published" ? new Date() : null,
      isPremiumDemo: d.isPremiumDemo,
      readingDirection: d.readingDirection,
    },
  });

  // Placeholder abstract pages (deterministic per chapter) — real uploads land in Release B.
  const isManga = series.format === "manga";
  const baseDir = isManga ? `/art/pages/${series.slug}/c${d.number}` : `/art/panels/${series.slug}/c${d.number}`;
  const sourceDir = isManga ? `/art/pages/${series.slug}` : `/art/panels/${series.slug}`;
  const fs = await import("fs/promises");
  let template = "";
  try {
    const dirs = await fs.readdir(`public${sourceDir}`);
    const templateChapter = dirs.filter((x) => x.startsWith("c")).sort()[0];
    if (templateChapter) template = `public${sourceDir}/${templateChapter}`;
  } catch {}

  const height = isManga ? 1200 : 1100;
  for (let p = 0; p < d.pageCount; p++) {
    let imagePath = `${baseDir}/p${String(p + 1).padStart(2, "0")}.webp`;
    try {
      await fs.access(`public${imagePath}`);
    } catch {
      // copy from an existing template chapter so the reader has real abstract art
      const files = template ? await fs.readdir(template).catch(() => []) : [];
      if (files.length) {
        const src = `${template}/p${String((p % files.length) + 1).padStart(2, "0")}.webp`;
        const dest = `public${imagePath}`;
        await fs.mkdir(`public${baseDir}`, { recursive: true });
        await fs.copyFile(src, dest).catch(() => {});
      }
      try {
        await fs.access(`public${imagePath}`);
      } catch {
        imagePath = `/art/covers/${series.slug}.webp`; // ultimate fallback: cover
      }
    }
    await db.chapterPage.create({
      data: { chapterId: chapter.id, pageIndex: p, imagePath, width: 800, height },
    });
  }

  revalidatePath("/admin/chapters");
  revalidatePath(`/admin/series/${series.id}`);
  revalidatePath(`/series/${series.slug}`);
  return { ok: true, id: chapter.id };
}

export async function setWorkflowBulk(ids: string[], workflow: Workflow): Promise<ActionResult> {
  try {
    await requireEditor();
  } catch {
    return { ok: false, error: "forbidden" };
  }
  if (!isWorkflow(workflow)) return { ok: false, error: "invalid" };
  for (const id of ids) {
    const chapter = await db.chapter.findUnique({ where: { id }, include: { series: true } });
    if (!chapter) continue;
    await db.chapter.update({
      where: { id },
      data: { workflow, publishedAt: workflow === "published" ? (chapter.publishedAt ?? new Date()) : null },
    });
  }
  revalidatePath("/admin/chapters");
  revalidatePath("/");
  return { ok: true };
}

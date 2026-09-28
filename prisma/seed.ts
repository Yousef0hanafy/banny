/**
 * Bunny Library — idempotent seed (Release A) → Neon PostgreSQL.
 * Run: bun run db:seed   (or: bun prisma/seed.ts — bun loads .env.local automatically)
 * Upserts by slug/email so re-running is always safe (docs/DECISIONS.md D-21).
 * Analytics events are seeded only into an empty table (guarded below), so running
 * the seed twice produces identical row counts.
 */
import { PrismaClient, Prisma, UserRole, SeriesFormat, SeriesStatus, ChapterWorkflow, ReadingDirection, LibraryShelf, CommentStatus } from "@prisma/client";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { SERIES, COLLECTIONS, DEMO_ACCOUNTS, DEMO_PROGRESS, hashSeed, mulberry32 } from "../scripts/release-a-data.mjs";
import { SERIES_B, COMMENTS, RATINGS, REPORTS, LIBRARY_SEED } from "../scripts/release-b-data.mjs";

const ALL_SERIES = [...SERIES, ...SERIES_B];

const db = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

const daysAgo = (n, hourJitter = true) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  if (hourJitter) d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return d;
};

async function seedProfiles() {
  for (const acc of DEMO_ACCOUNTS) {
    await db.profile.upsert({
      where: { email: acc.email },
      update: { nickname: acc.nickname, role: acc.role as UserRole },
      create: {
        email: acc.email,
        nickname: acc.nickname,
        role: acc.role as UserRole,
        passwordHash: hashPassword(acc.password),
        avatarSeed: `seed-${hashSeed(acc.email) % 6}`,
        bio: "حساب تجريبي ضمن النسخة التجريبية من مكتبة باني.",
      },
    });
  }
}

async function seedSeries() {
  for (const [i, s] of ALL_SERIES.entries()) {
    const data = {
      slug: s.slug,
      titleAr: s.titleAr,
      titleOriginal: s.titleOriginal,
      synopsisAr: s.synopsisAr,
      format: s.format as SeriesFormat,
      status: s.status as SeriesStatus,
      genresJson: JSON.stringify(s.genres),
      tagsJson: JSON.stringify(s.tags),
      author: s.author,
      translator: s.translator,
      coverPath: `/art/covers/${s.slug}.webp`,
      accent: s.accent,
      isFeatured: s.isFeatured,
      ratingAvg: s.ratingAvg,
      ratingCount: s.ratingCount,
      displayOrder: i,
      reads: s.reads,
    };
    const series = await db.series.upsert({ where: { slug: s.slug }, update: data, create: data });

    let publishedAt = 40 - i * 3;
    for (const ch of s.chapters) {
      const isPublished = ch.workflow === "published";
      const chData = {
        seriesId: series.id,
        number: ch.number,
        titleAr: ch.titleAr,
        workflow: ch.workflow as ChapterWorkflow,
        publishedAt: isPublished ? daysAgo(Math.max(publishedAt, 1)) : null,
        isPremiumDemo: Boolean(ch.isPremiumDemo),
        readingDirection: (s.format === "manga" ? "rtl" : "rtl") as ReadingDirection,
        novelBody: s.format === "novel" ? (ch.novelBody ?? null) : null,
        scheduledFor:
          ch.scheduledFor && isPublished
            ? (() => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(18, 30, 0, 0); return d; })()
            : null,
      };
      const chapter = await db.chapter.upsert({
        where: { seriesId_number: { seriesId: series.id, number: ch.number } },
        update: chData,
        create: chData,
      });
      if (isPublished) publishedAt -= 4;

      const count = ch.pages ?? ch.panels ?? 0;
      const baseDir = s.format === "manga" ? `/art/pages/${s.slug}/c${ch.number}` : `/art/panels/${s.slug}/c${ch.number}`;
      const width = 800;
      const height = s.format === "manga" ? 1200 : 1100;
      for (let p = 0; p < count; p++) {
        const pageData = {
          chapterId: chapter.id,
          pageIndex: p,
          imagePath: `${baseDir}/p${String(p + 1).padStart(2, "0")}.webp`,
          width,
          height,
        };
        await db.chapterPage.upsert({
          where: { chapterId_pageIndex: { chapterId: chapter.id, pageIndex: p } },
          update: pageData,
          create: pageData,
        });
      }
    }
  }
}

async function seedCollections() {
  for (const c of COLLECTIONS) {
    await db.editorialCollection.upsert({
      where: { slug: c.slug },
      update: {
        titleAr: c.titleAr,
        descriptionAr: c.descriptionAr,
        theme: c.theme,
        displayOrder: c.displayOrder,
        isFeatured: c.isFeatured,
        seriesSlugsJson: JSON.stringify(c.seriesSlugs),
      },
      create: {
        slug: c.slug,
        titleAr: c.titleAr,
        descriptionAr: c.descriptionAr,
        theme: c.theme,
        displayOrder: c.displayOrder,
        isFeatured: c.isFeatured,
        seriesSlugsJson: JSON.stringify(c.seriesSlugs),
      },
    });
  }
}

async function seedProgress() {
  const reader = await db.profile.findUnique({ where: { email: "reader@bunny.demo" } });
  if (!reader) return;
  for (const p of DEMO_PROGRESS) {
    const series = await db.series.findUnique({ where: { slug: p.seriesSlug } });
    if (!series) continue;
    const chapter = await db.chapter.findUnique({
      where: { seriesId_number: { seriesId: series.id, number: p.chapterNumber } },
    });
    if (!chapter) continue;
    const pages = await db.chapterPage.count({ where: { chapterId: chapter.id } });
    if (!pages) continue;
    await db.readingProgress.upsert({
      where: { profileId_chapterId: { profileId: reader.id, chapterId: chapter.id } },
      update: { pageIndex: p.pageIndex, percent: p.percent, completed: false },
      create: {
        profileId: reader.id,
        seriesId: series.id,
        chapterId: chapter.id,
        pageIndex: p.pageIndex,
        percent: p.percent,
        completed: false,
      },
    });
  }
}

async function seedAnalytics() {
  const existing = await db.analyticsEvent.count();
  if (existing > 0) return; // strictly idempotent: never duplicate demo analytics
  const series = await db.series.findMany();
  const reader = await db.profile.findUnique({ where: { email: "reader@bunny.demo" } });
  const rng = mulberry32(hashSeed("analytics"));
  const events: Prisma.AnalyticsEventCreateManyInput[] = [];
  for (let d = 30; d >= 0; d--) {
    const daily = 6 + Math.floor(rng() * 10);
    const types = ["read_start", "read_page", "read_page", "read_page", "read_complete"] as const;
    for (let k = 0; k < daily; k++) {
      const s = series[Math.floor(rng() * series.length)];
      const type: (typeof types)[number] = types[Math.floor(rng() * types.length)];
      events.push({
        type,
        seriesId: s.id,
        profileId: rng() > 0.6 && reader ? reader.id : null,
        metaJson: "{}",
        createdAt: daysAgo(d, false),
      });
    }
  }
  await db.analyticsEvent.createMany({ data: events });
}

async function seedCommunity() {
  const profiles = await db.profile.findMany({ select: { id: true, email: true } });
  const byEmail = new Map(profiles.map((p) => [p.email, p.id]));
  const seriesRows = await db.series.findMany({ select: { id: true, slug: true } });
  const seriesBySlug = new Map(seriesRows.map((s) => [s.slug, s.id]));

  /* Ratings — idempotent via (profileId, seriesId) unique */
  for (const r of RATINGS) {
    const seriesId = seriesBySlug.get(r.seriesSlug);
    if (!seriesId) continue;
    for (const [email, value] of Object.entries(r.ratings)) {
      const profileId = byEmail.get(email);
      if (!profileId) continue;
      await db.rating.upsert({
        where: { profileId_seriesId: { profileId, seriesId } },
        update: { value },
        create: { profileId, seriesId, value },
      });
    }
    const agg = await db.rating.aggregate({ where: { seriesId }, _avg: { value: true }, _count: { _all: true } });
    if ((agg._count._all ?? 0) > 0 && (agg._avg.value ?? 0) > 0) {
      await db.series.update({
        where: { id: seriesId },
        data: {
          ratingAvg: Math.round((agg._avg.value ?? 0) * 10) / 10,
          ratingCount: agg._count._all,
        },
      });
    }
  }

  /* Library shelves — idempotent via (profileId, seriesId) unique */
  const readerId = byEmail.get("reader@bunny.demo");
  for (const item of LIBRARY_SEED) {
    if (!readerId) break;
    const seriesId = seriesBySlug.get(item.seriesSlug);
    if (!seriesId) continue;
    await db.libraryItem.upsert({
      where: { profileId_seriesId: { profileId: readerId, seriesId } },
      update: { shelf: item.shelf as LibraryShelf },
      create: { profileId: readerId, seriesId, shelf: item.shelf as LibraryShelf },
    });
  }

  /* Comments — guarded: only into an empty table (no natural key) */
  if ((await db.comment.count()) === 0) {
    const createdIds: { id: string; body: string; seriesSlug: string }[] = [];
    for (const c of COMMENTS) {
      const profileId = byEmail.get(c.authorEmail);
      const seriesId = seriesBySlug.get(c.seriesSlug);
      if (!profileId || !seriesId) continue;
      let chapterId: string | null = null;
      if (c.chapterNumber) {
        const ch = await db.chapter.findFirst({ where: { seriesId, number: c.chapterNumber }, select: { id: true } });
        chapterId = ch?.id ?? null;
      }
      const created = await db.comment.create({
        data: {
          profileId,
          seriesId,
          chapterId,
          body: c.body,
          status: c.status as CommentStatus,
        },
      });
      createdIds.push({ id: created.id, body: c.body, seriesSlug: c.seriesSlug });
    }

    /* Reports — link to matching comments (unique per commenter+comment) */
    for (const rp of REPORTS) {
      const reporterId = byEmail.get(rp.reporterEmail);
      if (!reporterId) continue;
      const target = createdIds.find((c) => c.seriesSlug === rp.seriesSlug && rp.match(c.body));
      if (!target) continue;
      await db.commentReport.upsert({
        where: { commentId_profileId: { commentId: target.id, profileId: reporterId } },
        update: { reasonAr: rp.reasonAr },
        create: { commentId: target.id, profileId: reporterId, reasonAr: rp.reasonAr },
      });
    }
  }

  /* Novels collection — upsert by slug */
  await db.editorialCollection.upsert({
    where: { slug: "voices-in-ink" },
    update: {
      titleAr: "أصوات مُحبَّرة",
      descriptionAr: "روايات أصلية تُقرأ على مهل — من الرسائل التي تصل متأخرة إلى الرمل الذي يحفظ الأسماء.",
      theme: "gold",
      displayOrder: 3,
      isFeatured: true,
      seriesSlugsJson: JSON.stringify([
        "letters-from-the-seventh-floor",
        "sand-that-remembers-names",
        "the-six-thirty-train",
        "harbor-of-old-stars",
      ]),
    },
    create: {
      slug: "voices-in-ink",
      titleAr: "أصوات مُحبَّرة",
      descriptionAr: "روايات أصلية تُقرأ على مهل — من الرسائل التي تصل متأخرة إلى الرمل الذي يحفظ الأسماء.",
      theme: "gold",
      displayOrder: 3,
      isFeatured: true,
      seriesSlugsJson: JSON.stringify([
        "letters-from-the-seventh-floor",
        "sand-that-remembers-names",
        "the-six-thirty-train",
        "harbor-of-old-stars",
      ]),
    },
  });
}

async function main() {
  await seedProfiles();
  await seedSeries();
  await seedCollections();
  await seedProgress();
  await seedCommunity();
  await seedAnalytics();
  const counts = {
    profiles: await db.profile.count(),
    series: await db.series.count(),
    chapters: await db.chapter.count(),
    pages: await db.chapterPage.count(),
    progress: await db.readingProgress.count(),
    events: await db.analyticsEvent.count(),
    collections: await db.editorialCollection.count(),
    libraryItems: await db.libraryItem.count(),
    comments: await db.comment.count(),
    ratings: await db.rating.count(),
    reports: await db.commentReport.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

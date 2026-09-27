/**
 * Bunny Library — idempotent seed (Release A).
 * Run: bun prisma/seed.ts
 * Upserts by slug/email so re-running is always safe (docs/DECISIONS.md D-21).
 */
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { SERIES, COLLECTIONS, DEMO_ACCOUNTS, DEMO_PROGRESS, hashSeed, mulberry32 } from "../scripts/release-a-data.mjs";

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
      update: { nickname: acc.nickname, role: acc.role },
      create: {
        email: acc.email,
        nickname: acc.nickname,
        role: acc.role,
        passwordHash: hashPassword(acc.password),
        avatarSeed: `seed-${hashSeed(acc.email) % 6}`,
        bio: "حساب تجريبي ضمن النسخة التجريبية من مكتبة باني.",
      },
    });
  }
}

async function seedSeries() {
  for (const [i, s] of SERIES.entries()) {
    const data = {
      slug: s.slug,
      titleAr: s.titleAr,
      titleOriginal: s.titleOriginal,
      synopsisAr: s.synopsisAr,
      format: s.format,
      status: s.status,
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
        workflow: ch.workflow,
        publishedAt: isPublished ? daysAgo(Math.max(publishedAt, 1)) : null,
        isPremiumDemo: Boolean(ch.isPremiumDemo),
        readingDirection: s.format === "manga" ? "rtl" : "rtl",
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
  if (existing > 50) return; // idempotent-ish: only seed once
  const series = await db.series.findMany();
  const reader = await db.profile.findUnique({ where: { email: "reader@bunny.demo" } });
  const rng = mulberry32(hashSeed("analytics"));
  const events = [];
  for (let d = 30; d >= 0; d--) {
    const daily = 6 + Math.floor(rng() * 10);
    for (let k = 0; k < daily; k++) {
      const s = series[Math.floor(rng() * series.length)];
      const types = ["read_start", "read_page", "read_page", "read_page", "read_complete"];
      const type = types[Math.floor(rng() * types.length)];
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

async function main() {
  await seedProfiles();
  await seedSeries();
  await seedCollections();
  await seedProgress();
  await seedAnalytics();
  const counts = {
    profiles: await db.profile.count(),
    series: await db.series.count(),
    chapters: await db.chapter.count(),
    pages: await db.chapterPage.count(),
    progress: await db.readingProgress.count(),
    events: await db.analyticsEvent.count(),
    collections: await db.editorialCollection.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

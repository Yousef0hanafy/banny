import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Format, Role, SeriesStatus, Workflow } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Session / role helpers (local demo enforcement of the RLS matrix)  */
/* ------------------------------------------------------------------ */

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireProfile() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const profile = await db.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(roles: Role[]) {
  const profile = await requireProfile();
  if (!roles.includes(profile.role as Role)) redirect("/admin?denied=1");
  return profile;
}

export async function currentProfileOrNull() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return db.profile.findUnique({ where: { id: session.user.id } });
}

/* ------------------------------------------------------------------ */
/* Parsing helpers                                                     */
/* ------------------------------------------------------------------ */

export function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Public catalog queries — published content only (RLS-equivalent)   */
/* ------------------------------------------------------------------ */

export type SeriesCard = {
  id: string;
  slug: string;
  titleAr: string;
  format: Format;
  status: SeriesStatus;
  genres: string[];
  author: string;
  coverPath: string;
  accent: string;
  ratingAvg: number;
  ratingCount: number;
  reads: number;
  latestChapterAt: Date | null;
  chapterCount: number;
};

export type ExploreFilters = {
  q?: string;
  format?: string;
  genre?: string;
  status?: string;
  sort?: string; // popular | newest | rating
};

function toCard(s: {
  id: string;
  slug: string;
  titleAr: string;
  format: string;
  status: string;
  genresJson: string;
  author: string;
  coverPath: string;
  accent: string;
  ratingAvg: number;
  ratingCount: number;
  reads: number;
  chapters: { publishedAt: Date | null }[];
}): SeriesCard {
  const published = s.chapters.filter((c) => c.publishedAt !== null);
  const latest = published.reduce<Date | null>(
    (acc, c) => (acc === null || (c.publishedAt && acc && c.publishedAt > acc) ? c.publishedAt : acc),
    null
  );
  return {
    id: s.id,
    slug: s.slug,
    titleAr: s.titleAr,
    format: s.format as Format,
    status: s.status as SeriesStatus,
    genres: parseJsonArray(s.genresJson),
    author: s.author,
    coverPath: s.coverPath,
    accent: s.accent,
    ratingAvg: s.ratingAvg,
    ratingCount: s.ratingCount,
    reads: s.reads,
    latestChapterAt: latest,
    chapterCount: published.length,
  };
}

const cardInclude = {
  chapters: {
    where: { workflow: "published" as Workflow },
    select: { publishedAt: true },
    orderBy: { number: "desc" as const },
  },
};

export async function getPublishedSeries(filters: ExploreFilters): Promise<SeriesCard[]> {
  const where: Record<string, unknown> = {};
  // A-scope: every series in the demo is public; the published-only filter applies to chapters.
  if (filters.format && ["manga", "webtoon"].includes(filters.format)) where.format = filters.format;
  if (filters.status && ["ongoing", "completed", "hiatus"].includes(filters.status))
    where.status = filters.status;
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { titleAr: { contains: q } },
      { titleOriginal: { contains: q } },
      { synopsisAr: { contains: q } },
      { author: { contains: q } },
    ];
  }

  const rows = await db.series.findMany({
    where,
    include: cardInclude,
  });

  let cards = rows.map(toCard);
  if (filters.genre) cards = cards.filter((c) => c.genres.includes(filters.genre!));

  switch (filters.sort) {
    case "newest":
      cards.sort((a, b) => (b.latestChapterAt?.getTime() ?? 0) - (a.latestChapterAt?.getTime() ?? 0));
      break;
    case "rating":
      cards.sort((a, b) => b.ratingAvg - a.ratingAvg);
      break;
    default:
      cards.sort((a, b) => b.reads - a.reads);
  }
  return cards;
}

export async function getTrendingSeries(limit = 8): Promise<SeriesCard[]> {
  const rows = await db.series.findMany({ include: cardInclude, orderBy: { reads: "desc" }, take: limit });
  return rows.map(toCard);
}

export async function getNewestSeries(limit = 8): Promise<SeriesCard[]> {
  const rows = await db.series.findMany({ include: cardInclude, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(toCard);
}

export async function getGenreCounts(): Promise<{ genre: string; count: number }[]> {
  const rows = await db.series.findMany({ select: { genresJson: true } });
  const counts = new Map<string, number>();
  for (const r of rows)
    for (const g of parseJsonArray(r.genresJson)) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

/* ------------------------------------------------------------------ */
/* Series detail                                                       */
/* ------------------------------------------------------------------ */

export type ChapterListItem = {
  id: string;
  number: number;
  titleAr: string;
  isPremiumDemo: boolean;
  publishedAt: Date | null;
  pageCount: number;
};

export async function getSeriesBySlug(slug: string) {
  const s = await db.series.findUnique({
    where: { slug },
    include: {
      chapters: {
        where: { workflow: "published" },
        orderBy: { number: "asc" },
        include: { _count: { select: { pages: true } } },
      },
    },
  });
  if (!s) return null;
  const chapters: ChapterListItem[] = s.chapters.map((c) => ({
    id: c.id,
    number: c.number,
    titleAr: c.titleAr,
    isPremiumDemo: c.isPremiumDemo,
    publishedAt: c.publishedAt,
    pageCount: c._count.pages,
  }));
  return { ...s, publishedChapters: chapters };
}

export async function getRelatedSeries(seriesId: string, genres: string[], limit = 6) {
  const rows = await db.series.findMany({
    where: { id: { not: seriesId } },
    include: cardInclude,
    take: 24,
  });
  const cards = rows.map(toCard);
  return cards
    .map((c) => ({ c, score: c.genres.filter((g) => genres.includes(g)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.c.reads - a.c.reads)
    .slice(0, limit)
    .map((x) => x.c);
}

/* ------------------------------------------------------------------ */
/* Reader                                                              */
/* ------------------------------------------------------------------ */

export async function getChapterForReading(seriesSlug: string, chapterNumber: number) {
  const series = await db.series.findUnique({ where: { slug: seriesSlug } });
  if (!series) return null;
  const chapter = await db.chapter.findFirst({
    where: { seriesId: series.id, number: chapterNumber, workflow: "published" },
    include: { pages: { orderBy: { pageIndex: "asc" } } },
  });
  if (!chapter) return null;
  const siblings = await db.chapter.findMany({
    where: { seriesId: series.id, workflow: "published" },
    orderBy: { number: "asc" },
    select: { number: true, titleAr: true, isPremiumDemo: true },
  });
  const idx = siblings.findIndex((c) => c.number === chapter.number);
  return {
    series,
    chapter,
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
    chapterList: siblings,
  };
}

export async function getProgressMap(profileId: string | null, seriesId: string) {
  if (!profileId) return new Map<string, { pageIndex: number; percent: number; completed: boolean }>();
  const rows = await db.readingProgress.findMany({
    where: { profileId, seriesId },
    select: { chapterId: true, pageIndex: true, percent: true, completed: true },
  });
  return new Map(rows.map((r) => [r.chapterId, { pageIndex: r.pageIndex, percent: r.percent, completed: r.completed }]));
}

export type ContinueReadingItem = {
  seriesSlug: string;
  seriesTitle: string;
  coverPath: string;
  accent: string;
  format: Format;
  chapterNumber: number;
  chapterTitle: string;
  percent: number;
  updatedAt: Date;
};

export async function getContinueReading(profileId: string, limit = 3): Promise<ContinueReadingItem[]> {
  const rows = await db.readingProgress.findMany({
    where: { profileId, completed: false },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      series: { select: { slug: true, titleAr: true, coverPath: true, accent: true, format: true } },
      chapter: { select: { number: true, titleAr: true } },
    },
  });
  return rows.map((r) => ({
    seriesSlug: r.series.slug,
    seriesTitle: r.series.titleAr,
    coverPath: r.series.coverPath,
    accent: r.series.accent,
    format: r.series.format as Format,
    chapterNumber: r.chapter.number,
    chapterTitle: r.chapter.titleAr,
    percent: r.percent,
    updatedAt: r.updatedAt,
  }));
}

/* ------------------------------------------------------------------ */
/* Home rows                                                           */
/* ------------------------------------------------------------------ */

export async function getLatestUpdates(limit = 10) {
  const chapters = await db.chapter.findMany({
    where: { workflow: "published" },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    include: { series: { select: { slug: true, titleAr: true, coverPath: true, accent: true, format: true } } },
  });
  return chapters.map((c) => ({
    id: c.id,
    number: c.number,
    titleAr: c.titleAr,
    publishedAt: c.publishedAt as Date,
    isPremiumDemo: c.isPremiumDemo,
    series: c.series,
  }));
}

export async function getFeaturedCollections() {
  return db.editorialCollection.findMany({ orderBy: { displayOrder: "asc" } });
}

/* ------------------------------------------------------------------ */
/* Admin queries (role already enforced by caller)                     */
/* ------------------------------------------------------------------ */

export async function getAdminOverview() {
  const [seriesCount, chapterCount, publishedCount, draftCount, reviewCount, profileCount, eventCount] =
    await Promise.all([
      db.series.count(),
      db.chapter.count(),
      db.chapter.count({ where: { workflow: "published" } }),
      db.chapter.count({ where: { workflow: "draft" } }),
      db.chapter.count({ where: { workflow: "review" } }),
      db.profile.count(),
      db.analyticsEvent.count(),
    ]);
  const recentEvents = await db.analyticsEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      profile: { select: { nickname: true } },
      series: { select: { titleAr: true, slug: true } },
    },
  });
  const topSeries = await db.series.findMany({ orderBy: { reads: "desc" }, take: 5 });
  return {
    seriesCount,
    chapterCount,
    publishedCount,
    draftCount,
    reviewCount,
    profileCount,
    eventCount,
    recentEvents,
    topSeries,
  };
}

export type AdminSeriesFilters = { q?: string; format?: string; status?: string };

export async function getAdminSeries(filters: AdminSeriesFilters) {
  const where: Record<string, unknown> = {};
  if (filters.format && ["manga", "webtoon"].includes(filters.format)) where.format = filters.format;
  if (filters.status && ["ongoing", "completed", "hiatus"].includes(filters.status))
    where.status = filters.status;
  if (filters.q?.trim()) where.titleAr = { contains: filters.q.trim() };
  return db.series.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { chapters: true } } },
  });
}

export async function getAdminSeriesById(id: string) {
  return db.series.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { number: "asc" },
        include: { _count: { select: { pages: true } } },
      },
    },
  });
}

export async function getAdminChapters(filters: { workflow?: string; format?: string }) {
  const chapterWhere: Record<string, unknown> = {};
  if (filters.workflow && ["draft", "review", "published"].includes(filters.workflow))
    chapterWhere.workflow = filters.workflow;
  const seriesWhere: Record<string, unknown> = {};
  if (filters.format && ["manga", "webtoon"].includes(filters.format)) seriesWhere.format = filters.format;
  return db.chapter.findMany({
    where: chapterWhere,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      series: { select: { id: true, slug: true, titleAr: true, format: true, accent: true } },
      _count: { select: { pages: true } },
    },
  });
}

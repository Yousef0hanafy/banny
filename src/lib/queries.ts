import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { FORMATS } from "@/lib/constants";
import type { CommentStatus, Format, Role, SeriesStatus, Workflow } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Session / role helpers (application-level authorization — there is   */
/* NO database-level RLS on Neon; see README "What is enforced where") */
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
/* Public catalog queries — published content only (application-layer rule) */
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
    where: liveChapterWhere(),
    select: { id: true, publishedAt: true, scheduledFor: true },
    orderBy: { number: "desc" as const },
  },
};

/**
 * Public visibility rule for chapters (application-layer): workflow must be
 * `published` AND not future-scheduled. Scheduled chapters surface separately
 * with an "ينشر قريبًا" badge (Release B scheduler, FD-5).
 */
export function liveChapterWhere() {
  return {
    workflow: "published" as Workflow,
    OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
  };
}

export async function getPublishedSeries(filters: ExploreFilters): Promise<SeriesCard[]> {
  const where: Record<string, unknown> = {};
  // A-scope: every series in the demo is public; the published-only filter applies to chapters.
  if (filters.format && (FORMATS as readonly string[]).includes(filters.format)) where.format = filters.format;
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
  scheduledFor: Date | null;
  pageCount: number;
  novelWords: number;
};

export async function getSeriesBySlug(slug: string) {
  const s = await db.series.findUnique({
    where: { slug },
    include: {
      chapters: {
        where: { workflow: "published" as Workflow },
        orderBy: { number: "asc" as const },
        include: { _count: { select: { pages: true } } },
      },
    },
  });
  if (!s) return null;
  const now = new Date();
  const mapChapter = (c: (typeof s.chapters)[number]): ChapterListItem => ({
    id: c.id,
    number: c.number,
    titleAr: c.titleAr,
    isPremiumDemo: c.isPremiumDemo,
    publishedAt: c.publishedAt,
    scheduledFor: c.scheduledFor,
    pageCount: c._count.pages,
    novelWords: c.novelBody ? c.novelBody.split(/\s+/).filter(Boolean).length : 0,
  });
  const live = s.chapters.filter((c) => !c.scheduledFor || c.scheduledFor <= now);
  const scheduled = s.chapters.filter((c) => c.scheduledFor && c.scheduledFor > now);
  return {
    ...s,
    publishedChapters: live.map(mapChapter),
    scheduledChapters: scheduled.map(mapChapter),
  };
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
  const now = new Date();
  const chapter = await db.chapter.findFirst({
    where: {
      seriesId: series.id,
      number: chapterNumber,
      workflow: "published",
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    },
    include: { pages: { orderBy: { pageIndex: "asc" } } },
  });
  if (!chapter) return null;
  const siblings = await db.chapter.findMany({
    where: liveChapterWhere(),
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
    where: liveChapterWhere(),
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
  if (filters.format && (FORMATS as readonly string[]).includes(filters.format)) where.format = filters.format;
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
  if (filters.format && (FORMATS as readonly string[]).includes(filters.format)) seriesWhere.format = filters.format;
  return db.chapter.findMany({
    where: chapterWhere,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      series: { select: { id: true, slug: true, titleAr: true, format: true, accent: true } },
      _count: { select: { pages: true } },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Release B — personal library, updates feed, community, admin extras */
/* ------------------------------------------------------------------ */

export type LibraryEntry = {
  series: SeriesCard;
  shelf: "reading" | "plan" | "finished";
  addedAt: Date;
  unreadCount: number;
};

export async function getLibrary(profileId: string, shelf?: string): Promise<LibraryEntry[]> {
  const shelfFilter =
    shelf && ["reading", "plan", "finished"].includes(shelf)
      ? { profileId, shelf: shelf as "reading" | "plan" | "finished" }
      : { profileId };
  const items = await db.libraryItem.findMany({
    where: shelfFilter,
    orderBy: { updatedAt: "desc" },
    include: { series: { include: cardInclude } },
  });
  if (items.length === 0) return [];
  const seriesIds = items.map((i) => i.series.id);
  const progressRows = await db.readingProgress.findMany({
    where: { profileId, seriesId: { in: seriesIds }, completed: true },
    select: { seriesId: true, chapterId: true },
  });
  const readBy = new Map<string, Set<string>>();
  for (const r of progressRows) {
    if (!readBy.has(r.seriesId)) readBy.set(r.seriesId, new Set());
    readBy.get(r.seriesId)!.add(r.chapterId);
  }
  return items.map((item) => {
    const liveChapterIds = item.series.chapters.map((c) => c.id);
    const readSet = readBy.get(item.series.id) ?? new Set<string>();
    const unreadCount = liveChapterIds.filter((id) => !readSet.has(id)).length;
    return {
      series: toCard(item.series),
      shelf: item.shelf as LibraryEntry["shelf"],
      addedAt: item.createdAt,
      unreadCount,
    };
  });
}

export async function getLibrarySeriesIds(profileId: string): Promise<Set<string>> {
  const rows = await db.libraryItem.findMany({ where: { profileId }, select: { seriesId: true } });
  return new Set(rows.map((r) => r.seriesId));
}

export type UpdatesFeedItem = {
  chapterId: string;
  number: number;
  titleAr: string;
  publishedAt: Date;
  isPremiumDemo: boolean;
  read: boolean;
  series: { slug: string; titleAr: string; coverPath: string; accent: string; format: Format };
};

export async function getLibraryUpdatesFeed(profileId: string, limit = 40): Promise<UpdatesFeedItem[]> {
  const items = await db.libraryItem.findMany({ where: { profileId }, select: { seriesId: true } });
  if (items.length === 0) return [];
  const seriesIds = items.map((i) => i.seriesId);
  const chapters = await db.chapter.findMany({
    where: { seriesId: { in: seriesIds }, ...liveChapterWhere() },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      series: { select: { slug: true, titleAr: true, coverPath: true, accent: true, format: true } },
    },
  });
  if (chapters.length === 0) return [];
  const progress = await db.readingProgress.findMany({
    where: { profileId, chapterId: { in: chapters.map((c) => c.id) } },
    select: { chapterId: true, completed: true, percent: true },
  });
  const readSet = new Set(progress.filter((p) => p.completed || p.percent >= 99).map((p) => p.chapterId));
  return chapters.map((c) => ({
    chapterId: c.id,
    number: c.number,
    titleAr: c.titleAr,
    publishedAt: (c.publishedAt ?? c.createdAt) as Date,
    isPremiumDemo: c.isPremiumDemo,
    read: readSet.has(c.id),
    series: c.series,
  }));
}

export type CommentView = {
  id: string;
  body: string;
  createdAt: Date;
  status: CommentStatus;
  author: { id: string; nickname: string; avatarSeed: string; role: string };
  chapterNumber: number | null;
};

export async function getVisibleComments(seriesId: string, chapterId: string | null, limit = 30): Promise<CommentView[]> {
  const rows = await db.comment.findMany({
    where: { seriesId, chapterId, status: "visible" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      profile: { select: { id: true, nickname: true, avatarSeed: true, role: true } },
      chapter: { select: { number: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    status: c.status as CommentStatus,
    author: c.profile,
    chapterNumber: c.chapter?.number ?? null,
  }));
}

export async function getCommentCount(seriesId: string) {
  return db.comment.count({ where: { seriesId, status: "visible" } });
}

export async function getUserRating(profileId: string | null, seriesId: string) {
  if (!profileId) return null;
  return db.rating.findUnique({
    where: { profileId_seriesId: { profileId, seriesId } },
    select: { value: true },
  });
}

export async function getProfileStats(profileId: string) {
  const [libraryCount, chaptersRead, commentCount, ratingCount, recentProgress] = await Promise.all([
    db.libraryItem.count({ where: { profileId } }),
    db.readingProgress.count({ where: { profileId, completed: true } }),
    db.comment.count({ where: { profileId, status: "visible" } }),
    db.rating.count({ where: { profileId } }),
    db.readingProgress.findMany({
      where: { profileId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        series: { select: { slug: true, titleAr: true, coverPath: true, accent: true, format: true } },
        chapter: { select: { number: true, titleAr: true } },
      },
    }),
  ]);
  return { libraryCount, chaptersRead, commentCount, ratingCount, recentProgress };
}

export async function getProfileActivity(profileId: string, limit = 8) {
  return db.analyticsEvent.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { series: { select: { slug: true, titleAr: true } } },
  });
}

export async function getFavoriteGenres(profileId: string) {
  const items = await db.libraryItem.findMany({
    where: { profileId },
    include: { series: { select: { genresJson: true } } },
  });
  const counts = new Map<string, number>();
  for (const i of items)
    for (const g of parseJsonArray(i.series.genresJson)) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()].map(([genre, count]) => ({ genre, count })).sort((a, b) => b.count - a.count).slice(0, 5);
}

/* --- admin: moderation, users, collections, dashboard analytics --- */

export async function getModerationQueue() {
  const [items, hiddenCount, reportCount] = await Promise.all([
    db.comment.findMany({
      where: { status: { in: ["flagged", "hidden"] as ("flagged" | "hidden")[] } },
      orderBy: { updatedAt: "desc" },
      include: {
        profile: { select: { nickname: true, avatarSeed: true } },
        series: { select: { slug: true, titleAr: true } },
        chapter: { select: { number: true } },
        reports: { include: { profile: { select: { nickname: true } } } },
      },
    }),
    db.comment.count({ where: { status: "hidden" } }),
    db.commentReport.count(),
  ]);
  return { items, hiddenCount, reportCount };
}

export async function getAdminUsers() {
  return db.profile.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, email: true, nickname: true, role: true, avatarSeed: true, createdAt: true,
      _count: { select: { comments: true, libraryItems: true, readingProgress: true } },
    },
  });
}

export async function getAdminCollections() {
  return db.editorialCollection.findMany({ orderBy: { displayOrder: "asc" } });
}

export type DashboardPoint = { day: string; reads: number; logins: number; publish: number };

export async function getDashboardActivity(days = 14): Promise<DashboardPoint[]> {
  const since = new Date(Date.now() - days * 86400000);
  const events = await db.analyticsEvent.findMany({
    where: {
      createdAt: { gte: since },
      type: { in: ["read_start", "login", "publish"] as ("read_start" | "login" | "publish")[] },
    },
    select: { type: true, createdAt: true },
  });
  const buckets = new Map<string, DashboardPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    buckets.set(key, { day: key, reads: 0, logins: 0, publish: 0 });
  }
  for (const e of events) {
    const b = buckets.get(e.createdAt.toISOString().slice(0, 10));
    if (!b) continue;
    if (e.type === "read_start") b.reads++;
    else if (e.type === "login") b.logins++;
    else b.publish++;
  }
  return [...buckets.values()];
}

export async function getCommunityCounts() {
  const [comments, ratings, libraryItems, avg] = await Promise.all([
    db.comment.count({ where: { status: "visible" } }),
    db.rating.count(),
    db.libraryItem.count(),
    db.rating.aggregate({ _avg: { value: true } }),
  ]);
  return { comments, ratings, libraryItems, avgRating: avg._avg.value ?? 0 };
}

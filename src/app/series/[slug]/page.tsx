import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Star, UserRound, Languages, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { Rail, SeriesCardItem } from "@/components/library/series-card";
import { RatingWidget } from "@/components/community/rating-widget";
import { CommentsSection } from "@/components/community/comments-section";
import { WorkHeroActions } from "@/components/library/work-hero-actions";
import { WorkSynopsis } from "@/components/library/work-synopsis";
import { WorkTabs, type ChapterItemView } from "@/components/library/work-tabs";
import {
  currentProfileOrNull,
  getProgressMap,
  getRelatedSeries,
  getSeriesBySlug,
  getVisibleComments,
  getUserRating,
  liveChapterWhere,
  parseJsonArray,
} from "@/lib/queries";
import {
  type Format,
  type SeriesStatus,
  CATEGORY_LABELS,
  FORMAT_LABELS,
  STATUS_LABELS,
  isCategory,
  isSeriesStatus,
  type Shelf,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) return { title: "عمل غير موجود" };
  return {
    title: s.titleAr,
    description: s.synopsisAr.slice(0, 120),
    openGraph: {
      title: s.titleAr,
      description: s.synopsisAr.slice(0, 120),
      type: "article",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) notFound();

  const profile = await currentProfileOrNull();
  const progressMap = await getProgressMap(profile?.id ?? null, s.id);
  const genres = parseJsonArray(s.genresJson);
  const tags = parseJsonArray(s.tagsJson);
  const related = await getRelatedSeries(s.id, genres);

  const [comments, userRating, shelfRow] = await Promise.all([
    getVisibleComments(s.id, null),
    getUserRating(profile?.id ?? null, s.id),
    profile
      ? import("@/lib/db").then(({ db }) =>
          db.libraryItem.findUnique({
            where: { profileId_seriesId: { profileId: profile.id, seriesId: s.id } },
            select: { shelf: true },
          })
        )
      : Promise.resolve(null),
  ]);

  // Server-side progress for signed-in reader
  let serverProgress: { chapterNumber: number; pageIndex: number; percent: number } | null = null;
  if (profile) {
    const row = await import("@/lib/db").then(({ db }) =>
      db.readingProgress.findFirst({
        where: { profileId: profile.id, seriesId: s.id, completed: false, percent: { gt: 0, lt: 100 }, chapter: { ...liveChapterWhere(), isPremiumDemo: false } },
        orderBy: { updatedAt: "desc" },
        include: { chapter: { select: { number: true } } },
      })
    );
    if (row) {
      serverProgress = {
        chapterNumber: row.chapter.number,
        pageIndex: row.pageIndex,
        percent: row.percent,
      };
    }
  }

  const published = s.publishedChapters;
  const scheduled = s.scheduledChapters;

  // Title category logic:
  // Uses s.category from returned Prisma Series.
  // Legacy unclassified webtoon remains null and is NOT guessed as manhwa.
  const categoryLabel = s.category && isCategory(s.category) ? CATEGORY_LABELS[s.category] : null;
  const formatLabel = FORMAT_LABELS[s.format as Format] ?? s.format;
  const statusLabel = isSeriesStatus(s.status) ? STATUS_LABELS[s.status as SeriesStatus] : s.status;
  const primaryGenre = genres[0] ?? null;

  const publishedView: ChapterItemView[] = published.map((c) => ({
    id: c.id,
    number: c.number,
    titleAr: c.titleAr,
    isPremiumDemo: c.isPremiumDemo,
    publishedAt: c.publishedAt,
    scheduledFor: c.scheduledFor,
    pageCount: c.pageCount,
    novelWords: c.novelWords,
  }));

  const scheduledView: ChapterItemView[] = scheduled.map((c) => ({
    id: c.id,
    number: c.number,
    titleAr: c.titleAr,
    isPremiumDemo: c.isPremiumDemo,
    publishedAt: c.publishedAt,
    scheduledFor: c.scheduledFor,
    pageCount: c.pageCount,
    novelWords: c.novelWords,
  }));

  const progressEntries: [string, { pageIndex: number; percent: number; completed: boolean }][] = [
    ...progressMap.entries(),
  ];

  const initialShelf = (shelfRow?.shelf as Shelf) ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 pb-20 md:pb-12">
        {/* Cover-Led Ambient Banner Header */}
        <section aria-label="بيانات العمل الرئيسية" className="relative border-b border-border/50 bg-[#101217]">
          {/* Subtle Ambient Cover Glow Backdrop */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
            <div className="relative h-full w-full">
              <Image
                src={s.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                alt=""
                fill
                sizes="100vw"
                className="object-cover blur-3xl scale-125"
                priority
                aria-hidden
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#101217]/60 via-[#101217]/90 to-[#101217]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
            {/* Mobile Header: Compact Cover and Title */}
            <div className="flex flex-col gap-5 sm:hidden">
              <div className="flex gap-4">
                <div className="relative h-44 w-32 shrink-0 overflow-hidden rounded-xl border border-border/70 shadow-xl">
                  <Image
                    src={s.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                    alt={`غلاف ${s.titleAr}`}
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {/* Category / Genre breadcrumb */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{categoryLabel ?? formatLabel}</span>
                    {primaryGenre && (
                      <>
                        <span className="text-muted-foreground/60">›</span>
                        <Link
                          href={`/explore?genre=${encodeURIComponent(primaryGenre)}`}
                          className="text-primary/90 hover:underline"
                        >
                          {primaryGenre}
                        </Link>
                      </>
                    )}
                  </div>

                  <h1 className="mt-1 text-xl font-extrabold text-foreground leading-snug">
                    {s.titleAr}
                  </h1>

                  {s.titleOriginal && (
                    <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                      {s.titleOriginal}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-bold text-gold">
                      <Star className="size-3 fill-gold" aria-hidden />
                      {s.ratingAvg.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <BookOpen className="size-3" aria-hidden />
                      {published.length} فصلاً
                    </span>
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile CTA Buttons */}
              <WorkHeroActions
                slug={s.slug}
                format={s.format as Format}
                serverProgress={serverProgress}
                chapters={published.map((c) => ({ number: c.number, isPremiumDemo: c.isPremiumDemo }))}
                titleAr={s.titleAr}
                initialShelf={initialShelf}
              />

              {/* Mobile Concise Synopsis */}
              <WorkSynopsis synopsis={s.synopsisAr} className="mt-1" />
            </div>

            {/* Desktop Header: Expressive Wide Title & Action Deck */}
            <div className="hidden sm:block lg:ps-[312px]">
              <div className="relative float-start me-5 hidden h-40 w-28 overflow-hidden rounded-xl sm:block lg:hidden">
                <Image src={s.coverPath} alt={`غلاف ${s.titleAr}`} fill sizes="112px" className="object-cover" priority />
              </div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">{categoryLabel ?? formatLabel}</span>
                {primaryGenre && (
                  <>
                    <span className="text-muted-foreground/50">›</span>
                    <Link
                      href={`/explore?genre=${encodeURIComponent(primaryGenre)}`}
                      className="text-primary hover:underline"
                    >
                      {primaryGenre}
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-2 flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-extrabold text-foreground lg:text-4xl">
                    {s.titleAr}
                  </h1>
                  {s.titleOriginal && (
                    <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                      {s.titleOriginal}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                      {statusLabel}
                    </span>
                    <span className="flex items-center gap-1 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold">
                      <Star className="size-3.5 fill-gold" aria-hidden />
                      {s.ratingAvg.toFixed(1)}
                      <span className="font-normal text-muted-foreground">({s.ratingCount})</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="size-3.5" aria-hidden />
                      {published.length} فصلاً
                    </span>
                  </div>

                  {/* Primary Start/Resume and Library Action */}
                  <div className="mt-6">
                    <WorkHeroActions
                      slug={s.slug}
                      format={s.format as Format}
                      serverProgress={serverProgress}
                      chapters={published.map((c) => ({ number: c.number, isPremiumDemo: c.isPremiumDemo }))}
                      titleAr={s.titleAr}
                      initialShelf={initialShelf}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Body: Desktop Two-Column Layout */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* Desktop Left Column / Sidebar: Cover, Synopsis, Credits */}
            <aside aria-label="بيانات العمل والتأليف" className="relative order-2 space-y-6 lg:order-none lg:-mt-64">
              {/* Cover Card (Desktop) */}
              <div className="hidden lg:block">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border/70 shadow-2xl">
                  <Image
                    src={s.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                    alt={`غلاف ${s.titleAr}`}
                    fill
                    sizes="280px"
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Badges below cover */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {categoryLabel && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {categoryLabel}
                    </span>
                  )}
                  {primaryGenre && (
                    <Link
                      href={`/explore?genre=${encodeURIComponent(primaryGenre)}`}
                      className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      {primaryGenre}
                    </Link>
                  )}
                  <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
                    {statusLabel}
                  </span>
                </div>

                {/* Concise Expandable Synopsis */}
                <div className="mt-4 border-t border-border/50 pt-4">
                  <WorkSynopsis synopsis={s.synopsisAr} />
                </div>
              </div>

              {/* Credits Box */}
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  فريق العمل
                </h3>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <UserRound className="size-3.5 text-primary" aria-hidden />
                      <span>المؤلف</span>
                    </dt>
                    <dd className="font-semibold text-foreground">{s.author}</dd>
                  </div>
                  {s.translator && (
                    <div className="flex items-center justify-between border-t border-border/40 pt-2">
                      <dt className="flex items-center gap-1.5 text-muted-foreground">
                        <Languages className="size-3.5 text-primary" aria-hidden />
                        <span>المترجم</span>
                      </dt>
                      <dd className="font-semibold text-foreground">{s.translator}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Editorial Recommendation Callout Card */}
              {genres.length > 0 && <div className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Sparkles className="size-4 text-gold" aria-hidden />
                  <span>أجواء العمل</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {genres.join(" · ")}
                </p>
              </div>}
            </aside>

            {/* Right Main Column: Accessible Tabs, Search/Sort, Chapters List */}
            <div className="order-1 min-w-0 lg:order-none">
              <WorkTabs
                slug={s.slug}
                format={s.format as Format}
                coverPath={s.coverPath}
                publishedChapters={publishedView}
                scheduledChapters={scheduledView}
                serverProgress={serverProgress}
                progressMapEntries={progressEntries}
                aboutData={{
                  titleAr: s.titleAr,
                  synopsisAr: s.synopsisAr,
                  author: s.author,
                  translator: s.translator,
                  categoryLabel,
                  formatLabel,
                  statusLabel,
                  genres,
                  tags,
                }}
              >
                {/* Preserved Ratings and Comments Community section */}
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  <RatingWidget
                    slug={s.slug}
                    ratingAvg={s.ratingAvg}
                    ratingCount={s.ratingCount}
                    userValue={userRating?.value ?? null}
                  />
                  <CommentsSection
                    seriesSlug={s.slug}
                    seriesTitle={s.titleAr}
                    comments={comments}
                  />
                </div>
              </WorkTabs>

              {/* Similar Works Rail */}
              <div className="mt-10">
                <Rail title="أعمال مشابهة قد تعجبك">
                  {related.map((r) => (
                    <SeriesCardItem key={r.id} series={r} />
                  ))}
                  {related.length === 0 && (
                    <p className="text-sm text-muted-foreground">لا أعمال مشابهة بعد.</p>
                  )}
                </Rail>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}

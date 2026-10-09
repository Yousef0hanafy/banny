import Link from "next/link";
import Image from "next/image";
import { BookMarked, Compass, Flame, LibraryBig, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { ContinueReadingHero } from "@/components/library/continue-reading-hero";
import { Rail, SeriesCardItem } from "@/components/library/series-card";
import { HomeCategories } from "@/components/library/home-categories";
import { HomeLatestUpdates, type GroupedSeriesUpdate } from "@/components/library/home-latest-updates";
import {
  getContinueReading,
  getFeaturedCollections,
  getGenreCounts,
  getLatestUpdates,
  getNewestSeries,
  getTrendingSeries,
  getSeriesBySlug,
  currentProfileOrNull,
  parseJsonArray,
  type SeriesCard,
} from "@/lib/queries";
import { getForYouSeries } from "@/lib/foryou";
import type { Category, Format } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await currentProfileOrNull();
  const [continueItems, forYou, rawLatest, trending, newest, genres, collections] = await Promise.all([
    profile ? getContinueReading(profile.id) : Promise.resolve([]),
    profile ? getForYouSeries(profile.id) : Promise.resolve([]),
    getLatestUpdates(24),
    getTrendingSeries(8),
    getNewestSeries(8),
    getGenreCounts(),
    getFeaturedCollections(),
  ]);

  // Guest featured series (first trending or newest series for guest hero without fake metrics)
  const guestFeatured = (trending[0] ?? newest[0] ?? null) as SeriesCard | null;

  // Group latest updates by work (one card per work, up to 2 newest chapter links)
  const groupedMap = new Map<string, GroupedSeriesUpdate>();
  for (const ch of rawLatest) {
    const existing = groupedMap.get(ch.series.slug);
    if (!existing) {
      groupedMap.set(ch.series.slug, {
        series: {
          slug: ch.series.slug,
          titleAr: ch.series.titleAr,
          coverPath: ch.series.coverPath,
          format: ch.series.format as Format,
          category: (ch.series as { category?: Category | null }).category ?? null,
          accent: ch.series.accent,
        },
        latestPublishedAt: ch.publishedAt,
        chapters: [
          {
            id: ch.id,
            number: ch.number,
            titleAr: ch.titleAr,
            publishedAt: ch.publishedAt,
            isPremiumDemo: ch.isPremiumDemo,
          },
        ],
      });
    } else if (existing.chapters.length < 2) {
      existing.chapters.push({
        id: ch.id,
        number: ch.number,
        titleAr: ch.titleAr,
        publishedAt: ch.publishedAt,
        isPremiumDemo: ch.isPremiumDemo,
      });
    }
  }
  const groupedLatest = Array.from(groupedMap.values()).slice(0, 6);

  // Derive genuine cover previews for the 4 categories
  const allAvailableSeries = [...trending, ...newest];
  const categoryCovers: Partial<Record<Category, string>> = {};
  for (const s of allAvailableSeries) {
    if (s.category && !categoryCovers[s.category]) {
      categoryCovers[s.category] = s.coverPath;
    }
  }

  // Resolve actual collection metadata and series titles (no hardcoded demo slug switches)
  const collectionData = await Promise.all(
    collections.map(async (c) => {
      const slugs = parseJsonArray(c.seriesSlugsJson);
      const resolved = await Promise.all(
        slugs.map(async (slug) => {
          const s = await getSeriesBySlug(slug);
          return s ? { slug, cover: s.coverPath, title: s.titleAr, genres: parseJsonArray(s.genresJson) } : null;
        })
      );
      return {
        ...c,
        series: resolved.filter(Boolean) as Array<{ slug: string; cover: string; title: string; genres: string[] }>,
      };
    })
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 pb-20 md:pb-12">
        {/* Compact Resume Hero (with actual progress or real guest featured work) */}
        <ContinueReadingHero
          initialItems={continueItems}
          guestFeatured={guestFeatured}
        />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Four Category Shortcuts */}
          <HomeCategories categoryCovers={categoryCovers} />

          {/* Grouped Latest Updates (three-column desktop grid / vertical mobile list) */}
          <HomeLatestUpdates updates={groupedLatest} />

          {/* اختيارات الفريق / المجموعات التحريرية */}
          {collectionData.length > 0 && (
            <section className="mt-10 sm:mt-12" aria-label="اختيارات الفريق">
              <div className="mb-4 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-gold" aria-hidden />
                  <h2 className="text-lg font-bold text-foreground sm:text-xl">اختيارات الفريق</h2>
                </div>
                <Link
                  href="/explore"
                  className="text-sm font-medium text-muted-foreground transition hover:text-primary"
                >
                  عرض الكل ←
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collectionData.map((col) => (
                  <div
                    key={col.id}
                    className="overflow-hidden rounded-xl border border-border/70 bg-[#191C25] p-4 sm:p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                          {col.theme === "gold" ? (
                            <BookMarked className="size-4 text-gold" aria-hidden />
                          ) : (
                            <Sparkles className="size-4 text-primary" aria-hidden />
                          )}
                          {col.titleAr}
                        </h3>
                        {col.descriptionAr && (
                          <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {col.descriptionAr}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Series covers preview */}
                    <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                      {col.series.slice(0, 4).map((s) => (
                        <Link
                          key={s.slug}
                          href={`/series/${s.slug}`}
                          className="group relative block w-20 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border/70 shadow-sm transition group-hover:border-primary/50 group-hover:scale-105">
                            <Image
                              src={s.cover}
                              alt={s.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <span className="mt-1.5 block truncate text-[11px] font-medium text-foreground transition group-hover:text-primary">
                            {s.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* لك — توصيات مبنية على قراءاتك (Release D, FD-12) */}
          {forYou.length > 0 && (
            <Rail title="لك — مقترحات من قراءاتك">
              {forYou.map((f) => (
                <SeriesCardItem key={f.series.id} series={f.series} reasonAr={f.reasonAr} />
              ))}
            </Rail>
          )}

          {/* الأكثر رواجًا هذا الأسبوع */}
          {trending.length > 0 && (
            <Rail title="الأكثر رواجًا هذا الأسبوع" href="/explore?sort=popular">
              {trending.map((s, i) => (
                <SeriesCardItem key={s.id} series={s} badge={`${i + 1}`} />
              ))}
            </Rail>
          )}

          {/* أضيف حديثًا */}
          {newest.length > 0 && (
            <Rail title="أضيف حديثًا" href="/explore?sort=newest">
              {newest.map((s) => (
                <SeriesCardItem key={s.id} series={s} />
              ))}
            </Rail>
          )}

          {/* اكتشف حسب النوع */}
          <section className="mt-10 sm:mt-12" aria-label="اكتشف حسب النوع">
            <div className="mb-3.5 flex items-center gap-2 px-1">
              <Compass className="size-5 text-primary" aria-hidden />
              <h2 className="text-lg font-bold text-foreground sm:text-xl">اكتشف حسب النوع</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <Link
                  key={g.genre}
                  href={`/explore?genre=${encodeURIComponent(g.genre)}`}
                  className="group flex items-center gap-2 rounded-xl border border-border/70 bg-[#191C25] px-3.5 py-2 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-[#1f1c2e] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <span className="group-hover:text-primary">{g.genre}</span>
                  <span className="rounded-full bg-secondary/90 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                    {g.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* بانر المكتبة السفلي */}
          <section className="my-10 sm:my-14 overflow-hidden rounded-2xl border border-border/70 bg-[#191C25] p-6 sm:p-8" aria-label="عن المكتبة">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <LibraryBig className="size-5 text-primary" aria-hidden />
                  مكتبتك… لا قوائم التوصيات
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  مكتبة باني تُرتب نفسها حولك: ما تقرأه أولًا، وما تجاوزته يحدّثك، وما تحبه يقترب منك — بلا إعلانات
                  وبلا ضجيج لا يخصك.
                </p>
              </div>
              <Link
                href="/explore"
                className="flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2.5 text-sm font-semibold text-primary border border-primary/30 transition hover:bg-primary/30"
              >
                <Flame className="size-4" aria-hidden />
                استكشف المكتبة كاملة
              </Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}

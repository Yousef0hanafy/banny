import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookMarked, Flame, LibraryBig, Sparkles, Star } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { ContinueReadingHero } from "@/components/library/continue-reading-hero";
import { Rail, SeriesCardItem } from "@/components/library/series-card";
import {
  getContinueReading,
  getFeaturedCollections,
  getGenreCounts,
  getLatestUpdates,
  getNewestSeries,
  getTrendingSeries,
  currentProfileOrNull,
  parseJsonArray,
} from "@/lib/queries";
import { FORMAT_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function timeAgoAr(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `قبل ${Math.max(mins, 1)} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `قبل ${days} يوم`;
  const months = Math.floor(days / 30);
  return `قبل ${months} شهر`;
}

export default async function HomePage() {
  const profile = await currentProfileOrNull();
  const [continueItems, latest, trending, newest, genres, collections] = await Promise.all([
    profile ? getContinueReading(profile.id) : Promise.resolve([]),
    getLatestUpdates(10),
    getTrendingSeries(8),
    getNewestSeries(8),
    getGenreCounts(),
    getFeaturedCollections(),
  ]);

  const collectionCovers = await Promise.all(
    collections.map(async (c) => ({
      ...c,
      slugs: parseJsonArray(c.seriesSlugsJson),
      covers: await Promise.all(
        parseJsonArray(c.seriesSlugsJson)
          .slice(0, 3)
          .map(async (slug) => {
            const s = await import("@/lib/queries").then((m) => m.getSeriesBySlug(slug));
            return s ? { slug, cover: s.coverPath, title: s.titleAr } : null;
          })
      ),
    }))
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <ContinueReadingHero initialItems={continueItems} />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* أحدث التحديثات */}
          <Rail title="أحدث التحديثات" href="/explore?sort=newest">
            {latest.map((u) => (
              <Link
                key={u.id}
                href={`/read/${FORMAT_LABELS[u.series.format] === "مانجا" ? "manga" : "webtoon"}/${u.series.slug}/${u.number}`}
                className="group block w-[240px] shrink-0"
                role="listitem"
              >
                <div className="flex gap-3 rounded-xl border border-border/60 bg-card p-3 transition group-hover:border-primary/40 group-hover:bg-accent/40">
                  <span className="relative block size-16 shrink-0 overflow-hidden rounded-lg border border-border/60">
                    <Image src={u.series.coverPath} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
                      {u.series.titleAr}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {u.isPremiumDemo ? "فصل مقفل · " : ""}الفصل {u.number} — {u.titleAr}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/80">
                      <span className="inline-block size-1.5 rounded-full bg-success" aria-hidden />
                      {u.publishedAt ? timeAgoAr(u.publishedAt) : ""}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </Rail>

          {/* المجموعات المختارة */}
          <Rail title="مجموعات مختارة بعناية">
            {collectionCovers.map((c) => (
              <div
                key={c.slug}
                className="w-[320px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card sm:w-[420px]"
                role="listitem"
              >
                <div
                  className={`flex gap-2 p-4 ${c.theme === "gold" ? "bg-gradient-to-l from-gold/15 to-transparent" : "bg-gradient-to-l from-primary/15 to-transparent"}`}
                >
                  {c.covers.map(
                    (cv) =>
                      cv && (
                        <span key={cv.slug} className="relative block h-28 w-20 overflow-hidden rounded-lg border border-border/50">
                          <Image src={cv.cover} alt={cv.title} fill sizes="80px" className="object-cover" />
                        </span>
                      )
                  )}
                </div>
                <div className="p-4 pt-3">
                  <h3 className="flex items-center gap-2 font-bold text-foreground">
                    {c.theme === "gold" ? <BookMarked className="size-4 text-gold" aria-hidden /> : <Sparkles className="size-4 text-primary" aria-hidden />}
                    {c.titleAr}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-7 text-muted-foreground">{c.descriptionAr}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.slugs.slice(0, 4).map((slug) => (
                      <Link
                        key={slug}
                        href={`/series/${slug}`}
                        className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                      >
                        {slug === "warden-of-the-twilight-gate"
                          ? "حارس بوابة الشفق"
                          : slug === "city-pulse-zero"
                            ? "نبض المدينة صفر"
                            : slug === "wedding-of-the-red-moon"
                              ? "زفاف القمر الأحمر"
                              : slug === "harbor-of-the-missing"
                                ? "مرسى الغائبين"
                                : slug === "mint-leaf-cafe"
                                  ? "مقهى أوراق النعناع"
                                  : "خزانة زينب"}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </Rail>

          {/* الأكثر رواجًا */}
          <Rail title="الأكثر رواجًا هذا الأسبوع">
            {trending.map((s, i) => (
              <SeriesCardItem key={s.id} series={s} badge={`${i + 1}`} />
            ))}
          </Rail>

          {/* أضيف حديثًا */}
          <Rail title="أضيف حديثًا" href="/explore?sort=newest">
            {newest.map((s) => (
              <SeriesCardItem key={s.id} series={s} />
            ))}
          </Rail>

          {/* تصفح حسب النوع */}
          <section className="mt-10 pb-6" aria-label="تصفح حسب النوع">
            <h2 className="mb-3 px-1 text-lg font-bold sm:text-xl">تصفح حسب النوع</h2>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <Link
                  key={g.genre}
                  href={`/explore?genre=${encodeURIComponent(g.genre)}`}
                  className="group flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2.5 transition hover:border-primary/40 hover:bg-accent/50"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">{g.genre}</span>
                  <span className="rounded-full bg-secondary px-1.5 text-[11px] text-muted-foreground">{g.count}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* بانر المكتبة */}
          <section className="mb-10 overflow-hidden rounded-2xl border border-border/60 bg-card" aria-label="عن المكتبة">
            <div className="bg-library-glow flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="max-w-xl">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <LibraryBig className="size-5 text-primary" aria-hidden />
                  مكتبتك… لا قوائم التوصيات
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  مكتبة باني تُرتب نفسها حولك: ما تقرأه أولًا، وما تجاوزته يحدّثك، وما تحبه يقترب منك — بلا إعلانات
                  وبلا ضجيج لا يخصك.
                </p>
              </div>
              <Link
                href="/explore"
                className="flex items-center gap-1.5 rounded-xl bg-primary/15 px-4 py-2.5 text-sm font-medium text-primary border border-primary/30 transition hover:bg-primary/25"
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

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CheckCircle2, CircleDashed, Lock, Star, UserRound, Languages, Tag } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { Rail, SeriesCardItem, SeriesMetaBadges } from "@/components/library/series-card";
import { SeriesCTA } from "@/components/library/series-cta";
import {
  currentProfileOrNull,
  getProgressMap,
  getRelatedSeries,
  getSeriesBySlug,
  parseJsonArray,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) return { title: "عمل غير موجود" };
  return { title: s.titleAr, description: s.synopsisAr.slice(0, 120) };
}

function timeAgoAr(date: Date) {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "اليوم";
  if (days < 30) return `قبل ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `قبل ${months} شهر`;
  return `قبل ${Math.floor(months / 12)} سنة`;
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
  const related = await getRelatedSeries(s.id, parseJsonArray(s.genresJson));
  const genres = parseJsonArray(s.genresJson);
  const tags = parseJsonArray(s.tagsJson);

  // server-side progress for the signed-in reader (most recent chapter with progress)
  let serverProgress: { chapterNumber: number; pageIndex: number; percent: number } | null = null;
  if (profile) {
    const row = await import("@/lib/db").then(({ db }) =>
      db.readingProgress.findFirst({
        where: { profileId: profile.id, seriesId: s.id, completed: false },
        orderBy: { updatedAt: "desc" },
        include: { chapter: { select: { number: true } } },
      })
    );
    if (row)
      serverProgress = {
        chapterNumber: row.chapter.number,
        pageIndex: row.pageIndex,
        percent: row.percent,
      };
  }

  const published = s.publishedChapters;
  const isLocked = (c: (typeof published)[number]) => c.isPremiumDemo;
  const isRead = (num: number) => {
    const p = progressMap.get(published.find((c) => c.number === num)?.id ?? "");
    return p?.completed || (p?.percent ?? 0) >= 99;
  };
  const inProgress = (num: number) => {
    const p = progressMap.get(published.find((c) => c.number === num)?.id ?? "");
    return p && !p.completed && p.percent > 0;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero */}
        <div className="relative border-b border-border/50 bg-library-glow">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="relative mx-auto h-64 w-44 shrink-0 overflow-hidden rounded-2xl border border-border/70 shadow-2xl sm:mx-0 sm:h-72 sm:w-48">
                <Image
                  src={s.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                  alt={`غلاف ${s.titleAr}`}
                  fill
                  sizes="192px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-start">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{s.titleAr}</h1>
                {s.titleOriginal && (
                  <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                    {s.titleOriginal}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <SeriesMetaBadges format={s.format as "manga" | "webtoon"} status={s.status as "ongoing"} />
                  <span className="flex items-center gap-1 rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                    <Star className="size-3.5 fill-gold" aria-hidden />
                    {s.ratingAvg.toFixed(1)}
                    <span className="font-normal text-muted-foreground">({s.ratingCount})</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="size-3.5" aria-hidden />
                    {published.length} فصل منشور
                  </span>
                </div>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-foreground/90 text-balance-ar sm:mx-0">
                  {s.synopsisAr}
                </p>

                <dl className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground sm:justify-start">
                  <div className="flex items-center gap-1.5">
                    <UserRound className="size-3.5" aria-hidden />
                    <span>تأليف: <span className="text-foreground/90">{s.author}</span></span>
                  </div>
                  {s.translator && (
                    <div className="flex items-center gap-1.5">
                      <Languages className="size-3.5" aria-hidden />
                      <span>ترجمة: <span className="text-foreground/90">{s.translator}</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Tag className="size-3.5" aria-hidden />
                    <span>{tags.join(" · ")}</span>
                  </div>
                </dl>

                <div className="mt-5 flex justify-center sm:justify-start">
                  <SeriesCTA
                    slug={s.slug}
                    format={s.format as "manga" | "webtoon"}
                    serverProgress={serverProgress}
                    chapters={published.map((c) => ({ number: c.number, isPremiumDemo: c.isPremiumDemo }))}
                    titleAr={s.titleAr}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 py-8 lg:grid-cols-[1fr_280px]">
            {/* Chapter list */}
            <section aria-label="قائمة الفصول">
              <h2 className="mb-3 text-lg font-bold">الفصول</h2>
              <ol className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
                {[...published].reverse().map((c) => {
                  const locked = isLocked(c);
                  const read = isRead(c.number);
                  const prog = inProgress(c.number);
                  const row = (
                    <>
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-xl border text-sm font-bold ${
                          locked
                            ? "border-gold/40 bg-gold/10 text-gold"
                            : read
                              ? "border-success/30 bg-success/10 text-success"
                              : prog
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border bg-secondary/50 text-muted-foreground"
                        }`}
                        aria-hidden
                      >
                        {locked ? <Lock className="size-4" /> : c.number}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            الفصل {c.number}: {c.titleAr}
                          </span>
                          {locked && (
                            <span className="shrink-0 rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold">
                              فصل تجريبي مقفل
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          {c.pageCount} {s.format === "manga" ? "صفحة" : "لوحة"}
                          {c.publishedAt && <span>· {timeAgoAr(c.publishedAt)}</span>}
                          {read && <span className="text-success">· تمت القراءة</span>}
                          {prog && <span className="text-primary">· قارأتم {Math.round(progressMap.get(c.id)?.percent ?? 0)}٪</span>}
                        </span>
                      </span>
                      {read ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                      ) : prog ? (
                        <CircleDashed className="size-4 shrink-0 text-primary" aria-hidden />
                      ) : null}
                    </>
                  );
                  return (
                    <li key={c.id}>
                      {locked ? (
                        <Link
                          href={`/read/${s.format}/${s.slug}/${c.number}`}
                          className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-accent/40"
                        >
                          {row}
                        </Link>
                      ) : (
                        <Link
                          href={`/read/${s.format}/${s.slug}/${c.number}`}
                          className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-accent/40"
                        >
                          {row}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
              {published.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                  لا فصول منشورة بعد — العمل قيد التحضير.
                </p>
              )}
            </section>

            {/* Side info */}
            <aside className="space-y-5" aria-label="معلومات إضافية">
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <h3 className="mb-2.5 text-sm font-bold">التصنيفات</h3>
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <Link
                      key={g}
                      href={`/explore?genre=${encodeURIComponent(g)}`}
                      className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-gold/25 bg-gold/5 p-4 text-xs leading-6 text-gold/90">
                هذا عمل خيالي أصلي أُنشئ لأغراض العرض التجريبي — لا يمثل عملًا حقيقيًا أو مرخّصًا.
              </div>
            </aside>
          </div>

          <Rail title="أعمال مشابهة قد تعجبك">
            {related.map((r) => (
              <SeriesCardItem key={r.id} series={r} />
            ))}
            {related.length === 0 && (
              <p className="text-sm text-muted-foreground">لا أعمال مشابهة بعد.</p>
            )}
          </Rail>
          <div className="pb-10" />
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

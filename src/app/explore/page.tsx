import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { SeriesCardItem } from "@/components/library/series-card";
import { ExploreFilterBar } from "@/components/library/explore-filters";
import { getPublishedSeries, type ExploreFilters } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استكشف المكتبة",
};

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-muted-foreground">
        <SearchX className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-bold text-foreground">
        {filtered ? "لا نتائج مطابقة" : "المكتبة فارغة حاليًا"}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
        {filtered
          ? "جرّب كلمة أقصر، أو أزل بعض المرشحات — ربما ينتظرك العمل في رفٍّ آخر."
          : "لم تُضف أعمال بعد. عد لاحقًا، الرفوف تُرتَّب الآن."}
      </p>
    </div>
  );
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters: ExploreFilters = {
    q: get("q"),
    format: get("format"),
    genre: get("genre"),
    status: get("status"),
    sort: get("sort") ?? "popular",
  };
  const series = await getPublishedSeries(filters);
  const hasFilters = Boolean(filters.q || filters.format || filters.genre || filters.status);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="pt-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">استكشف المكتبة</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              كل الأعمال في رفٍّ واحد — ابحث، رشّح، ورتّب كما تحب.
            </p>
          </header>

          <Suspense fallback={<div className="mt-6 h-28 animate-pulse rounded-xl bg-accent/50" />}>
            <ExploreFilterBar resultCount={series.length} />
          </Suspense>

          {series.length === 0 ? (
            <EmptyState filtered={hasFilters} />
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {series.map((s) => (
                <div key={s.id} className="w-full [&>a]:w-full">
                  <SeriesCardItem series={s} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

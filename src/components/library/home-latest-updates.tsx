import Image from "next/image";
import Link from "next/link";
import { Clock, MoreVertical } from "lucide-react";
import type { Category, Format } from "@/lib/constants";
import { getCategoryLabel } from "@/components/library/series-card";
import { readerHref } from "@/lib/reader-route";

export type GroupedSeriesUpdate = {
  series: {
    slug: string;
    titleAr: string;
    coverPath: string;
    format: Format;
    category?: Category | null;
    accent?: string;
  };
  latestPublishedAt: Date;
  chapters: Array<{
    id: string;
    number: number;
    titleAr: string;
    publishedAt: Date;
    isPremiumDemo?: boolean;
  }>;
};

function timeAgoAr(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${Math.max(mins, 1)} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  return `منذ ${months} شهر`;
}

export function HomeLatestUpdates({
  updates,
}: {
  updates: GroupedSeriesUpdate[];
}) {
  if (updates.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-12" aria-label="آخر الفصول">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-bold text-foreground sm:text-xl">آخر الفصول</h2>
        </div>
        <Link
          href="/updates"
          className="text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          عرض الكل ←
        </Link>
      </div>

      {/* Desktop 3-column grid / Mobile vertical list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {updates.map((item) => {
          const newest = item.chapters[0];
          const second = item.chapters[1];
          const isRecent =
            newest && Date.now() - new Date(newest.publishedAt).getTime() < 1000 * 60 * 60 * 24 * 3; // within 3 days

          return (
            <div
              key={item.series.slug}
              className="group relative flex items-center gap-3.5 rounded-xl border border-border/70 bg-[#191C25] p-3 transition duration-200 hover:border-primary/50 hover:bg-[#1a1728] shadow-sm"
            >
              {/* Cover Thumbnail */}
              <Link
                href={`/series/${item.series.slug}`}
                className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                tabIndex={-1}
                aria-hidden
              >
                <Image
                  src={item.series.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                  alt={`غلاف ${item.series.titleAr}`}
                  fill
                  sizes="80px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </Link>

              {/* Work & Chapters info */}
              <div className="min-w-0 flex-1 space-y-1">
                {/* Title + More */}
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/series/${item.series.slug}`}
                    className="truncate text-sm sm:text-base font-bold text-foreground transition group-hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    {item.series.titleAr}
                  </Link>

                  <span className="text-muted-foreground/60 shrink-0" aria-hidden>
                    <MoreVertical className="size-3.5" />
                  </span>
                </div>

                {/* Chapter links (up to 2 newest links) */}
                <div className="flex flex-wrap items-center gap-2" role="list" aria-label={`فصول ${item.series.titleAr}`}>
                  {newest && (
                    <Link
                      role="listitem"
                      href={readerHref(item.series.format, item.series.slug, newest.number)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2 py-0.5 text-xs font-medium text-foreground transition hover:bg-primary/20 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      <span>الفصل {newest.number}</span>
                      <span className="sr-only"> — {newest.titleAr}، {item.series.titleAr}</span>
                      {isRecent && (
                        <span className="flex items-center gap-1 text-[10px] text-primary font-bold">
                          <span className="size-1.5 rounded-full bg-primary" />
                          جديد
                        </span>
                      )}
                    </Link>
                  )}

                  {second && (
                    <Link
                      role="listitem"
                      href={readerHref(item.series.format, item.series.slug, second.number)}
                      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition hover:text-foreground hover:bg-secondary/60"
                    >
                      الفصل {second.number}<span className="sr-only"> — {second.titleAr}، {item.series.titleAr}</span>
                    </Link>
                  )}
                </div>

                {/* Meta bottom row */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                  <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px]">
                    {getCategoryLabel(item.series.category)}
                  </span>
                  <span>·</span>
                  <span>{timeAgoAr(item.latestPublishedAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

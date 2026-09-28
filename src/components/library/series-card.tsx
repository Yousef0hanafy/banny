import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FORMAT_LABELS, type Format, type SeriesStatus, STATUS_LABELS } from "@/lib/constants";
import type { SeriesCard as SeriesCardType } from "@/lib/queries";

export function SeriesCardItem({
  series,
  badge,
}: {
  series: Pick<SeriesCardType, "slug" | "titleAr" | "coverPath" | "format" | "ratingAvg" | "genres" | "status" | "chapterCount">;
  badge?: string;
}) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group block w-[150px] shrink-0 sm:w-[168px]"
      aria-label={series.titleAr}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-[0_12px_32px_-12px_rgba(155,123,255,0.35)]">
        <Image
          src={series.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
          alt={`غلاف ${series.titleAr}`}
          fill
          sizes="168px"
          className="object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          {badge ? (
            <span className="rounded-md bg-background/80 px-2 py-0.5 text-[11px] font-medium text-gold backdrop-blur">
              {badge}
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[11px] font-semibold text-gold backdrop-blur">
            <Star className="size-3 fill-gold text-gold" aria-hidden />
            {series.ratingAvg.toFixed(1)}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-2 pt-8">
          <span className="text-[11px] text-muted-foreground">{series.chapterCount} فصلًا</span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium text-foreground transition group-hover:text-primary">
        {series.titleAr}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
        {series.genres.slice(0, 2).join(" · ")}
      </p>
    </Link>
  );
}

export function SeriesMetaBadges({
  format,
  status,
}: {
  format: Format;
  status: SeriesStatus;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/25 border">
        {FORMAT_LABELS[format]}
      </Badge>
      <Badge variant="secondary" className="border border-border bg-accent text-muted-foreground">
        {STATUS_LABELS[status]}
      </Badge>
    </div>
  );
}

export function Rail({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10" aria-label={title}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-foreground sm:text-xl">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-muted-foreground transition hover:text-primary">
            عرض الكل ←
          </Link>
        )}
      </div>
      <div className="scrollbar-none -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6" role="list">
        {children}
      </div>
    </section>
  );
}

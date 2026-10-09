"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readAllLocal, type LocalProgress } from "@/lib/progress-local";
import type { ContinueReadingItem, SeriesCard } from "@/lib/queries";
import { readerHref } from "@/lib/reader-route";

/**
 * Compact resume hero (docs/DECISIONS.md D-01, visual-direction.md).
 * Returning reader: actual progress and latest position.
 * Guest / no progress: real guest featured work with "ابدأ القراءة" (no fake progress).
 */
export function ContinueReadingHero({
  initialItems,
  guestFeatured,
}: {
  initialItems: ContinueReadingItem[];
  guestFeatured?: SeriesCard | null;
}) {
  const { status } = useSession();
  const [localItems, setLocalItems] = useState<ContinueReadingItem[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const local = readAllLocal().filter(p => p.percent > 0 && p.percent < 100);
    if (!local.length) return;
    fetch("/api/reading-targets", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ targets: local.map(p => ({ seriesSlug: p.seriesSlug, chapterNumber: p.chapterNumber, format: p.format })) }),
    }).then(response => response.ok ? response.json() : { readable: [] })
      .then(({ readable }: { readable: Omit<ContinueReadingItem, "percent" | "updatedAt">[] }) => {
        if (controller.signal.aborted) return;
        const valid = local.flatMap((p: LocalProgress) => {
          const target = readable.find(t => t.seriesSlug === p.seriesSlug && t.chapterNumber === p.chapterNumber && t.format === p.format);
          return target ? [{ ...target, percent: p.percent, updatedAt: new Date(p.updatedAt) }] : [];
        });
        setLocalItems(valid);
      }).catch(() => {});
    return () => controller.abort();
  }, []);

  const items = useMemo(() => {
    const merged = new Map<string, ContinueReadingItem>();
    for (const it of [...initialItems, ...localItems]) {
      const prev = merged.get(it.seriesSlug);
      if (!prev || it.updatedAt > prev.updatedAt) merged.set(it.seriesSlug, it);
    }
    return [...merged.values()].slice(0, 3);
  }, [initialItems, localItems]);

  const loading = status === "loading";
  const hero = items[0];
  const rest = items.slice(1);

  return (
    <section className="pt-4 sm:pt-6" aria-label="وحدة القراءة الرئيسية">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {loading ? (
          <div className="h-48 sm:h-56 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60" />
        ) : hero ? (
          /* Returning reader with actual progress */
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#191C25] shadow-xl">
            <div className="flex items-stretch">
              {/* Cover Art Visual */}
              <div className="relative w-24 sm:w-36 md:w-5/12 lg:w-1/2 shrink-0 overflow-hidden">
                <Image
                  src={hero.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                  alt={`غلاف ${hero.seriesTitle}`}
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#191C25] via-transparent to-transparent md:hidden" />
                <div className="hidden md:block absolute inset-0 bg-gradient-to-s from-[#191C25] via-transparent to-transparent rtl:bg-gradient-to-l ltr:bg-gradient-to-r" />
              </div>

              {/* Progress Content */}
              <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-7 md:p-8">
                <span className="text-xs font-semibold text-primary">
                  كمّل القراءة
                </span>

                <h1 className="mt-1.5 line-clamp-2 text-lg sm:text-2xl lg:text-3xl font-extrabold text-foreground">
                  {hero.seriesTitle}
                </h1>

                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  الفصل {hero.chapterNumber}
                  {hero.chapterTitle ? ` · ${hero.chapterTitle}` : ""}
                </p>

                {/* Actual Progress Bar */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground/90 shrink-0">
                    {Math.round(hero.percent)}٪
                  </span>
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary/80">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.max(5, Math.min(100, hero.percent))}%` }}
                    />
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 bg-primary px-6 text-primary-foreground shadow-[0_8px_24px_-8px_rgba(180,151,239,0.6)] hover:bg-primary/90"
                  >
                    <Link href={readerHref(hero.format, hero.seriesSlug, hero.chapterNumber)}>
                      <Play className="size-4 fill-current" aria-hidden />
                      <span>كمّل القراءة</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional In-Progress Items */}
            {rest.length > 0 && (
              <div className="border-t border-border/50 bg-black/20 p-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-muted-foreground font-medium">أعمال أخرى تتابعها:</span>
                  {rest.map((it) => (
                    <Link
                      key={it.seriesSlug}
                      href={readerHref(it.format, it.seriesSlug, it.chapterNumber)}
                      className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-foreground transition hover:border-primary/50 hover:text-primary"
                    >
                      <span className="truncate max-w-[140px] font-medium">{it.seriesTitle}</span>
                      <span className="text-[11px] text-muted-foreground">فصل {it.chapterNumber} ({Math.round(it.percent)}٪)</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : guestFeatured ? (
          /* Guest reader / no progress: real guest featured work */
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#191C25] shadow-xl">
            <div className="flex items-stretch">
              <div className="relative w-24 sm:w-36 md:w-5/12 lg:w-1/2 shrink-0 overflow-hidden">
                <Image
                  src={guestFeatured.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                  alt={`غلاف ${guestFeatured.titleAr}`}
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#191C25] via-transparent to-transparent md:hidden" />
                <div className="hidden md:block absolute inset-0 bg-gradient-to-s from-[#191C25] via-transparent to-transparent rtl:bg-gradient-to-l ltr:bg-gradient-to-r" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-7 md:p-8">
                <span className="text-xs font-semibold text-primary">
                  اختيار مميز للقراءة
                </span>

                <h1 className="mt-1.5 line-clamp-2 text-lg sm:text-2xl lg:text-3xl font-extrabold text-foreground">
                  {guestFeatured.titleAr}
                </h1>

                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  {guestFeatured.genres.slice(0, 3).join(" · ")} · {guestFeatured.chapterCount} فصلاً
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 bg-primary px-6 text-primary-foreground shadow-[0_8px_24px_-8px_rgba(180,151,239,0.6)] hover:bg-primary/90"
                  >
                    <Link href={`/series/${guestFeatured.slug}`}>
                      <Play className="size-4 fill-current" aria-hidden />
                      <span>ابدأ القراءة</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="lg" className="border-border/80">
                    <Link href="/explore">
                      <Sparkles className="size-4 me-1.5 text-gold" aria-hidden />
                      <span>استكشف المزيد</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback clean compact invitation */
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/70 bg-[#191C25] p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                مكتبة باني — تجربة قراءة عربية هادئة
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                اكتشف الأعمال المصورة والروايات، واختر قراءتك القادمة.
              </p>
            </div>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/explore">
                <Sparkles className="size-4 me-1.5" aria-hidden />
                <span>استكشف المكتبة</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

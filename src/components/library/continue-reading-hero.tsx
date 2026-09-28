"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Clock3, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readAllLocal, type LocalProgress } from "@/lib/progress-local";
import type { ContinueReadingItem } from "@/lib/queries";

/**
 * Continue Reading hero — the reader-first core (docs/DECISIONS.md D-01/D-25).
 * Signed-in: server progress arrives as initialItems; guest/local: localStorage mirror.
 * Most recently updated item across both sources wins.
 */
export function ContinueReadingHero({ initialItems }: { initialItems: ContinueReadingItem[] }) {
  const { status } = useSession();
  // Lazy client-only read: while the session status is "loading" we render the skeleton,
  // so reading localStorage in the initializer is hydration-safe and avoids
  // setState-in-effect cascades.
  const [localItems] = useState<ContinueReadingItem[]>(() => {
    if (typeof window === "undefined") return [];
    return readAllLocal()
      .filter((p) => p.percent > 0 && p.percent < 100)
      .map((p: LocalProgress) => ({
        seriesSlug: p.seriesSlug,
        seriesTitle: p.seriesTitle,
        coverPath: p.coverPath,
        accent: p.accent,
        format: p.format,
        chapterNumber: p.chapterNumber,
        chapterTitle: p.chapterTitle,
        percent: p.percent,
        updatedAt: new Date(p.updatedAt),
      }));
  });

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
    <section className="bg-library-glow border-b border-border/50" aria-label="تابع القراءة">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="size-4 text-primary" aria-hidden />
          <span>تابع القراءة</span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-52 w-full animate-pulse rounded-2xl bg-accent/70 sm:h-64 sm:w-[420px]" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-7 w-2/3 animate-pulse rounded-lg bg-accent/70" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-accent/70" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-accent/70" />
              <div className="h-11 w-44 animate-pulse rounded-xl bg-accent/70" />
            </div>
          </div>
        ) : hero ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Link
              href={`/read/${hero.format}/${hero.seriesSlug}/${hero.chapterNumber}`}
              className="group relative block w-full overflow-hidden rounded-2xl border border-border/70 shadow-lg sm:w-[280px] shrink-0"
            >
              <div className="relative aspect-[16/10] w-full sm:aspect-[4/3]">
                <Image
                  src={hero.coverPath}
                  alt={`غلاف ${hero.seriesTitle}`}
                  fill
                  sizes="280px"
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
                <div className="absolute bottom-3 start-3 end-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, Math.min(100, hero.percent))}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-foreground/90">تقدمك {Math.round(hero.percent)}٪</p>
                </div>
              </div>
            </Link>

            <div className="min-w-0">
              <p className="text-xs text-gold">الفصل {hero.chapterNumber} · {hero.chapterTitle}</p>
              <h1 className="mt-1.5 truncate text-2xl font-bold text-foreground sm:text-3xl">
                {hero.seriesTitle}
              </h1>
              <p className="mt-2 line-clamp-2 max-w-md text-sm leading-7 text-muted-foreground">
                وصلت إلى {Math.round(hero.percent)}٪ من هذا الفصل. بابُك ما زال مفتوحًا حيث تركته.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-4 gap-2 bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(155,123,255,0.6)] hover:bg-primary/90"
              >
                <Link href={`/read/${hero.format}/${hero.seriesSlug}/${hero.chapterNumber}`}>
                  <Play className="size-4 fill-current" aria-hidden />
                  تابع القراءة
                </Link>
              </Button>
            </div>

            {rest.length > 0 && (
              <ul className="w-full space-y-2 sm:ms-4 sm:w-auto sm:min-w-56 lg:border-s lg:border-border/60 lg:ps-6" aria-label="قائمة المتابعة">
                {rest.map((it) => (
                  <li key={it.seriesSlug}>
                    <Link
                      href={`/read/${it.format}/${it.seriesSlug}/${it.chapterNumber}`}
                      className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-border hover:bg-accent/50"
                    >
                      <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg border border-border/60">
                        <Image src={it.coverPath} alt="" fill sizes="48px" className="object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{it.seriesTitle}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          الفصل {it.chapterNumber} · {Math.round(it.percent)}٪
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                ليلة هادئة… وقائمة تنتظر
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
                ابدأ أول فصل لك في مكتبة باني، وسنجدك هنا في كل مرة تعود — حيث توقفت بالضبط.
              </p>
            </div>
            <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/explore">
                <Sparkles className="size-4" aria-hidden />
                ابدأ من الاستكشاف
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LibraryButton } from "@/components/library/library-button";
import { ShareButton } from "@/components/library/share-button";
import { readLocal } from "@/lib/progress-local";
import { useHydrated } from "@/lib/use-hydrated";
import { readerHref } from "@/lib/reader-route";
import type { Format, Shelf } from "@/lib/constants";

type ChapterLite = { number: number; isPremiumDemo: boolean };

export function WorkHeroActions({
  slug,
  format,
  serverProgress,
  chapters,
  titleAr,
  initialShelf,
}: {
  slug: string;
  format: Format;
  serverProgress: { chapterNumber: number; pageIndex: number; percent: number } | null;
  chapters: ChapterLite[];
  titleAr: string;
  initialShelf: Shelf | null;
}) {
  const { status } = useSession();
  const mounted = useHydrated();
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowSticky(window.scrollY > 320);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const target = useMemo(() => {
    let p = serverProgress;
    if (!p && mounted && typeof window !== "undefined") {
      const local = readLocal(slug);
      if (local && local.format === format && local.percent > 0 && local.percent < 100) {
        p = { chapterNumber: local.chapterNumber, pageIndex: local.pageIndex, percent: local.percent };
      }
    }
    const resumeChapter = p && p.percent > 0 && p.percent < 100
      ? chapters.find((c) => c.number === p!.chapterNumber && !c.isPremiumDemo)
      : null;
    if (p && resumeChapter) {
      const ch = resumeChapter;
      const chNum = ch?.number ?? 1;
      return {
        chapter: chNum,
        label: `كمل الفصل ${chNum}`,
        resuming: true,
        percent: p.percent,
      };
    }
    const first = chapters.find((c) => !c.isPremiumDemo) ?? chapters[0];
    return {
      chapter: first?.number ?? 1,
      label: "ابدأ القراءة",
      resuming: false,
      percent: 0,
    };
  }, [chapters, mounted, serverProgress, slug, format]);

  if (!chapters.length) {
    return <div className="space-y-3">
      <p className="text-sm text-muted-foreground">الفصول تُنشر قريبًا. أضف العمل لمكتبتك لمتابعته.</p>
      <div className="flex gap-2"><LibraryButton slug={slug} initialShelf={initialShelf} /><ShareButton slug={slug} titleAr={titleAr} /></div>
    </div>;
  }
  const primaryHref = readerHref(format, slug, target.chapter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          asChild
          size="lg"
          className="h-11 gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-[0_4px_20px_-4px_rgba(180,151,239,0.5)] transition hover:bg-primary/90"
        >
          <Link href={primaryHref}>
            {target.resuming ? (
              <BookOpen className="size-4.5" aria-hidden />
            ) : (
              <Play className="size-4.5 fill-current" aria-hidden />
            )}
            <span>{target.label}</span>
            {target.resuming && (
              <span className="text-xs font-semibold opacity-85">({Math.round(target.percent)}٪)</span>
            )}
          </Link>
        </Button>

        <LibraryButton slug={slug} initialShelf={initialShelf} />
        <ShareButton slug={slug} titleAr={titleAr} />
      </div>

      {status === "unauthenticated" && (
        <p className="text-xs text-muted-foreground">
          تقرأ كزائر — يُحفظ تقدمك على هذا الجهاز.{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            سجّل الدخول
          </Link>{" "}
          لمزامنة القراءة عبر أجهزتك.
        </p>
      )}

      {/* Compact sticky resume bar for mobile */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-border/70 bg-background/95 p-3 backdrop-blur-md transition-all duration-200 sm:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">{titleAr}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {target.resuming ? `الفصل ${target.chapter} (${Math.round(target.percent)}٪)` : "ابدأ القراءة الآن"}
            </p>
          </div>
          <Button asChild size="sm" className="h-9 shrink-0 gap-1.5 rounded-lg bg-primary px-4 font-bold text-primary-foreground">
            <Link href={primaryHref}>
              {target.resuming ? <BookOpen className="size-4" /> : <Play className="size-4 fill-current" />}
              <span>{target.label}</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

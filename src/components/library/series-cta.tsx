"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Lock, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readLocal } from "@/lib/progress-local";

type ChapterLite = { number: number; isPremiumDemo: boolean };

export function SeriesCTA({
  slug,
  format,
  serverProgress,
  chapters,
  titleAr,
}: {
  slug: string;
  format: "manga" | "webtoon";
  serverProgress: { chapterNumber: number; pageIndex: number; percent: number } | null;
  chapters: ChapterLite[];
  titleAr: string;
}) {
  const { status } = useSession();
  const target = useMemo(() => {
    // DB progress (signed-in) wins; otherwise the localStorage mirror.
    let p = serverProgress;
    if (!p && typeof window !== "undefined") {
      const local = readLocal(slug);
      if (local && local.percent > 0 && local.percent < 100) {
        p = { chapterNumber: local.chapterNumber, pageIndex: local.pageIndex, percent: local.percent };
      }
    }
    if (p) {
      const ch = chapters.find((c) => c.number === p!.chapterNumber && !c.isPremiumDemo) ?? chapters[0];
      return { chapter: ch?.number ?? 1, label: "تابع القراءة", resuming: true, percent: p.percent };
    }
    const first = chapters.find((c) => !c.isPremiumDemo) ?? chapters[0];
    return { chapter: first?.number ?? 1, label: "ابدأ القراءة", resuming: false, percent: 0 };
  }, [chapters, serverProgress, slug]);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button
        asChild
        size="lg"
        className="gap-2 bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(155,123,255,0.6)] hover:bg-primary/90"
      >
        <Link href={`/read/${format}/${slug}/${target.chapter}`}>
          {target.resuming ? <BookOpen className="size-4" aria-hidden /> : <Play className="size-4 fill-current" aria-hidden />}
          {target.label}
          {target.resuming && <span className="text-xs opacity-80">({Math.round(target.percent)}٪)</span>}
        </Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        disabled
        className="gap-2 border-border text-muted-foreground"
        title="ميزة المكتبة الشخصية قادمة في الإصدار التجريبي القادم"
      >
        <Plus className="size-4" aria-hidden />
        أضف إلى مكتبتي
        <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">قريبًا</span>
      </Button>

      {status === "unauthenticated" && (
        <p className="w-full text-xs text-muted-foreground">
          تقرأ كزائر — يُحفظ تقدمك على هذا الجهاز.{" "}
          <Link href="/login" className="text-primary hover:underline">
            سجّل الدخول
          </Link>{" "}
          لمزامنة القراءة لاحقًا.
        </p>
      )}
      <span className="sr-only">{titleAr}</span>
      <span className="hidden" aria-hidden><Lock /></span>
    </div>
  );
}

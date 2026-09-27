"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readLocal } from "@/lib/progress-local";
import type { Format } from "@/lib/constants";

type ChapterLite = { number: number; isPremiumDemo: boolean };

export function SeriesCTA({
  slug,
  format,
  serverProgress,
  chapters,
  titleAr,
  children,
}: {
  slug: string;
  format: Format;
  serverProgress: { chapterNumber: number; pageIndex: number; percent: number } | null;
  chapters: ChapterLite[];
  titleAr: string;
  children?: React.ReactNode;
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

      {children}

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
    </div>
  );
}

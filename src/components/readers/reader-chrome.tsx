"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ChevronLeft, Maximize, Minimize, X, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LockedChapterPanel({
  seriesSlug,
  seriesTitle,
  format,
}: {
  seriesSlug: string;
  seriesTitle: string;
  format: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="grid size-16 place-items-center rounded-2xl border border-gold/40 bg-gold/10 text-gold">
        <Lock className="size-7" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-bold text-foreground">فصل تجريبي مقفل</h2>
      <p className="mt-2 max-w-md text-sm leading-8 text-muted-foreground">
        هذا الفصل جزء من عرض المكتبة التجريبي القادم، وقراءته غير متاحة حاليًا. لا توجد أي عملية شراء هنا —
        إنه مجرد عرض لشكل «الفصول المميزة» في المنتج الكامل.
      </p>
      <div className="mt-6 flex gap-2.5">
        <Button asChild variant="outline" className="gap-2 border-border">
          <Link href={`/series/${seriesSlug}`}>
            <X className="size-4" aria-hidden />
            العودة إلى العمل
          </Link>
        </Button>
        <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/explore">
            <BookOpen className="size-4" aria-hidden />
            تصفّح أعمالًا أخرى
          </Link>
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground/70">{seriesTitle} · عرض تجريبي</p>
      <span className="hidden">{format}</span>
    </div>
  );
}

export function ReaderChrome({
  seriesSlug,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  format,
  percent,
  immersive,
  onToggleImmersive,
  headerExtra,
  children,
}: {
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  format: string;
  percent: number;
  immersive: boolean;
  onToggleImmersive: () => void;
  /** Optional reader controls rendered in the header row (comments, etc.). */
  headerExtra?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-md transition-transform duration-300 ${
          immersive ? "-translate-y-full" : ""
        }`}
      >
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-3 sm:px-4">
          <Button asChild variant="ghost" size="icon" className="size-9 text-muted-foreground" aria-label="عودة إلى العمل">
            <Link href={`/series/${seriesSlug}`}>
              <ChevronRight className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-medium text-foreground">{seriesTitle}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              الفصل {chapterNumber} · {chapterTitle}
            </p>
          </div>
          {headerExtra}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground"
            onClick={onToggleImmersive}
            aria-label={immersive ? "إظهار أدوات القراءة" : "وضع القراءة العميقة"}
            title={immersive ? "إظهار الأدوات" : "وضع القراءة العميقة"}
          >
            {immersive ? <Minimize className="size-4.5" /> : <Maximize className="size-4.5" />}
          </Button>
        </div>
        <div className="h-1 w-full bg-accent/60">
          <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
      </header>

      {children}

      {/* تلميح وضع القراءة العميقة */}
      {immersive && (
        <button
          onClick={onToggleImmersive}
          className="fixed end-3 top-3 z-40 rounded-full border border-border/50 bg-background/80 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur transition hover:text-foreground"
          aria-label="إظهار أدوات القراءة"
        >
          إظهار الأدوات
        </button>
      )}
      <span className="sr-only">{format}</span>
      <span className="hidden"><ChevronLeft /></span>
    </>
  );
}

export function ChapterEndCard({
  seriesSlug,
  format,
  seriesTitle,
  next,
  prev,
  chapterNumber,
}: {
  seriesSlug: string;
  format: string;
  seriesTitle: string;
  next: { number: number; isPremiumDemo: boolean } | null;
  prev: { number: number; isPremiumDemo: boolean } | null;
  chapterNumber: number;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 text-center">
      <p className="text-xs text-gold">انتهى الفصل {chapterNumber}</p>
      <h2 className="mt-1.5 text-xl font-bold text-foreground">{seriesTitle}</h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        {next ? "الفصل التالي بانتظارك." : "هذا أحدث فصل منشور حتى الآن — عد قريبًا لمتابعة القصة."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {prev && (
          <Button asChild variant="outline" className="gap-2 border-border">
            <Link href={`/read/${format}/${seriesSlug}/${prev.number}`}>الفصل السابق ({prev.number})</Link>
          </Button>
        )}
        {next && !next.isPremiumDemo && (
          <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href={`/read/${format}/${seriesSlug}/${next.number}`}>
              الفصل التالي ({next.number})
            </Link>
          </Button>
        )}
        {next?.isPremiumDemo && (
          <Button asChild variant="outline" className="gap-2 border-gold/40 text-gold">
            <Link href={`/read/${format}/${seriesSlug}/${next.number}`}>
              <Lock className="size-4" aria-hidden />
              الفصل التالي — مقفل
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="text-muted-foreground">
          <Link href={`/series/${seriesSlug}`}>كل الفصول</Link>
        </Button>
      </div>
    </div>
  );
}

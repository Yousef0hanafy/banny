"use client";

import Link from "next/link";
import { ChevronRight, ChevronLeft, Maximize, Minimize, X, Lock, BookOpen, List } from "lucide-react";
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
      <span className="grid size-16 place-items-center rounded-2xl border border-gold/40 bg-gold/10 text-gold shadow-lg">
        <Lock className="size-7" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-bold text-foreground">فصل تجريبي مقفل</h2>
      <p className="mt-2 max-w-md text-sm leading-8 text-muted-foreground">
        هذا الفصل جزء من عرض المكتبة التجريبي القادم، وقراءته غير متاحة حاليًا. لا توجد أي عملية شراء هنا —
        إنه مجرد عرض لشكل «الفصول المميزة» في المنتج الكامل.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <Button asChild variant="outline" className="gap-2 rounded-xl border-border/80">
          <Link href={`/series/${seriesSlug}`}>
            <X className="size-4" aria-hidden />
            العودة إلى العمل
          </Link>
        </Button>
        <Button asChild className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
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
  headerExtra?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      {/* Top Header Chrome */}
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-[#101217]/90 backdrop-blur-md transition-transform duration-300 ${
          immersive ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex h-13 max-w-4xl items-center gap-2 px-3 sm:h-14 sm:px-4">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="عودة إلى العمل"
          >
            <Link href={`/series/${seriesSlug}`}>
              <ChevronRight className="size-5" />
            </Link>
          </Button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xs font-bold text-foreground sm:text-sm">{seriesTitle}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              الفصل {chapterNumber} · {chapterTitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {headerExtra}

            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onToggleImmersive}
              aria-label={immersive ? "إظهار أدوات القراءة" : "وضع القراءة العميقة"}
              title={immersive ? "إظهار الأدوات" : "وضع القراءة العميقة"}
            >
              {immersive ? <Minimize className="size-4.5" /> : <Maximize className="size-4.5" />}
            </Button>
          </div>
        </div>

        {/* Header Progress Track */}
        <div className="h-0.5 w-full bg-border/40">
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      {children}

      {/* Floating Pill when Immersive (Focus) Mode is Active */}
      {immersive && (
        <button
          onClick={onToggleImmersive}
          className="fixed end-3 top-3 z-40 rounded-full border border-border/60 bg-[#191C25]/90 px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground backdrop-blur-md shadow-lg transition hover:text-foreground"
          aria-label="إظهار أدوات القراءة"
        >
          إظهار أدوات القراءة
        </button>
      )}

      <span className="sr-only">{format}</span>
      <span className="hidden"><ChevronLeft /></span>
    </>
  );
}

/**
 * Floating compact chapter navigation pill (approved concept)
 * Fixed at the bottom center of the reader, hidden during focus/immersive mode.
 * Styled with charcoal/violet tokens and never obstructs page content.
 */
export function ReaderFloatingBar({
  seriesSlug,
  chapterNumber,
  format,
  percent,
  prev,
  next,
  immersive,
}: {
  seriesSlug: string;
  chapterNumber: number;
  format: string;
  percent: number;
  prev: { number: number; isPremiumDemo: boolean } | null;
  next: { number: number; isPremiumDemo: boolean } | null;
  immersive: boolean;
}) {
  return (
    <div
      className={`fixed bottom-4 inset-x-0 z-30 mx-auto w-fit max-w-[90vw] transition-transform duration-300 ${
        immersive ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
      aria-label="شريط أدوات القارئ السريع"
    >
      <div className="flex flex-col items-center rounded-2xl border border-border/70 bg-[#191C25]/90 px-3.5 py-2 backdrop-blur-md shadow-2xl sm:px-4">
        <div className="flex items-center gap-3">
          {prev ? (
            <Link
              href={`/read/${format}/${seriesSlug}/${prev.number}`}
              className="flex min-h-11 sm:min-h-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-foreground/80 transition hover:bg-secondary/60 hover:text-foreground"
              title={`الفصل السابق (${prev.number})`}
            >
              <ChevronRight className="size-4" />
              <span>السابق</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground/35 cursor-not-allowed">
              <ChevronRight className="size-4" />
              <span>السابق</span>
            </span>
          )}

          <Link
            href={`/series/${seriesSlug}`}
            className="flex min-h-11 sm:min-h-0 items-center gap-1.5 rounded-xl border border-border/50 bg-secondary/50 px-3 py-1 text-xs font-bold text-foreground transition hover:bg-secondary hover:text-primary"
            title="الانتقال إلى قائمة الفصول"
          >
            <List className="size-3.5 text-muted-foreground" />
            <span>الفصل {chapterNumber}</span>
          </Link>

          {next && !next.isPremiumDemo ? (
            <Link
              href={`/read/${format}/${seriesSlug}/${next.number}`}
              className="flex min-h-11 sm:min-h-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-foreground/80 transition hover:bg-secondary/60 hover:text-foreground"
              title={`الفصل التالي (${next.number})`}
            >
              <span>التالي</span>
              <ChevronLeft className="size-4" />
            </Link>
          ) : next?.isPremiumDemo ? (
            <Link
              href={`/read/${format}/${seriesSlug}/${next.number}`}
              className="flex min-h-11 sm:min-h-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-gold/90 transition hover:bg-gold/10"
              title="الفصل التالي (مقفل)"
            >
              <span>التالي</span>
              <Lock className="size-3 text-gold" />
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground/35 cursor-not-allowed">
              <span>التالي</span>
              <ChevronLeft className="size-4" />
            </span>
          )}
        </div>

        {/* Mini progress line & percentage */}
        <div className="mt-1.5 flex w-full items-center gap-2 px-1">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/50">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground">{Math.round(percent)}%</span>
        </div>
      </div>
    </div>
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
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 shadow-xl">
        <p className="text-xs font-semibold text-gold">انتهى الفصل {chapterNumber}</p>
        <h2 className="mt-1.5 text-xl font-bold text-foreground">{seriesTitle}</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {next ? "الفصل التالي بانتظارك." : "هذا أحدث فصل منشور حتى الآن — عد قريبًا لمتابعة القصة."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {prev && (
            <Button asChild variant="outline" className="gap-2 rounded-xl border-border/80">
              <Link href={`/read/${format}/${seriesSlug}/${prev.number}`}>
                الفصل السابق ({prev.number})
              </Link>
            </Button>
          )}
          {next && !next.isPremiumDemo && (
            <Button asChild className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              <Link href={`/read/${format}/${seriesSlug}/${next.number}`}>
                الفصل التالي ({next.number})
              </Link>
            </Button>
          )}
          {next?.isPremiumDemo && (
            <Button asChild variant="outline" className="gap-2 rounded-xl border-gold/40 text-gold hover:bg-gold/10">
              <Link href={`/read/${format}/${seriesSlug}/${next.number}`}>
                <Lock className="size-4" aria-hidden />
                الفصل التالي — مقفل
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" className="rounded-xl text-muted-foreground hover:text-foreground">
            <Link href={`/series/${seriesSlug}`}>كل الفصول</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

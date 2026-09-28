"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ReaderChrome, ChapterEndCard, LockedChapterPanel } from "@/components/readers/reader-chrome";
import { ChapterCommentsDialog } from "@/components/community/chapter-comments-dialog";
import { saveReadingProgress } from "@/lib/actions";
import { writeLocal } from "@/lib/progress-local";
import type { CommentView } from "@/lib/queries";

type NovelTheme = "dark" | "sepia" | "light";

const THEME_CLASSES: Record<NovelTheme, { page: string; title: string; body: string; line: string }> = {
  dark: {
    page: "bg-background text-foreground",
    title: "text-foreground",
    body: "text-foreground/90",
    line: "border-white/10",
  },
  sepia: {
    page: "bg-[#F3E7D3] text-[#433422]",
    title: "text-[#3A2D1C]",
    body: "text-[#4A3A26]",
    line: "border-[#433422]/15",
  },
  light: {
    page: "bg-white text-neutral-900",
    title: "text-neutral-900",
    body: "text-neutral-800",
    line: "border-black/10",
  },
};

const FONT_KEY = "bunny.novel.fontSize.v1";
const THEME_KEY = "bunny.novel.theme.v1";

/**
 * Novel reader (Release B): clean RTL prose, font-size + paper-theme controls
 * (persisted per device), throttled scroll progress via the shared pipeline.
 */
export function NovelReader({
  seriesSlug,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  paragraphs,
  isPremiumDemo,
  comments = [],
  next,
  prev,
}: {
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  paragraphs: string[];
  isPremiumDemo: boolean;
  comments?: CommentView[];
  next: { number: number; isPremiumDemo: boolean } | null;
  prev: { number: number; isPremiumDemo: boolean } | null;
}) {
  const { status } = useSession();
  const [immersive, setImmersive] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<NovelTheme>("dark");
  const [percent, setPercent] = useState(0);
  const lastSaved = useRef(0);
  const savedStart = useRef(false);

  useEffect(() => {
    // restore per-device prefs after mount (async to avoid cascading render lint)
    const raf = requestAnimationFrame(() => {
      const fs = Number(window.localStorage.getItem(FONT_KEY));
      if (fs >= 15 && fs <= 30) setFontSize(fs);
      const t = window.localStorage.getItem(THEME_KEY);
      if (t === "dark" || t === "sepia" || t === "light") setTheme(t);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const applyFont = (v: number) => {
    const clamped = Math.min(30, Math.max(15, v));
    setFontSize(clamped);
    window.localStorage.setItem(FONT_KEY, String(clamped));
  };
  const applyTheme = (t: NovelTheme) => {
    setTheme(t);
    window.localStorage.setItem(THEME_KEY, t);
  };

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 100;
      setPercent(p);
      const now = Date.now();
      if (now - lastSaved.current > 2500 && p > 0) {
        lastSaved.current = now;
        writeLocal({
          seriesSlug,
          seriesTitle,
          chapterNumber,
          chapterTitle,
          pageIndex: 0,
          percent: p,
          total: paragraphs.length,
          format: "novel",
          coverPath: "",
          accent: "",
        });
        if (status === "authenticated") {
          saveReadingProgress({
            seriesSlug,
            chapterNumber,
            pageIndex: 0,
            percent: p,
            completed: p >= 99,
          }).catch(() => {});
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapterNumber, paragraphs.length, seriesSlug, seriesTitle, status, chapterTitle]);

  useEffect(() => {
    if (savedStart.current) return;
    savedStart.current = true;
    writeLocal({
      seriesSlug,
      seriesTitle,
      chapterNumber,
      chapterTitle,
      pageIndex: 0,
      percent: 1,
      total: paragraphs.length,
      format: "novel",
      coverPath: "",
      accent: "",
    });
  }, [chapterNumber, paragraphs.length, seriesSlug, seriesTitle, chapterTitle]);

  if (isPremiumDemo) {
    return <LockedChapterPanel seriesSlug={seriesSlug} seriesTitle={seriesTitle} format="novel" />;
  }

  const t = THEME_CLASSES[theme];

  return (
    <div className={`min-h-screen transition-colors ${t.page}`}>
      <ReaderChrome
        seriesSlug={seriesSlug}
        seriesTitle={seriesTitle}
        chapterNumber={chapterNumber}
        chapterTitle={chapterTitle}
        format="novel"
        percent={percent}
        immersive={immersive}
        onToggleImmersive={() => setImmersive((v) => !v)}
        headerExtra={
          <ChapterCommentsDialog
            seriesSlug={seriesSlug}
            seriesTitle={seriesTitle}
            chapterNumber={chapterNumber}
            comments={comments}
          />
        }
      >
        {/* novel-specific controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => applyFont(fontSize - 1)}
            className="grid size-7 place-items-center rounded-md border border-border text-xs font-bold hover:bg-accent"
            aria-label="تصغير الخط"
          >
            أ−
          </button>
          <span className="w-7 text-center text-[11px] text-muted-foreground" aria-live="polite">{fontSize}</span>
          <button
            onClick={() => applyFont(fontSize + 1)}
            className="grid size-7 place-items-center rounded-md border border-border text-xs font-bold hover:bg-accent"
            aria-label="تكبير الخط"
          >
            أ+
          </button>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          {(["dark", "sepia", "light"] as NovelTheme[]).map((th) => (
            <button
              key={th}
              onClick={() => applyTheme(th)}
              className={`size-5 rounded-full border transition ${
                th === "dark" ? "bg-neutral-900" : th === "sepia" ? "bg-[#F3E7D3]" : "bg-white"
              } ${theme === th ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
              aria-label={th === "dark" ? "سمة داكنة" : th === "sepia" ? "سمة ورقية" : "سمة فاتحة"}
              aria-pressed={theme === th}
            />
          ))}
        </div>
      </ReaderChrome>

      <main className="pt-20" aria-label="نص الفصل">
        <article className="mx-auto max-w-[42rem] px-5 pb-16">
          <header className={`mb-8 border-b pb-5 text-center ${t.line}`}>
            <p className="text-xs text-muted-foreground">{seriesTitle}</p>
            <h1 className={`mt-1.5 text-2xl font-bold ${t.title}`}>الفصل {chapterNumber}: {chapterTitle}</h1>
          </header>
          <div
            className="space-y-6 leading-[2.2]"
            style={{ fontSize: `${fontSize}px` }}
          >
            {paragraphs.map((p, i) => (
              <p key={i} className={`${t.body} text-balance-ar`}>
                {p}
              </p>
            ))}
          </div>
          <div className={`mt-12 rounded-xl border p-4 text-center text-sm ${t.line} ${t.body}`}>
            — نهاية الفصل {chapterNumber} —
          </div>
        </article>
      </main>

      <div className="bg-background pb-10">
        <ChapterEndCard
          seriesSlug={seriesSlug}
          format="novel"
          seriesTitle={seriesTitle}
          next={next}
          prev={prev}
          chapterNumber={chapterNumber}
        />
      </div>
    </div>
  );
}

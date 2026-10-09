"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ReaderChrome, ChapterEndCard, LockedChapterPanel, ReaderFloatingBar } from "@/components/readers/reader-chrome";
import { CommentsSection } from "@/components/community/comments-section";
import { saveReadingProgress } from "@/lib/actions";
import { readChapterLocal, writeLocal } from "@/lib/progress-local";
import { restoreReaderScroll, selectReaderProgress, type ReaderProgress } from "@/lib/reader-progress";
import type { CommentView } from "@/lib/queries";

type Panel = { id: string; pageIndex: number; imagePath: string; width: number; height: number };

export function WebtoonReader({
  seriesSlug,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  panels,
  isPremiumDemo,
  comments = [],
  initialProgress = null,
  next,
  prev,
}: {
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  panels: Panel[];
  isPremiumDemo: boolean;
  comments?: CommentView[];
  initialProgress?: ReaderProgress | null;
  next: { number: number; isPremiumDemo: boolean } | null;
  prev: { number: number; isPremiumDemo: boolean } | null;
}) {
  const { status } = useSession();
  const [immersive, setImmersive] = useState(false);
  const [percent, setPercent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSaved = useRef(0);
  const [restored, setRestored] = useState(false);
  const actualPercent = useRef(0);
  const mirrorInitialized = useRef(false);

  useEffect(() => {
    if (!restored || isPremiumDemo || !panels.length) return;
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 100;
      setPercent(p);
      actualPercent.current = p;
      if (status === "loading" || !mirrorInitialized.current) return;

      const now = Date.now();
      if (now - lastSaved.current > 2500 && p - 0 > 0) {
        lastSaved.current = now;
        writeLocal({
          seriesSlug,
          seriesTitle,
          chapterNumber,
          chapterTitle,
          pageIndex: 0,
          percent: p,
          total: panels.length,
          format: "webtoon",
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
  }, [chapterNumber, panels.length, seriesSlug, seriesTitle, status, chapterTitle, isPremiumDemo, restored]);

  useEffect(() => {
    if (restored || isPremiumDemo || !panels.length) return;
    const progress = selectReaderProgress(readChapterLocal(seriesSlug, chapterNumber, "webtoon"), initialProgress);
    return restoreReaderScroll(progress?.percent ?? 0, (actual) => {
      setPercent(actual);
      actualPercent.current = actual;
      setRestored(true);
    });
  }, [chapterNumber, initialProgress, isPremiumDemo, panels.length, seriesSlug, restored]);

  useEffect(() => {
    if (!restored || status === "loading" || mirrorInitialized.current || isPremiumDemo || !panels.length) return;
    mirrorInitialized.current = true;
    lastSaved.current = Date.now();
    writeLocal({
      seriesSlug,
      seriesTitle,
      chapterNumber,
      chapterTitle,
      pageIndex: 0,
      percent: actualPercent.current || 1,
      total: panels.length,
      format: "webtoon",
      coverPath: "",
      accent: "",
    });
  }, [chapterNumber, chapterTitle, isPremiumDemo, panels.length, restored, seriesSlug, seriesTitle, status]);

  if (isPremiumDemo) {
    return <LockedChapterPanel seriesSlug={seriesSlug} seriesTitle={seriesTitle} format="webtoon" />;
  }

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      <ReaderChrome
        seriesSlug={seriesSlug}
        seriesTitle={seriesTitle}
        chapterNumber={chapterNumber}
        chapterTitle={chapterTitle}
        format="webtoon"
        percent={percent}
        immersive={immersive}
        onToggleImmersive={() => setImmersive((v) => !v)}
      />

      {/* Content starts early (pt-14), generous bottom padding (pb-32) prevents fixed toolbar from covering bottom content */}
      <main className="pt-13 sm:pt-14 pb-32" aria-label="لوحات الفصل">
        <div className="mx-auto max-w-2xl">
          {panels.map((p) => (
            <div key={p.id} className="relative w-full" style={{ aspectRatio: `${p.width}/${p.height}` }}>
              <Image
                src={p.imagePath}
                alt={`لوحة ${p.pageIndex + 1} من ${panels.length}`}
                fill
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-cover"
                loading={p.pageIndex < 2 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        <ChapterEndCard
          seriesSlug={seriesSlug}
          format="webtoon"
          seriesTitle={seriesTitle}
          next={next}
          prev={prev}
          chapterNumber={chapterNumber}
        />

        {/* Chapter comments — inline at the end of the vertical scroll */}
        <section className="mx-auto max-w-2xl px-4 pb-12">
          <CommentsSection
            seriesSlug={seriesSlug}
            seriesTitle={seriesTitle}
            chapterNumber={chapterNumber}
            comments={comments}
          />
        </section>
      </main>

      {/* Floating navigation bar */}
      <ReaderFloatingBar
        seriesSlug={seriesSlug}
        chapterNumber={chapterNumber}
        format="webtoon"
        percent={percent}
        prev={prev}
        next={next}
        immersive={immersive}
      />
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ReaderChrome, ChapterEndCard, LockedChapterPanel } from "@/components/readers/reader-chrome";
import { CommentsSection } from "@/components/community/comments-section";
import { saveReadingProgress } from "@/lib/actions";
import { writeLocal } from "@/lib/progress-local";
import type { CommentView } from "@/lib/queries";

// Chapter comments are optional (Release E) — server passes them when present.

type Panel = { id: string; pageIndex: number; imagePath: string; width: number; height: number };

export function WebtoonReader({
  seriesSlug,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  panels,
  isPremiumDemo,
  comments = [],
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
  next: { number: number; isPremiumDemo: boolean } | null;
  prev: { number: number; isPremiumDemo: boolean } | null;
}) {
  const { status } = useSession();
  const [immersive, setImmersive] = useState(false);
  const [percent, setPercent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSaved = useRef(0);
  const savedStart = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 100;
      setPercent(p);

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
  }, [chapterNumber, panels.length, seriesSlug, seriesTitle, status]);

  // mark read_start once (mirrors the seeded pattern; guests keep it locally only)
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
      total: panels.length,
      format: "webtoon",
      coverPath: "",
      accent: "",
    });
  }, [chapterNumber, panels.length, seriesSlug, seriesTitle, chapterTitle]);

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

      <main className="pt-14" aria-label="لوحات الفصل">
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

        {/* Chapter comments (Release E) — inline at the end of the vertical scroll */}
        <section className="mx-auto max-w-2xl px-4 pb-14">
          <CommentsSection
            seriesSlug={seriesSlug}
            seriesTitle={seriesTitle}
            chapterNumber={chapterNumber}
            comments={comments}
          />
        </section>
      </main>
    </div>
  );
}

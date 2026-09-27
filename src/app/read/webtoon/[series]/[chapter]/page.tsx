import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebtoonReader } from "@/components/readers/webtoon-reader";
import { getChapterForReading } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string; chapter: string }>;
}): Promise<Metadata> {
  const { series, chapter } = await params;
  return { title: `الفصل ${chapter} — ${series}` };
}

export default async function WebtoonReaderPage({
  params,
}: {
  params: Promise<{ series: string; chapter: string }>;
}) {
  const { series: seriesSlug, chapter } = await params;
  const num = Number(chapter);
  if (!Number.isInteger(num) || num < 1) notFound();
  const data = await getChapterForReading(seriesSlug, num);
  if (!data || data.series.format !== "webtoon") notFound();

  return (
    <WebtoonReader
      seriesSlug={data.series.slug}
      seriesTitle={data.series.titleAr}
      chapterNumber={data.chapter.number}
      chapterTitle={data.chapter.titleAr}
      isPremiumDemo={data.chapter.isPremiumDemo}
      panels={data.chapter.pages.map((p) => ({
        id: p.id,
        pageIndex: p.pageIndex,
        imagePath: p.imagePath,
        width: p.width,
        height: p.height,
      }))}
      next={data.next ? { number: data.next.number, isPremiumDemo: data.next.isPremiumDemo } : null}
      prev={data.prev ? { number: data.prev.number, isPremiumDemo: data.prev.isPremiumDemo } : null}
    />
  );
}

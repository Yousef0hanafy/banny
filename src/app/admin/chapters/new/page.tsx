import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChapterForm } from "@/components/admin/admin-client";
import type { Format } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function NewChapterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const preferred = typeof sp.series === "string" ? sp.series : undefined;
  const seriesList = await db.series.findMany({
    orderBy: { titleAr: "asc" },
    select: { id: true, titleAr: true, format: true },
  });
  const options = seriesList.map((s) => ({
    id: s.id,
    titleAr: s.titleAr,
    format: s.format as Format,
  }));
  // preselect via ?series=
  if (preferred) options.sort((a, b) => (a.id === preferred ? -1 : b.id === preferred ? 1 : 0));

  return (
    <main className="mx-auto max-w-3xl p-4 pt-6 sm:p-6">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground">
        <Link href="/admin/chapters">
          <ArrowRight className="size-4" aria-hidden />
          عودة إلى الفصول
        </Link>
      </Button>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">فصل جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          يُنشأ الفصل مع صفحات/لوحات تجريبية مجردة — رفع المحتوى الحقيقي يعمل في إصدار لاحق.
        </p>
      </header>
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <ChapterForm seriesOptions={options} />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenText,
  Eye,
  Star,
  MessageCircle,
  Library,
  PenTool,
  FileEdit,
  CalendarClock,
  ExternalLink,
} from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { requireRole } from "@/lib/queries";
import { getStudioOverview } from "@/lib/queries";
import { FORMAT_LABELS, type Format } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استوديو المبدعين",
};

/**
 * Creator Studio lite (Release E): read-only insights for editor+ over the
 * catalog they publish — reach (reads), community (ratings/comments/saves),
 * and the chapter pipeline (published/review/drafts/scheduled). Content
 * editing itself stays in /admin; this is the calm, zero-DDL overview.
 */
export default async function StudioPage() {
  await requireRole(["editor", "admin"]);
  const rows = await getStudioOverview();

  const totals = rows.reduce(
    (acc, s) => ({
      reads: acc.reads + s.reads,
      comments: acc.comments + s.comments,
      libraryAdds: acc.libraryAdds + s.libraryAdds,
      drafts: acc.drafts + s.drafts,
      review: acc.review + s.review,
      scheduled: acc.scheduled + s.scheduled,
    }),
    { reads: 0, comments: 0, libraryAdds: 0, drafts: 0, review: 0, scheduled: 0 }
  );

  const maxReads = Math.max(1, ...rows.map((r) => r.reads));

  const statCards = [
    { label: "إجمالي القراءات", value: totals.reads, icon: Eye, tone: "text-primary" },
    { label: "إضافات المكتبة", value: totals.libraryAdds, icon: Library, tone: "text-gold" },
    { label: "تعليقات المجتمع", value: totals.comments, icon: MessageCircle, tone: "text-success" },
    { label: "بانتظار المراجعة", value: totals.review + totals.drafts, icon: FileEdit, tone: "text-muted-foreground" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="pt-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
              <PenTool className="size-6 text-primary" aria-hidden />
              استوديو المبدعين
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              نظرة هادئة على أثر أعمالك — القراءات، التقييمات، النقاشات، وحالة سلسلة النشر.
            </p>
          </header>

          {/* Totals */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <c.icon className={`size-4 ${c.tone}`} aria-hidden />
                  {c.label}
                </div>
                <p className="mt-1.5 text-2xl font-bold text-foreground">{c.value.toLocaleString("ar-EG")}</p>
              </div>
            ))}
          </div>

          {/* Scheduled teaser */}
          {totals.scheduled > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-gold">
              <CalendarClock className="size-4" aria-hidden />
              {totals.scheduled.toLocaleString("ar-EG")} فصلًا مجدولًا بانتظار موعد النشر — ستصل إشعارات المتابعين تلقائيًا لحظة صدورها.
            </div>
          )}

          {/* Per-series */}
          <section aria-label="أداء الأعمال" className="mt-8 pb-12">
            <h2 className="mb-3 text-lg font-bold">أداء الأعمال</h2>
            {rows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                لا أعمال بعد — أنشئ أول عمل من لوحة الإدارة.
              </p>
            ) : (
              <ul className="space-y-3">
                {rows.map((s) => (
                  <li
                    key={s.seriesId}
                    className="rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/25 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.accent }} aria-hidden />
                          <Link href={`/series/${s.slug}`} className="truncate text-base font-bold text-foreground hover:text-primary">
                            {s.titleAr}
                          </Link>
                          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {FORMAT_LABELS[s.format as Format]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.published} فصل منشور
                          {s.review > 0 && ` · ${s.review} مراجعة`}
                          {s.drafts > 0 && ` · ${s.drafts} مسودة`}
                          {s.scheduled > 0 && ` · ${s.scheduled} مجدول`}
                        </p>
                      </div>
                      <Link
                        href={`/admin/series/${s.seriesId}`}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                        إدارة العمل
                      </Link>
                    </div>

                    {/* reads bar */}
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Eye className="size-3.5" aria-hidden /> القراءات
                        </span>
                        <span className="font-semibold text-foreground">{s.reads.toLocaleString("ar-EG")}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-accent">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(6, (s.reads / maxReads) * 100)}%`, backgroundColor: s.accent }}
                        />
                      </div>
                    </div>

                    <dl className="mt-3.5 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl border border-border/50 bg-secondary/40 px-2 py-2">
                        <dt className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                          <Star className="size-3 text-gold" aria-hidden /> التقييم
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-foreground">
                          {s.ratingAvg.toFixed(1)} <span className="text-[10px] font-normal text-muted-foreground">({s.ratingCount})</span>
                        </dd>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-secondary/40 px-2 py-2">
                        <dt className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                          <MessageCircle className="size-3" aria-hidden /> تعليقات
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-foreground">{s.comments}</dd>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-secondary/40 px-2 py-2">
                        <dt className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                          <Library className="size-3" aria-hidden /> محفوظات
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-foreground">{s.libraryAdds}</dd>
                      </div>
                    </dl>

                    {s.topChapters.length > 0 && (
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpenText className="size-3.5" aria-hidden /> الأكثر قراءة:
                        </span>
                        {s.topChapters.map((c) => (
                          <span key={c.number} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-primary">
                            الفصل {c.number} · {c.reads}
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

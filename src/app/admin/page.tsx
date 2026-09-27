import Link from "next/link";
import { AlertTriangle, ArrowUpLeft, BookOpen, CheckCircle2, FileEdit, LibraryBig, ListOrdered, Eye, Users } from "lucide-react";
import { getAdminOverview } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WORKFLOW_LABELS, type Workflow } from "@/lib/constants";

export const dynamic = "force-dynamic";

const EVENT_TEXT: Record<string, string> = {
  read_start: "بدأ قراءة",
  read_page: "تابع قراءة",
  read_complete: "أكمل قراءة",
  login: "سجّل الدخول",
  publish: "نُشر فصل جديد",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const denied = sp.denied === "1";
  const o = await getAdminOverview();

  const cards = [
    { label: "الأعمال", value: o.seriesCount, icon: LibraryBig, href: "/admin/series" },
    { label: "الفصول المنشورة", value: o.publishedCount, icon: CheckCircle2, href: "/admin/chapters?workflow=published" },
    { label: "قيد المراجعة", value: o.reviewCount, icon: Eye, href: "/admin/chapters?workflow=review" },
    { label: "المسودات", value: o.draftCount, icon: FileEdit, href: "/admin/chapters?workflow=draft" },
    { label: "قراءو العرض", value: o.profileCount, icon: Users, href: "/admin/series" },
    { label: "إجمالي الأحداث", value: o.eventCount, icon: BookOpen, href: "/admin" },
  ];

  return (
    <main className="mx-auto max-w-6xl p-4 pt-6 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">اللوحة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            نظرة سريعة على مكتبة العرض التجريبي — البيانات من بذرة العرض وأحداثه.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="border-border gap-1.5">
            <Link href="/admin/series/new"><LibraryBig className="size-4" /> عمل جديد</Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/admin/chapters/new"><ListOrdered className="size-4" /> فصل جديد</Link>
          </Button>
        </div>
      </header>

      {denied && (
        <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          لا تملك صلاحية الوصول إلى تلك الشاشة.
        </p>
      )}

      {/* Status cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="مؤشرات عامة">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="border-border/60 bg-card transition hover:border-primary/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <c.icon className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{c.value}</p>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">النشاط الأخير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {o.recentEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-secondary/40 px-3 py-2 text-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span className="text-foreground/90">{EVENT_TEXT[e.type] ?? e.type}</span>
                {e.series && <Link href={`/series/${e.series.slug}`} className="truncate text-muted-foreground hover:text-primary">{e.series.titleAr}</Link>}
                {e.profile?.nickname && <span className="ms-auto shrink-0 text-[11px] text-muted-foreground">{e.profile.nickname}</span>}
              </div>
            ))}
            {o.recentEvents.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا نشاط بعد.</p>}
          </CardContent>
        </Card>

        {/* Top series + content status */}
        <div className="space-y-4">
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">الأعمال الأعلى قراءة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {o.topSeries.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-gold">{i + 1}</span>
                  <Link href={`/series/${s.slug}`} className="flex-1 truncate text-sm text-foreground hover:text-primary">
                    {s.titleAr}
                  </Link>
                  <span className="text-xs tabular-nums text-muted-foreground">{s.reads.toLocaleString("ar-EG")} قراءة</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">حالة المحتوى</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-3 overflow-hidden rounded-full bg-accent" role="img" aria-label={`منشور ${o.publishedCount}، مراجعة ${o.reviewCount}، مسودة ${o.draftCount}`}>
                <div className="bg-success" style={{ width: `${(o.publishedCount / Math.max(o.chapterCount, 1)) * 100}%` }} />
                <div className="bg-gold" style={{ width: `${(o.reviewCount / Math.max(o.chapterCount, 1)) * 100}%` }} />
                <div className="bg-muted-foreground/40" style={{ width: `${(o.draftCount / Math.max(o.chapterCount, 1)) * 100}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" /> {WORKFLOW_LABELS.published} ({o.publishedCount})</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-gold" /> {WORKFLOW_LABELS.review} ({o.reviewCount})</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/40" /> {WORKFLOW_LABELS.draft} ({o.draftCount})</span>
                <Badge variant="secondary" className="ms-auto border-border">إجمالي الفصول: {o.chapterCount}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-sm text-muted-foreground">
                ترتيب سير العمل: <strong className="text-foreground">مسودة ← مراجعة ← منشور</strong>
              </p>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
                <Link href="/admin/chapters">
                  إدارة الفصول
                  <ArrowUpLeft className="size-4" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

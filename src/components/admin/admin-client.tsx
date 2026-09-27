"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Plus, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateChapterMeta, upsertSeries, createChapter } from "@/lib/actions";
import { FORMATS, FORMAT_LABELS, GENRES, SERIES_STATUSES, STATUS_LABELS, WORKFLOWS, WORKFLOW_LABELS } from "@/lib/constants";

export function AdminLogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "sm"}
      className={compact ? "size-9 text-muted-foreground" : "w-full justify-start gap-2.5 text-muted-foreground hover:text-danger"}
      onClick={() => signOut({ callbackUrl: "/" })}
      aria-label="تسجيل الخروج"
    >
      <LogOut className="size-4" aria-hidden />
      {!compact && "تسجيل الخروج"}
    </Button>
  );
}

export function SeriesFilters({ initial }: { initial: { q?: string; format?: string; status?: string } }) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q ?? "");
  const push = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = { q, format: initial.format, status: initial.status, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    router.replace(`/admin/series?${params.toString()}`);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          push({});
        }}
      >
        <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالعنوان…"
          className="w-52 bg-card ps-8"
          aria-label="بحث في الأعمال"
        />
      </form>
      <Select value={initial.format ?? "all"} onValueChange={(v) => push({ format: v === "all" ? null : v })}>
        <SelectTrigger size="sm" className="w-[130px] bg-card" aria-label="النوع">
          <SelectValue placeholder="النوع" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الأنواع</SelectItem>
          {FORMATS.map((f) => <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={initial.status ?? "all"} onValueChange={(v) => push({ status: v === "all" ? null : v })}>
        <SelectTrigger size="sm" className="w-[140px] bg-card" aria-label="الحالة">
          <SelectValue placeholder="الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الحالات</SelectItem>
          {SERIES_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

type SeriesFormValues = {
  id?: string;
  titleAr: string;
  titleOriginal: string;
  slug: string;
  synopsisAr: string;
  format: "manga" | "webtoon";
  status: "ongoing" | "completed" | "hiatus";
  author: string;
  translator: string;
  genres: string[];
  isFeatured: boolean;
};

export function SeriesForm({ initial }: { initial?: SeriesFormValues }) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<SeriesFormValues>(
    initial ?? {
      titleAr: "",
      titleOriginal: "",
      slug: "",
      synopsisAr: "",
      format: "manga",
      status: "ongoing",
      author: "",
      translator: "",
      genres: [],
      isFeatured: false,
    }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof SeriesFormValues>(k: K, v: SeriesFormValues[K]) =>
    setValues((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors(null);
    const res = await upsertSeries(values);
    setLoading(false);
    if (!res.ok) {
      setErrors(res.error ?? "حدث خطأ غير متوقع");
      return;
    }
    toast({ title: "تم الحفظ", description: "حُفظت بيانات العمل وظهرت في الموقع." });
    startTransition(() => {
      router.push(`/admin/series`);
      router.refresh();
    });
  }

  const field = "bg-card";
  return (
    <form onSubmit={submit} className="space-y-5" aria-label="نموذج بيانات العمل">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">العنوان العربي *</label>
          <Input required value={values.titleAr} onChange={(e) => set("titleAr", e.target.value)} className={field} placeholder="مثال: حارس بوابة الشفق" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">العنوان الأصلي (اختياري)</label>
          <Input dir="ltr" value={values.titleOriginal} onChange={(e) => set("titleOriginal", e.target.value)} className={`${field} text-left`} placeholder="Original title" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">المعرّف (slug) *</label>
          <Input dir="ltr" required value={values.slug} onChange={(e) => set("slug", e.target.value)} className={`${field} text-left`} placeholder="twilight-gate-warden" disabled={Boolean(values.id)} />
          <p className="text-[11px] text-muted-foreground">أحرف لاتينية صغيرة وأرقام وشرطات — لا يمكن تعديله لاحقًا.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">الصيغة *</label>
          <Select value={values.format} onValueChange={(v) => set("format", v as SeriesFormValues["format"])}>
            <SelectTrigger className={field}><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">حالة النشر *</label>
          <Select value={values.status} onValueChange={(v) => set("status", v as SeriesFormValues["status"])}>
            <SelectTrigger className={field}><SelectValue /></SelectTrigger>
            <SelectContent>
              {SERIES_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">المؤلف *</label>
          <Input required value={values.author} onChange={(e) => set("author", e.target.value)} className={field} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">المترجم</label>
          <Input value={values.translator} onChange={(e) => set("translator", e.target.value)} className={field} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">الملخص العربي *</label>
        <textarea
          required
          value={values.synopsisAr}
          onChange={(e) => set("synopsisAr", e.target.value)}
          rows={5}
          className={`w-full rounded-xl border border-input ${field} px-3 py-2.5 text-sm leading-8 outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          placeholder="ملخص جذاب بالعربية…"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">التصنيفات * (اختر واحدة أو أكثر)</label>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => {
            const active = values.genres.includes(g);
            return (
              <button
                type="button"
                key={g}
                onClick={() => set("genres", active ? values.genres.filter((x) => x !== g) : [...values.genres, g])}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={active}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={values.isFeatured}
          onChange={(e) => set("isFeatured", e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        عمل مميّز (يظهر في الواجهة بشكل أبرز)
      </label>

      {errors && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{errors}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || pending} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {(loading || pending) && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {values.id ? "حفظ التعديلات" : "إنشاء العمل"}
        </Button>
        <Button type="button" variant="outline" className="border-border" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

type ChapterRow = {
  id: string;
  number: number;
  titleAr: string;
  workflow: "draft" | "review" | "published";
  isPremiumDemo: boolean;
};

export function ChapterWorkflowControls({ chapter }: { chapter: ChapterRow }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function set(workflow: ChapterRow["workflow"]) {
    setLoading(workflow);
    const res = await updateChapterMeta({ id: chapter.id, workflow });
    setLoading(null);
    if (res.ok) {
      toast({ title: "تم التحديث", description: `حالة الفصل ${chapter.number}: ${WORKFLOW_LABELS[workflow]}` });
      router.refresh();
    } else {
      toast({ title: "تعذّر التحديث", description: res.error, variant: "destructive" });
    }
  }

  async function togglePremium() {
    setLoading("premium");
    const res = await updateChapterMeta({ id: chapter.id, isPremiumDemo: !chapter.isPremiumDemo });
    setLoading(null);
    if (res.ok) {
      toast({ title: chapter.isPremiumDemo ? "أُلغي القفل التجريبي" : "أصبح فصلًا تجريبيًا مقفلًا" });
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Select value={chapter.workflow} onValueChange={(v) => set(v as ChapterRow["workflow"])}>
        <SelectTrigger size="sm" className="w-[110px] bg-card" aria-label="حالة سير العمل">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WORKFLOWS.map((w) => <SelectItem key={w} value={w}>{WORKFLOW_LABELS[w]}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className={`border-gold/40 text-gold ${chapter.isPremiumDemo ? "bg-gold/10" : ""}`}
        onClick={togglePremium}
        disabled={loading === "premium"}
        title="قفل/فتح العرض التجريبي للفصل"
      >
        {chapter.isPremiumDemo ? "مقفل" : "قفل تجريبي"}
      </Button>
      {loading && loading !== "premium" && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
    </div>
  );
}

export function ChapterForm({ seriesOptions }: { seriesOptions: { id: string; titleAr: string; format: "manga" | "webtoon" }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [seriesId, setSeriesId] = useState(seriesOptions[0]?.id ?? "");
  const [number, setNumber] = useState("1");
  const [titleAr, setTitleAr] = useState("");
  const [workflow, setWorkflow] = useState<"draft" | "review" | "published">("draft");
  const [isPremiumDemo, setIsPremiumDemo] = useState(false);
  const [readingDirection, setReadingDirection] = useState<"rtl" | "ltr">("rtl");
  const [pageCount, setPageCount] = useState("8");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = seriesOptions.find((s) => s.id === seriesId);
  const isManga = selected?.format === "manga";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createChapter({
      seriesId,
      number: Number(number),
      titleAr,
      workflow,
      isPremiumDemo,
      readingDirection: isManga ? readingDirection : "rtl",
      pageCount: Number(pageCount),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "حدث خطأ");
      return;
    }
    toast({ title: "أُنشئ الفصل", description: "أُضيف الفصل مع صفحات تجريبية مجردة." });
    router.push("/admin/chapters");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-xl" aria-label="نموذج فصل جديد">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">العمل *</label>
        <Select value={seriesId} onValueChange={setSeriesId}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="اختر العمل" /></SelectTrigger>
          <SelectContent>
            {seriesOptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.titleAr} — {FORMAT_LABELS[s.format]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">رقم الفصل *</label>
          <Input type="number" min={1} required value={number} onChange={(e) => setNumber(e.target.value)} className="bg-card" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{isManga ? "عدد الصفحات" : "عدد اللوحات"} *</label>
          <Input type="number" min={1} max={30} required value={pageCount} onChange={(e) => setPageCount(e.target.value)} className="bg-card" />
          <p className="text-[11px] text-muted-foreground">تُولَّد صفحات تجريبية مجردة تلقائيًا (رفع الملفات الحقيقي في إصدار لاحق).</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">عنوان الفصل *</label>
        <Input required value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="bg-card" placeholder="مثال: أضواء على الحدود" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">حالة سير العمل *</label>
          <Select value={workflow} onValueChange={(v) => setWorkflow(v as typeof workflow)}>
            <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WORKFLOWS.map((w) => <SelectItem key={w} value={w}>{WORKFLOW_LABELS[w]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isManga && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">اتجاه القراءة</label>
            <Select value={readingDirection} onValueChange={(v) => setReadingDirection(v as "rtl" | "ltr")}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rtl">يمين ← يسار (يابانية)</SelectItem>
                <SelectItem value="ltr">يسار → يمين</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <label className="flex items-center gap-2.5 text-sm">
        <input type="checkbox" checked={isPremiumDemo} onChange={(e) => setIsPremiumDemo(e.target.checked)} className="size-4 accent-[var(--primary)]" />
        فصل تجريبي مقفل (لعرض حالة الفصول المميزة — بلا شراء)
      </label>
      {error && <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
      <Button type="submit" disabled={loading} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        إنشاء الفصل
      </Button>
    </form>
  );
}

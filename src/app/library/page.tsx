import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookMarked, CheckCheck, Clock3 } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { LibraryCardActions } from "@/components/library/library-card-actions";
import { requireProfile, getLibrary } from "@/lib/queries";
import { FORMAT_LABELS, SHELF_LABELS, type Shelf } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "مكتبتي — مكتبة باني" };

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "reading", label: SHELF_LABELS.reading },
  { key: "plan", label: SHELF_LABELS.plan },
  { key: "finished", label: SHELF_LABELS.finished },
];

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const profile = await requireProfile();
  const { tab } = await searchParams;
  const active = tab && ["all", "reading", "plan", "finished"].includes(tab) ? tab : "all";
  const entries = await getLibrary(profile.id, active === "all" ? undefined : active);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">مكتبتي</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              أعمالك المحفوظة — يتزامن تقدمك تلقائيًا عبر أجهزتك عند تسجيل الدخول.
            </p>
          </header>

          <nav aria-label="أرفف المكتبة" className="mb-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/library?tab=${t.key}`}
                aria-current={active === t.key ? "page" : undefined}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  active === t.key
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
              <BookMarked className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">
                رفّك فارغ — أضف أعمالًا من صفحاتها لتجدها هنا.
              </p>
              <Link
                href="/explore"
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                استكشف المكتبة
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {entries.map((e) => (
                <li key={e.series.id} className="group overflow-hidden rounded-2xl border border-border/60 bg-card">
                  <Link href={`/series/${e.series.slug}`} className="relative block aspect-[3/4] overflow-hidden">
                    <Image
                      src={e.series.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                      alt={`غلاف ${e.series.titleAr}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    {e.unreadCount > 0 && (
                      <span className="absolute end-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow">
                        {e.unreadCount} جديد
                      </span>
                    )}
                  </Link>
                  <div className="space-y-2 p-3">
                    <Link href={`/series/${e.series.slug}`} className="block truncate text-sm font-semibold text-foreground hover:text-primary">
                      {e.series.titleAr}
                    </Link>
                    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock3 className="size-3" aria-hidden />
                      {SHELF_LABELS[e.shelf as Shelf]} · {FORMAT_LABELS[e.series.format]}
                    </p>
                    <LibraryCardActions slug={e.series.slug} shelf={e.shelf as Shelf} />
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CheckCheck className="size-3" aria-hidden />
                      {e.series.chapterCount} فصل متاح
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

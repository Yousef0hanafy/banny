import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookMarked, Lock } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { requireProfile, getLibraryUpdatesFeed } from "@/lib/queries";
import { FORMAT_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "التحديثات — مكتبة باني" };

function timeAgoAr(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "اليوم";
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  const months = Math.floor(days / 30);
  return `قبل ${months} شهر`;
}

export default async function UpdatesPage() {
  const profile = await requireProfile();
  const feed = await getLibraryUpdatesFeed(profile.id);
  const unread = feed.filter((f) => !f.read).length;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">التحديثات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              أحدث الفصول المنشورة لأعمال مكتبتك{unread > 0 && <> — <span className="font-semibold text-primary">{unread} غير مقروء</span></>}
            </p>
          </header>

          {feed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
              <BookMarked className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">
                لا تحديثات — أضف أعمالًا إلى مكتبتك لتظهر فصولها الجديدة هنا أولًا.
              </p>
              <Link
                href="/explore"
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                استكشف المكتبة
              </Link>
            </div>
          ) : (
            <ol className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
              {feed.map((f) => {
                const inner = (
                  <>
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/60">
                      <Image
                        src={f.series.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          الفصل {f.number}: {f.titleAr}
                        </span>
                        {!f.read && <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">جديد</span>}
                        {f.isPremiumDemo && (
                          <span className="flex shrink-0 items-center gap-1 rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">
                            <Lock className="size-2.5" aria-hidden /> تجريبي مقفل
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {f.series.titleAr} · {FORMAT_LABELS[f.series.format as "manga"]} · {timeAgoAr(f.publishedAt)}
                      </span>
                    </span>
                    {!f.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                  </>
                );
                return (
                  <li key={f.chapterId}>
                    <Link
                      href={`/read/${f.series.format}/${f.series.slug}/${f.number}`}
                      className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-accent/40"
                    >
                      {inner}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

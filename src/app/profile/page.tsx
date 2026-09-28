import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookMarked, BookOpenCheck, MessageSquare, Star, History } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { ProfileSettings } from "@/components/library/profile-settings";
import {
  requireProfile,
  getProfileStats,
  getProfileActivity,
  getFavoriteGenres,
} from "@/lib/queries";
import { EVENT_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "حسابي — مكتبة باني" };

function timeAgoAr(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "اليوم";
  if (days < 30) return `قبل ${days} يوم`;
  return `قبل ${Math.floor(days / 30)} شهر`;
}

export default async function ProfilePage() {
  const profile = await requireProfile();
  const [stats, activity, genres] = await Promise.all([
    getProfileStats(profile.id),
    getProfileActivity(profile.id),
    getFavoriteGenres(profile.id),
  ]);

  const statCards = [
    { label: "في مكتبتي", value: stats.libraryCount, icon: BookMarked, href: "/library" },
    { label: "فصل أتممته", value: stats.chaptersRead, icon: BookOpenCheck, href: "/updates" },
    { label: "تعليق", value: stats.commentCount, icon: MessageSquare, href: "/library" },
    { label: "تقييم", value: stats.ratingCount, icon: Star, href: "/library" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {/* identity */}
          <header className="flex items-center gap-4">
            <Avatar className="size-16 border border-border">
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                {profile.nickname.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile.nickname}</h1>
              <p className="text-xs text-muted-foreground" dir="ltr">{profile.email}</p>
              {profile.bio && <p className="mt-1.5 max-w-md text-sm leading-7 text-foreground/85">{profile.bio}</p>}
            </div>
          </header>

          {/* stats */}
          <section aria-label="إحصاءات القراءة" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40"
              >
                <s.icon className="size-4 text-primary" aria-hidden />
                <p className="mt-2 text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Link>
            ))}
          </section>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            {/* settings */}
            <section aria-label="إعدادات الحساب" className="rounded-2xl border border-border/60 bg-card p-4">
              <h2 className="mb-3 text-sm font-bold">إعدادات الحساب</h2>
              <ProfileSettings nickname={profile.nickname} bio={profile.bio ?? ""} />
            </section>

            {/* favorite genres */}
            <section aria-label="الأنواع المفضلة" className="rounded-2xl border border-border/60 bg-card p-4">
              <h2 className="mb-3 text-sm font-bold">أنواعك المفضلة</h2>
              {genres.length === 0 ? (
                <p className="text-sm text-muted-foreground">أضف أعمالًا إلى مكتبتك لتكتشف ذوقك.</p>
              ) : (
                <ul className="space-y-2.5">
                  {genres.map((g) => {
                    const max = genres[0].count || 1;
                    return (
                      <li key={g.genre}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-foreground/90">{g.genre}</span>
                          <span className="text-muted-foreground">{g.count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${(g.count / max) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* recent reading */}
          <section aria-label="آخر قراءاتك" className="mt-6">
            <h2 className="mb-3 text-sm font-bold">آخر قراءاتك</h2>
            {stats.recentProgress.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                لم تبدأ أي عمل بعد — <Link href="/explore" className="text-primary hover:underline">استكشف الآن</Link>.
              </p>
            ) : (
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
                {stats.recentProgress.map((p) => (
                  <li key={p.id}>
                    <Link href={`/read/${p.series.format}/${p.series.slug}/${p.chapter.number}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent/40">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border/60">
                        <Image src={p.series.coverPath || "/art/covers/warden-of-the-twilight-gate.webp"} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.series.titleAr}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          الفصل {p.chapter.number} · قارأتم {Math.round(p.percent)}٪
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgoAr(p.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* activity */}
          <section aria-label="سجل النشاط" className="mt-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
              <History className="size-4 text-muted-foreground" aria-hidden />
              سجل النشاط
            </h2>
            <ul className="space-y-1.5 rounded-2xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
              {activity.length === 0 && <li>لا نشاط بعد.</li>}
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3">
                  <span>
                    {EVENT_LABELS[a.type] ?? a.type}
                    {a.series && <> — <Link href={`/series/${a.series.slug}`} className="text-foreground/80 hover:text-primary">{a.series.titleAr}</Link></>}
                  </span>
                  <span className="shrink-0">{timeAgoAr(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

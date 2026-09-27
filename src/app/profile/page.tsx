import { ShieldCheck } from "lucide-react";
import { SiteHeader, SiteFooter, BottomNav } from "@/components/library/chrome";
import { requireProfile } from "@/lib/queries";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { AdminLogoutButton } from "@/components/admin/admin-client";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = { admin: "مدير", editor: "محرر", reader: "قارئ" };

/**
 * Basic account page (Release A keeps this minimal — full profile/stats/settings in Release B).
 */
export default async function ProfilePage() {
  const profile = await requireProfile();
  const [progressCount, completedCount] = await Promise.all([
    db.readingProgress.count({ where: { profileId: profile.id } }),
    db.readingProgress.count({ where: { profileId: profile.id, completed: true } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
            <span className="grid size-20 place-items-center rounded-2xl bg-primary/15 border border-primary/30 text-2xl font-bold text-primary">
              {profile.nickname.slice(0, 1)}
            </span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{profile.nickname}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">{profile.email}</p>
              <Badge variant="secondary" className="mt-2 border border-primary/25 bg-primary/15 text-primary">
                <ShieldCheck className="me-1 size-3" aria-hidden />
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
            </div>
            <AdminLogoutButton />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-2xl font-bold tabular-nums text-foreground">{progressCount}</p>
              <p className="text-xs text-muted-foreground">فصول قيد القراءة</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-2xl font-bold tabular-nums text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">فصول مكتملة</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-2xl font-bold tabular-nums text-foreground">{profile.role === "reader" ? "—" : "✓"}</p>
              <p className="text-xs text-muted-foreground">صلاحية التحرير</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-4 text-xs leading-6 text-gold/90">
            صفحة الحساب الأساسية تعمل في هذه النسخة؛ الملف الشخصي الكامل (الإحصاءات، الأنواع المفضلة، النشاط،
            الإعدادات) يصل في الإصدار التجريبي القادم.
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
            <BookOpenTextPlaceholder />
            <p className="flex-1 text-sm text-muted-foreground">
              مكتبتك الشخصية وقائمة التحديثات — قريبًا في الإصدار القادم.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

function BookOpenTextPlaceholder() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

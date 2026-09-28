"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpenText, Heart, Sparkles, CheckCheck, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions";

/**
 * Full-page notifications list (Release E). Times are precomputed on the
 * server (hydration-safe); the client only handles mark-read + navigation.
 */

export type NotificationRow = {
  id: string;
  type: string;
  titleAr: string;
  bodyAr: string | null;
  href: string | null;
  when: string;
  read: boolean;
};

const TYPE_META: Record<string, { icon: typeof BellOff; classes: string }> = {
  new_chapter: { icon: BookOpenText, classes: "bg-primary/15 text-primary" },
  comment_like: { icon: Heart, classes: "bg-rose-500/15 text-rose-400" },
  system: { icon: Sparkles, classes: "bg-gold/15 text-gold" },
};

export function NotificationsList({ items, unread }: { items: NotificationRow[]; unread: number }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [remaining, setRemaining] = useState(unread);
  const [, startTransition] = useTransition();

  const markAll = () => {
    setRows((list) => list.map((it) => ({ ...it, read: true })));
    setRemaining(0);
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  const open = (it: NotificationRow) => {
    if (!it.read) {
      setRows((list) => list.map((x) => (x.id === it.id ? { ...x, read: true } : x)));
      setRemaining((u) => Math.max(0, u - 1));
      startTransition(async () => {
        await markNotificationRead({ id: it.id });
      });
    }
    if (it.href) router.push(it.href);
  };

  return (
    <div className="mt-6 pb-10">
      {remaining > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{remaining} إشعارًا غير مقروء</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-primary hover:text-primary" onClick={markAll}>
            <CheckCheck className="size-3.5" aria-hidden />
            تعليم الكل كمقروء
          </Button>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-muted-foreground">
            <BellOff className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-bold text-foreground">لا إشعارات بعد</h2>
          <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
            أضِف الأعمال التي تحبها إلى مكتبتك — نُعلمك هنا عند صدور فصل جديد، وعند تفاعل القرّاء مع تعليقاتك.
          </p>
          <Button asChild className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/explore">تصفّح الأعمال</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((it) => {
            const meta = TYPE_META[it.type] ?? TYPE_META.system;
            const Icon = meta.icon;
            const body = (
              <>
                <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${meta.classes}`}>
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${it.read ? "text-foreground/80" : "font-semibold text-foreground"}`}>
                    {it.titleAr}
                  </span>
                  {it.bodyAr && <span className="mt-0.5 block text-xs leading-6 text-muted-foreground">{it.bodyAr}</span>}
                  <span className="mt-1 block text-[11px] text-muted-foreground/80">{it.when}</span>
                </span>
                {!it.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="غير مقروء" />}
              </>
            );
            return (
              <li key={it.id}>
                {it.href ? (
                  <button
                    onClick={() => open(it)}
                    className={`flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-start transition hover:border-primary/30 hover:bg-accent/30 ${it.read ? "" : "border-primary/25 bg-primary/5"}`}
                  >
                    {body}
                  </button>
                ) : (
                  <div className={`flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 ${it.read ? "" : "border-primary/25 bg-primary/5"}`}>
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

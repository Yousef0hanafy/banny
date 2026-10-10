"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, Check, ArrowLeft, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GENRES } from "@/lib/constants";
import { saveOnboarding } from "@/lib/account-actions";
import { safeAccountDestination } from "@/lib/account-destination";
import { AccountShell } from "@/components/accounts/account-shell";

export function WelcomeOnboarding({
  nickname,
  isStaff,
  next,
}: {
  nickname: string;
  isStaff: boolean;
  next: string;
}) {
  const router = useRouter();
  const safeNext = safeAccountDestination(next, isStaff ? "/studio" : "/");

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleFinish = (skip = false) => {
    setError(null);
    startTransition(async () => {
      const res = await saveOnboarding({
        genres: skip ? [] : selectedGenres,
        skip,
        next: safeNext,
      });

      if (!res.ok) {
        setError(res.error ?? "تعذّر حفظ التفضيلات. يرجى المحاولة لاحقًا.");
        return;
      }

      const dest = safeAccountDestination(res.next, safeNext);
      router.push(dest);
      router.refresh();
    });
  };

  return (
    <AccountShell
      title={`أهلاً بك، ${nickname}`}
      description="احفظ الأنواع التي تحب قراءتها ضمن تفضيلات حسابك، أو تخطَّ هذه الخطوة وابدأ التصفح."
      footer={
        isStaff ? (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">أنت مسجل كأحد أعضاء فريق العمل.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFinish(true)}
              className="h-11 w-full gap-2 text-primary hover:bg-primary/10"
            >
              <PenTool className="size-4" aria-hidden />
              <span>الانتقال مباشرة إلى استوديو المبدعين</span>
            </Button>
          </div>
        ) : (
          <p>
            <Link href="/" className="text-muted-foreground transition hover:text-foreground">
              تصفح المكتبة كزائر
            </Link>
          </p>
        )
      }
    >
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-xs font-semibold text-foreground">
            الأنواع المفضلة (اختياري)
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const active = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-primary/60 bg-primary/20 text-primary"
                      : "border-border/70 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                  aria-pressed={active}
                >
                  {active && <Check className="size-3.5" aria-hidden />}
                  <span>{g}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            disabled={isPending}
            onClick={() => handleFinish(false)}
            className="h-11 w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {selectedGenres.length > 0 ? "حفظ التفضيلات والمتابعة" : "متابعة"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleFinish(true)}
            className="h-11 w-full gap-2 border-border text-muted-foreground hover:text-foreground"
          >
            <span>تخطي هذه الخطوة</span>
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          </Button>
        </div>
      </div>
    </AccountShell>
  );
}

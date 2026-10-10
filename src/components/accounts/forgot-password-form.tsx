"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/account-actions";
import { AccountShell } from "@/components/accounts/account-shell";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailToUse = email.trim().toLowerCase();
    if (!emailToUse) return;

    startTransition(async () => {
      const res = await requestPasswordReset({ email: emailToUse });
      if (!res.ok) {
        setError(res.error ?? "تعذّر إرسال رابط الاستعادة حاليًا. يرجى المحاولة لاحقًا.");
        return;
      }
      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <AccountShell
        title="طلب استعادة كلمة المرور"
        description="تحقق من صندوق الوارد الخاص ببريدك الإلكتروني."
        footer={
          <div className="space-y-3">
            <p>
              <Link href="/login" className="font-semibold text-primary hover:underline">
                العودة لتسجيل الدخول
              </Link>
            </p>
            <p>
              <Link href="/" className="text-muted-foreground transition hover:text-foreground">
                الرئيسية
              </Link>
            </p>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="size-6" aria-hidden />
          </div>

          <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 text-xs leading-6 text-foreground/90">
            <p>
              إذا كان هذا البريد مسجلاً ونشطًا لدينا، فقد تم إرسال رابط آمن لاستعادة كلمة المرور إليه.
            </p>
            <p className="mt-2 text-muted-foreground">
              صلاحية الرابط ساعة واحدة فقط حرصًا على أمان حسابك.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setSubmitted(false)}
            className="h-11 w-full border-border text-xs"
          >
            إرسال طلب لبريد آخر
          </Button>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="استعادة كلمة المرور"
      description="أدخل بريدك الإلكتروني المسجل لنرسل لك رابطًا آمنًا لتعيين كلمة مرور جديدة."
      footer={
        <div className="space-y-3">
          <p>
            تذكرت كلمة المرور؟{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              تسجيل الدخول
            </Link>
          </p>
          <p>
            <Link href="/" className="text-muted-foreground transition hover:text-foreground">
              تصفح المكتبة كزائر
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="نموذج استعادة كلمة المرور">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">البريد الإلكتروني</Label>
          <Input
            id="forgot-email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="reader@example.com"
            className="h-11 bg-card text-left"
            autoComplete="email"
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending || !email.trim()}
          className="h-11 w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />}
          إرسال رابط الاستعادة
        </Button>
      </form>
    </AccountShell>
  );
}

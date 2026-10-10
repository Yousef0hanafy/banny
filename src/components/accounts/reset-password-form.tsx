"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, KeyRound, CheckCircle2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithToken } from "@/lib/account-actions";
import { AccountShell } from "@/components/accounts/account-shell";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token")?.trim() || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("رابط الاستعادة غير صالح أو يفتقر إلى الرمز.");
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setError("كلمة المرور يجب أن تكون بين ١٢ و١٢٨ حرفًا.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    startTransition(async () => {
      const res = await resetPasswordWithToken({ token, password });
      if (!res.ok) {
        setError(res.error ?? "تعذّر تعيين كلمة المرور. قد يكون الرابط منتهي الصلاحية أو تم استخدامه مسبقًا.");
        return;
      }
      setSuccess(true);
    });
  };

  if (!token) {
    return (
      <AccountShell
        title="رابط غير صالح"
        description="الرابط الذي اتبعته غير مكتمل أو منتهي الصلاحية."
        footer={
          <p>
            <Link href="/" className="text-muted-foreground transition hover:text-foreground">
              العودة للرئيسية
            </Link>
          </p>
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <AlertTriangle className="size-6" aria-hidden />
          </div>

          <p className="text-xs text-muted-foreground leading-5">
            لم نتمكن من العثور على رمز استعادة صالح. يرجى طلب رابط جديد لاستعادة كلمة المرور.
          </p>

          <Button asChild className="h-11 w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
            <Link href="/forgot-password">
              طلب رابط استعادة جديد
            </Link>
          </Button>
        </div>
      </AccountShell>
    );
  }

  if (success) {
    return (
      <AccountShell
        title="تم تغيير كلمة المرور"
        description="تم تعيين كلمة المرور الجديدة لحسابك بنجاح."
        footer={
          <p>
            <Link href="/" className="text-muted-foreground transition hover:text-foreground">
              العودة للرئيسية
            </Link>
          </p>
        }
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="size-8" aria-hidden />
          </div>

          <p className="text-sm text-foreground/90">
            تم إلغاء جميع الجلسات القديمة لحمايتك. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </p>

          <Button asChild className="h-11 w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
            <Link href="/login">
              تسجيل الدخول الآن
            </Link>
          </Button>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="تعيين كلمة مرور جديدة"
      description="أدخل كلمة مرور قوية مكونة من ١٢ حرفًا على الأقل."
      footer={
        <p>
          <Link href="/login" className="font-semibold text-primary hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      }
    >
      <form onSubmit={handleReset} className="space-y-4" aria-label="نموذج تعيين كلمة مرور جديدة">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="reset-new-password">كلمة المرور الجديدة</Label>
            <span className="text-[11px] text-muted-foreground">١٢ حرفًا على الأقل</span>
          </div>
          <div className="relative">
            <Input
              id="reset-new-password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="h-11 bg-card pe-10 text-left"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground transition hover:text-foreground"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reset-confirm-password">تأكيد كلمة المرور</Label>
          <Input
            id="reset-confirm-password"
            type={showPassword ? "text" : "password"}
            dir="ltr"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            className="h-11 bg-card text-left"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </div>

        {error && (
          <div role="alert" className="space-y-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
            <p>{error}</p>
            <p>
              <Link href="/forgot-password" className="font-bold underline hover:text-foreground">
                طلب رابط استعادة جديد
              </Link>
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />}
          حفظ كلمة المرور الجديدة
        </Button>
      </form>
    </AccountShell>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, AlertCircle, MailCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeAccountDestination } from "@/lib/account-destination";
import { verifyEmailToken, resendVerification } from "@/lib/account-actions";
import { AccountShell } from "@/components/accounts/account-shell";

export function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token")?.trim() || "";
  const initialEmail = params.get("email")?.trim() || "";
  const rawNext = params.get("next");
  const targetNext = safeAccountDestination(rawNext, "/");

  const [verified, setVerified] = useState(false);
  const [resolvedNext, setResolvedNext] = useState(targetNext);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Resend form state
  const [resendEmail, setResendEmail] = useState(initialEmail);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(!token);

  const [isPending, startTransition] = useTransition();

  const handleVerify = () => {
    if (!token) return;
    setError(null);
    if (password.length < 12 || password.length > 128 || password !== confirmPassword) {
      setError("اختر كلمة مرور من ١٢ إلى ١٢٨ حرفًا وأعد كتابتها للتأكيد.");
      return;
    }
    startTransition(async () => {
      const res = await verifyEmailToken({ token, password });
      if (!res.ok) {
        setError(res.error ?? "رمز التأكيد غير صالح أو انتهت صلاحيته (صلاحية الرمز ٢٤ ساعة).");
        return;
      }
      setVerified(true);
      if (res.next) {
        setResolvedNext(safeAccountDestination(res.next, targetNext));
      }
    });
  };

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus(null);
    setError(null);

    const emailToUse = resendEmail.trim().toLowerCase();
    if (!emailToUse) return;

    startTransition(async () => {
      const res = await resendVerification({
        email: emailToUse,
        next: resolvedNext,
      });

      if (res.ok) {
        setResendStatus(res.message ?? "إذا كان الحساب بانتظار التأكيد، ستصلك رسالة جديدة.");
      } else {
        setResendStatus(res.error ?? "تعذّر إرسال رابط التأكيد حاليًا. يرجى المحاولة لاحقًا.");
      }
    });
  };

  const loginHref = `/login?next=${encodeURIComponent(resolvedNext)}`;

  if (verified) {
    return (
      <AccountShell
        title="تم تأكيد البريد بنجاح"
        description="حسابك نشط الآن ويمكنك تسجيل الدخول لمزامنة تقدمك ومكتبتك."
        footer={
          <p>
            <Link href="/" className="text-muted-foreground transition hover:text-foreground">
              تصفح المكتبة كزائر
            </Link>
          </p>
        }
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="size-8" aria-hidden />
          </div>

          <p className="text-sm text-foreground/90">
            أصبح بإمكانك الآن تسجيل الدخول بحسابك ومواصلة القراءة.
          </p>

          <Button asChild className="h-11 w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
            <Link href={loginHref}>
              تسجيل الدخول ومتابعة القراءة
            </Link>
          </Button>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="تأكيد البريد الإلكتروني"
      description={token ? "ثبّت كلمة المرور التي ستستخدمها لحسابك، ثم أكّد بريدك الإلكتروني." : "إعادة إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني."}
      footer={
        <div className="space-y-3">
          <p>
            لديك حساب مفعّل؟{" "}
            <Link href={loginHref} className="font-semibold text-primary hover:underline">
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
      <div className="space-y-4">
        {token && !showResend ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-password">كلمة المرور</Label>
              <Input id="verify-password" type="password" dir="ltr" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} />
              <Label htmlFor="verify-confirm">تأكيد كلمة المرور</Label>
              <Input id="verify-confirm" type="password" dir="ltr" autoComplete="new-password" minLength={12} maxLength={128} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <p className="text-center text-xs leading-5 text-muted-foreground">
              لأمان حسابك، يتم تأكيد البريد فقط عند الضغط الصريح على هذا الزر.
            </p>

            {error && (
              <div role="alert" className="space-y-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 text-danger" aria-hidden />
                  <p>{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResend(true)}
                  className="font-bold text-foreground underline hover:text-primary"
                >
                  طلب رابط تأكيد جديد
                </button>
              </div>
            )}

            <Button
              type="button"
              disabled={isPending}
              onClick={handleVerify}
              className="h-11 w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <MailCheck className="size-4" aria-hidden />}
              تأكيد البريد الإلكتروني الآن
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-4" aria-label="نموذج إعادة إرسال رابط التأكيد">
            <div className="space-y-1.5">
              <Label htmlFor="resend-email">البريد الإلكتروني</Label>
              <Input
                id="resend-email"
                type="email"
                dir="ltr"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="reader@example.com"
                className="h-11 bg-card text-left"
                autoComplete="email"
                required
              />
            </div>

            {resendStatus && (
              <p
                role="status"
                className="rounded-xl border border-border/80 bg-secondary/30 p-3 text-xs text-foreground/90"
              >
                {resendStatus}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending || !resendEmail.trim()}
              className="h-11 w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Mail className="size-4" aria-hidden />}
              إرسال رابط تأكيد جديد
            </Button>

            {token && (
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setShowResend(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  العودة لمحاولة التأكيد بالرمز الحالي
                </button>
              </p>
            )}
          </form>
        )}
      </div>
    </AccountShell>
  );
}

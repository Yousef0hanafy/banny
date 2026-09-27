"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { BookOpenText, Loader2, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  { email: "admin@bunny.demo", password: "bunny-admin-2026", label: "حساب الإدارة", icon: ShieldCheck, hint: "لوحة الإدارة الكاملة" },
  { email: "reader@bunny.demo", password: "bunny-reader-2026", label: "حساب قارئ", icon: UserRound, hint: "مزامنة تقدم القراءة" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  function fill(acc: { email: string; password: string }) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/15 border border-primary/30 text-primary">
          <BookOpenText className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-foreground">مرحبًا بعودتك</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          سجّل الدخول لمزامنة تقدم قراءتك عبر جلساتك.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4" aria-label="نموذج تسجيل الدخول">
        <div className="space-y-1.5">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="reader@bunny.demo"
            className="bg-card text-left"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-card text-left"
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
          تسجيل الدخول
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        حسابات تجريبية جاهزة
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => fill(acc)}
            className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-3 text-start transition hover:border-primary/40 hover:bg-accent/40"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-secondary text-muted-foreground">
              <acc.icon className="size-4.5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">{acc.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">
                {acc.email}
              </span>
            </span>
            <span className="text-[11px] text-primary">تعبئة</span>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        نسخة تجريبية — التسجيل الجديد يعمل بحسابات تجريبية فقط.{" "}
        <Link href="/" className="text-primary hover:underline">
          العودة للرئيسية
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="bg-library-glow flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="size-9 animate-pulse rounded-full bg-accent" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

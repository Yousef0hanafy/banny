"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, LogIn } from "lucide-react";
import { BrandMark } from "@/components/library/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
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

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="mx-auto block w-20">
          <BrandMark className="size-20" alt="مكتبة باني" resolution={256} />
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
            placeholder="name@example.com"
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

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          العودة للرئيسية
        </Link>
      </p>
    </div>
  );
}

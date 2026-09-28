import { Suspense } from "react";
import { LoginForm } from "./login-form";

/**
 * Route segment config — REQUIRED for the nonce-based CSP (src/middleware.ts):
 * every HTML document must be dynamically rendered so its bootstrap scripts
 * carry the per-request nonce. Prerendered (static) HTML cannot hold a
 * per-request nonce and its scripts would be blocked by script-src. The
 * interactive form itself is a client component (./login-form).
 */
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="bg-library-glow flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="size-9 animate-pulse rounded-full bg-accent" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

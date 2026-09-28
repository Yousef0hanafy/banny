import type { NextConfig } from "next";

/**
 * Release C security hardening (docs/SECURITY_AUDIT.md §headers):
 * - ignoreBuildErrors removed: type safety net restored (typecheck is clean).
 * - reactStrictMode on: production unaffected; dev surfaces effect/hydration
 *   bugs (the #418 class) earlier.
 * - Security headers on every route. CSP is pragmatic (inline allowed) since
 *   Next.js bootstrap + NextAuth require it without a nonce infrastructure;
 *   the high-value directives (framing, object/embed, base-uri, referrer,
 *   MIME sniffing) are enforced. Nonce-based CSP documented as deferred in
 *   docs/SECURITY_AUDIT.md.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

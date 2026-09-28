import type { NextConfig } from "next";

/**
 * Release C security hardening (docs/SECURITY_AUDIT.md §headers), updated post-C:
 * - ignoreBuildErrors removed: type safety net restored (typecheck is clean).
 * - reactStrictMode on: production unaffected; dev surfaces effect/hydration
 *   bugs (the #418 class) earlier.
 * - Static security headers on EVERY route (documents, API, assets).
 * - Content-Security-Policy moved OUT of this file: it is now a per-request,
 *   nonce-based policy generated in src/middleware.ts (strict-dynamic), the
 *   official Next.js pattern — this clears audit finding A-1. CSP is only
 *   meaningful on documents; static headers here keep covering API/assets.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
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

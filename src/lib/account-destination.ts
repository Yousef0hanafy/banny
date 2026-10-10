export function safeAccountDestination(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  // Reject backslashes, control characters, null bytes
  if (/[\x00-\x1F\x7F\\]/.test(trimmed)) return fallback;

  // Must start with exactly one leading slash (not protocol-relative //)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;

  // Reject URLs with explicit schemes (e.g. /http:, /javascript:, etc.)
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return fallback;

  // Auth loop prevention: if next points to auth/login/register pages, fallback
  const normalized = trimmed.toLowerCase();
  const authRoutes = [
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/welcome",
  ];

  for (const route of authRoutes) {
    if (normalized === route || normalized.startsWith(`${route}?`) || normalized.startsWith(`${route}/`)) {
      return fallback;
    }
  }

  try {
    const parsed = new URL(trimmed, "https://bunny.invalid");
    if (parsed.origin !== "https://bunny.invalid") return fallback;
    let decodedPath = parsed.pathname;
    for (let i = 0; i < 2; i++) decodedPath = decodeURIComponent(decodedPath);
    if (decodedPath.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(decodedPath)) return fallback;
    if (authRoutes.some(route => decodedPath.toLowerCase() === route || decodedPath.toLowerCase().startsWith(`${route}/`))) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Brand mark — TEMPORARY placeholder (Release C).
 *
 * ⚠ The founder's actual rabbit logo (Blogo.jpg) never reached the server
 * (delivery failure #3). This neutral "ب" letter-mark is an explicitly
 * temporary stand-in so the app ships with a coherent brand until the real
 * asset arrives. SWAP POINT: when the logo is delivered, replace the <svg>
 * below (or an <Image> of the real asset) — the header, footer, and favicon
 * all consume this one component, and src/app/icon.svg mirrors the same mark.
 */
export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden focusable="false">
      <defs>
        <linearGradient id="brandmark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#171426" />
          <stop offset="100%" stopColor="#0B0B10" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="62" height="62" rx="16" fill="url(#brandmark-bg)" />
      <rect x="1" y="1" width="62" height="62" rx="16" fill="none" stroke="#9B7BFF" strokeOpacity="0.45" strokeWidth="2" />
      {/* ب — bowl */}
      <path d="M 17 39 Q 32 51 47 39" fill="none" stroke="#9B7BFF" strokeWidth="5.5" strokeLinecap="round" />
      {/* ب — dot (gold accent) */}
      <circle cx="32" cy="26" r="4" fill="#DDBB77" />
    </svg>
  );
}

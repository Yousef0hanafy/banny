"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/analytics";

/**
 * Global error boundary — last resort when the root layout itself fails.
 * Renders standalone HTML (no layout/chrome available). Sentry-ready via
 * the no-op placeholder in src/lib/analytics.ts.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest ?? null, scope: "global" });
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          background: "#0B0B10",
          color: "#EDEDF2",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: "20px", margin: 0 }}>تعذّر تحميل المكتبة</h1>
        <p style={{ color: "#9A9AA8", fontSize: "14px", lineHeight: 1.75, maxWidth: "420px", margin: 0 }}>
          خطأ عام منع المكتبة من الإقلاع. أعد المحاولة، وإن استمر فأعد تحميل الصفحة بعد قليل.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            border: "none",
            background: "#9B7BFF",
            color: "#0B0B10",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}

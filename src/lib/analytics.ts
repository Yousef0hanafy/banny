/**
 * Monitoring integration placeholders (Release C — docs/RELEASE_PLAN.md).
 *
 * NOTHING is sent anywhere today: every function is a documented no-op so the
 * prototype makes zero external calls (docs/DECISIONS.md D-05 privacy posture,
 * FD-6a). Activation is a one-step drop-in per provider:
 *
 * PostHog (product analytics):
 *   1. `bun add posthog-js` + set NEXT_PUBLIC_POSTHOG_KEY.
 *   2. Replace trackEvent()'s body with `posthog.capture(event, props)`.
 *   3. Initialize PostHogProvider in src/app/layout.tsx.
 *
 * Sentry (error reporting):
 *   1. `bun add @sentry/nextjs` + `npx @sentry/wizard -i nextjs`.
 *   2. captureError() becomes the SDK's automatic global handler; the explicit
 *      call inside src/app/error.tsx stays as belt-and-braces.
 */

type AnalyticsProps = Record<string, string | number | boolean | null>;

export function trackEvent(_event: string, _props?: AnalyticsProps): void {
  // No-op placeholder — see activation notes above.
  if (process.env.NODE_ENV === "development") {
    // Dev-only visibility of what WOULD be tracked, without any network call.
    console.debug(`[analytics:noop] ${_event}`, _props ?? {});
  }
}

export function captureError(_error: unknown, _context?: AnalyticsProps): void {
  // No-op placeholder — see activation notes above.
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics:noop] error captured", _context ?? {});
  }
}

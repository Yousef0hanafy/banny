import { NextResponse } from "next/server";
import { executeDuePublications } from "@/lib/editorial";
import { currentProfileOrNull } from "@/lib/queries";
import { isAdminRole } from "@/lib/team-access";
import { isAuthorizedScheduler } from "@/lib/scheduler-auth";

export const dynamic = "force-dynamic";

/**
 * Scheduled-publication trigger.
 *
 * Authorized callers:
 * 1. A scheduler presenting `Authorization: Bearer <secret>`, where the secret
 *    matches the nonempty EDITORIAL_CRON_SECRET or CRON_SECRET (the variable
 *    Vercel Cron sends automatically). POST (GitHub Actions / external
 *    scheduler) and GET (Vercel Cron) are both accepted for this caller.
 * 2. A signed-in admin session, POST only.
 */
async function runAsScheduler() {
  const result = await executeDuePublications(20, { system: true });
  return NextResponse.json({ ok: result.errors.length === 0, mode: "cron", publishedCount: result.publishedCount, errors: result.errors });
}

export async function POST(request: Request) {
  if (isAuthorizedScheduler(request)) return runAsScheduler();

  const profile = await currentProfileOrNull();
  if (profile && isAdminRole(profile.role)) {
    const result = await executeDuePublications(20, { system: false });
    return NextResponse.json({ ok: result.errors.length === 0, mode: "admin_session", publishedCount: result.publishedCount, errors: result.errors });
  }

  return NextResponse.json(
    { ok: false, error: "غير مصرح بالوصول إلى نقطة نشر الفصول المجدولة." },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  if (isAuthorizedScheduler(request)) return runAsScheduler();
  return NextResponse.json(
    { ok: false, error: "عمليات التعديل والنشر غير مسموحة عبر طريقة GET." },
    { status: 405 }
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ArrowRight, AlertCircle, ExternalLink, Inbox } from "lucide-react";
import { requireRole } from "@/lib/queries";
import { getLocalMailbox } from "@/lib/account-service";
import { isLocalMailAllowed, getTrustedAppOrigin } from "@/lib/account-mail";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "صندوق البريد المحلي — لوحة الإدارة",
};

/**
 * Safely parse plain text into segments and clickable links without dangerouslySetInnerHTML.
 */
function renderSafeTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|\/[a-zA-Z0-9_.~!$&'()*+,;=:@%/?#-]+)/g;
  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: "link", value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.substring(lastIndex) });
  }

  return (
    <span className="whitespace-pre-wrap break-all font-sans text-xs leading-6 text-foreground/90">
      {parts.map((p, idx) => {
        if (p.type === "link" && new URL(p.value, getTrustedAppOrigin()).origin === getTrustedAppOrigin()) {
          return (
            <a
              key={idx}
              href={p.value}
              className="font-mono text-primary underline hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{p.value}</span>
              <ExternalLink className="ms-1 inline size-3" aria-hidden />
            </a>
          );
        }
        return <span key={idx}>{p.value}</span>;
      })}
    </span>
  );
}

export default async function AdminMailboxPage() {
  const isAllowed = isLocalMailAllowed();

  if (!isAllowed) {
    notFound();
  }

  const me = await requireRole(["admin"]);
  const messages = await getLocalMailbox(me.id);

  return (
    <main className="mx-auto max-w-4xl p-4 pt-6 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
              aria-label="العودة لإدارة المستخدمين"
            >
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Mail className="size-6 text-primary" aria-hidden />
              صندوق البريد التجريبي المحلي
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            عرض الرسائل التي تم التقاطها في بيئة التطوير المحلية دون إرسالها إلى خوادم حقيقية.
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="border-border">
          <Link href="/admin/users">العودة للمستخدمين</Link>
        </Button>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
        <AlertCircle className="size-5 shrink-0 text-amber-400" aria-hidden />
        <p className="leading-5">
          <strong>تنبيه للمشغل:</strong> هذه الرسائل محلية بالكامل ولن تصل إلى صناديق بريد خارجية مثل Gmail. الروابط الموضحة أدناه تتضمن رموز التأكيد والاستعادة للاختبار المحلي.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-12 text-center">
          <Inbox className="mx-auto size-12 text-muted-foreground/40" aria-hidden />
          <h2 className="mt-3 text-base font-semibold text-foreground">لا توجد رسائل ملتقطة حاليًا</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            ستظهر هنا رسائل تأكيد البريد واستعادة كلمة المرور ودعوات الفريق عند إنشائها محليًا.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-xs"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div>
                  <span className="text-[11px] text-muted-foreground">إلى: </span>
                  <span className="font-mono text-xs font-bold text-foreground" dir="ltr">
                    {m.to}
                  </span>
                </div>
                <time className="text-[11px] text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString("ar-EG")}
                </time>
              </div>

              <div className="mb-3">
                <p className="text-sm font-bold text-foreground">{m.subject}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                {renderSafeTextWithLinks(m.text)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

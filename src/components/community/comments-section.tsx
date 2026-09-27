"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Flag, SendHorizonal, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { postComment, reportComment } from "@/lib/actions";
import type { CommentView } from "@/lib/queries";

function timeAgoAr(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "اليوم";
  if (days < 30) return `قبل ${days} يوم`;
  const months = Math.floor(days / 30);
  return `قبل ${months} شهر`;
}

/**
 * Community comments (Release B): visible list, signed-in posting, and a
 * report flow that flags the comment into the admin moderation queue.
 */
export function CommentsSection({
  seriesSlug,
  seriesTitle,
  chapterNumber,
  comments,
}: {
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber?: number;
  comments: CommentView[];
}) {
  const { status, data } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [reported, setReported] = useState<Set<string>>(new Set());

  const submit = () => {
    setError("");
    if (body.trim().length < 2) {
      setError("التعليق قصير جدًا");
      return;
    }
    startTransition(async () => {
      const res = await postComment({ seriesSlug, chapterNumber: chapterNumber ?? null, body });
      if (!res.ok) {
        setError(res.error === "unauthenticated" ? "سجّل الدخول أولًا" : "تعذّر نشر التعليق");
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  const report = (commentId: string) => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      const res = await reportComment({ commentId });
      if (res.ok) {
        setReported((s) => new Set(s).add(commentId));
        router.refresh();
      }
    });
  };

  return (
    <section aria-label="التعليقات" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">التعليقات {comments.length > 0 && <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>}</h2>
      </div>

      {status === "authenticated" ? (
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <label htmlFor="comment-body" className="mb-2 block text-sm font-medium">
            شاركنا رأيك في «{seriesTitle}»
          </label>
          <Textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="اكتب تعليقًا محترمًا…"
            className="resize-none"
          />
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{data?.user?.name} · يظهر تعليقك للجميع</span>
            <Button size="sm" disabled={pending} onClick={submit} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <SendHorizonal className="size-3.5" aria-hidden />
              نشر
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            سجّل الدخول
          </Link>{" "}
          للانضمام إلى النقاش.
        </p>
      )}

      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-start gap-3">
              <Avatar className="size-9 border border-border">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                  {c.author.nickname.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.author.nickname}</span>
                  {c.author.role !== "reader" && (
                    <span className="flex items-center gap-1 rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold">
                      <ShieldAlert className="size-3" aria-hidden />
                      فريق باني
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">{timeAgoAr(c.createdAt)}</span>
                  {c.chapterNumber !== null && (
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      عن الفصل {c.chapterNumber}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{c.body}</p>
              </div>
              <button
                onClick={() => report(c.id)}
                disabled={reported.has(c.id)}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-danger disabled:opacity-50"
                title={reported.has(c.id) ? "تم إرسال البلاغ" : "إبلاغ عن تعليق مخالف"}
                aria-label="إبلاغ عن تعليق مخالف"
              >
                <Flag className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
            لا تعليقات بعد — كن أول من يشارك رأيه.
          </li>
        )}
      </ul>
    </section>
  );
}

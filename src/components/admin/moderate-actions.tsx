"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteComment, moderateComment } from "@/lib/actions";

/** Moderation controls: hide/restore or permanently delete a comment. */
export function ModerateActions({ commentId, status }: { commentId: string; status: "flagged" | "hidden" }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <div className="flex gap-2">
      {status === "flagged" ? (
        <Button size="sm" disabled={pending} variant="outline" className="h-8 gap-1.5 border-success/40 text-success hover:bg-success/10" onClick={() => run(() => moderateComment({ commentId, status: "visible" }))}>
          <Eye className="size-3.5" aria-hidden /> إبقاء ظاهرًا (تجاهل البلاغ)
        </Button>
      ) : (
        <Button size="sm" disabled={pending} variant="outline" className="h-8 gap-1.5 border-success/40 text-success hover:bg-success/10" onClick={() => run(() => moderateComment({ commentId, status: "visible" }))}>
          <Eye className="size-3.5" aria-hidden /> إعادة الظهور
        </Button>
      )}
      {status === "flagged" && (
        <Button size="sm" disabled={pending} variant="outline" className="h-8 gap-1.5 border-gold/40 text-gold hover:bg-gold/10" onClick={() => run(() => moderateComment({ commentId, status: "hidden" }))}>
          <EyeOff className="size-3.5" aria-hidden /> إخفاء
        </Button>
      )}
      <Button size="sm" disabled={pending} variant="outline" className="h-8 gap-1.5 border-danger/40 text-danger hover:bg-danger/10" onClick={() => run(() => deleteComment({ commentId }))}>
        <Trash2 className="size-3.5" aria-hidden /> حذف نهائي
      </Button>
    </div>
  );
}

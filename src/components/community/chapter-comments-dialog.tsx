"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CommentsSection } from "@/components/community/comments-section";
import type { CommentView } from "@/lib/queries";

/**
 * Chapter-level comments for paged readers (Release E): a header trigger that
 * opens the shared CommentsSection scoped to this chapter inside a dialog.
 * The webtoon reader instead renders the section inline at the chapter end.
 */
export function ChapterCommentsDialog({
  seriesSlug,
  seriesTitle,
  chapterNumber,
  comments,
}: {
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
  comments: CommentView[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          aria-label={comments.length > 0 ? `تعليقات الفصل ${chapterNumber} — ${comments.length}` : "تعليقات الفصل"}
        >
          <MessageCircle className="size-4" aria-hidden />
          <span className="hidden sm:inline">التعليقات</span>
          {comments.length > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
              {comments.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-start text-base">
            تعليقات الفصل {chapterNumber} — {seriesTitle}
          </DialogTitle>
          <DialogDescription className="text-start text-xs">
            نقاش مخصص لهذا الفصل؛ تعليقات العمل الكاملة موجودة في صفحتها.
          </DialogDescription>
        </DialogHeader>
        <CommentsSection
          seriesSlug={seriesSlug}
          seriesTitle={seriesTitle}
          chapterNumber={chapterNumber}
          comments={comments}
        />
      </DialogContent>
    </Dialog>
  );
}

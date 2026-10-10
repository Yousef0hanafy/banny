"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { executeDuePublicationsAdminAction } from "@/lib/editorial-actions";
import { CalendarClock, Loader2 } from "lucide-react";

export function PublishDueAdminButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handlePublishDue() {
    startTransition(async () => {
      const res = await executeDuePublicationsAdminAction();
      if (!res.ok) {
        toast({
          title: "تعذّر نشر الفصول المستحقة",
          description: res.errors?.join(" · ") || res.error,
          variant: "destructive",
        });
        return;
      }

      if (res.publishedCount === 0) {
        toast({
          title: "لا توجد فصول مستحقة",
          description: "جميع الفصول المجدولة لم يحن موعد نشرها بعد.",
        });
      } else {
        toast({
          title: "تم النشر بنجاح!",
          description: `تم نشر ${res.publishedCount} فصل/فصول مستحقة في المكتبة.`,
        });
      }
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePublishDue}
      disabled={isPending}
      className="min-h-[44px] gap-2 border-primary/40 text-primary hover:bg-primary/10"
      title="فحص ونشر أي فصول مجدولة حان موعد نشرها"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <CalendarClock className="size-4" aria-hidden />
      )}
      نشر الفصول المستحقة
    </Button>
  );
}

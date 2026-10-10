"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markSeriesRead, setLibraryItem } from "@/lib/actions";
import { SHELF_LABELS, type Shelf } from "@/lib/constants";

/** Per-card library actions: mark everything read + quick shelf switch/remove. */
export function LibraryCardActions({ slug, shelf, title }: { slug: string; shelf: Shelf; title: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean }>) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await fn();
        if (!result.ok) {
          setError("تعذّر حفظ التغيير. حاول مرة أخرى.");
          return;
        }
        router.refresh();
      } catch {
        setError("تعذّر حفظ التغيير. تحقق من اتصالك وحاول مرة أخرى.");
      }
    });
  };

  return (
    <div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending} aria-label={`إدارة ${title}`} className="min-h-11 w-full gap-1.5 border-border text-sm text-muted-foreground">
          <MoreHorizontal className="size-3.5" aria-hidden />
          {pending ? "جارٍ الحفظ…" : "إدارة"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem disabled={pending} className="min-h-11 cursor-pointer" onClick={() => run(() => markSeriesRead(slug))}>
          <CheckCheck className="size-4 me-2" aria-hidden />
          تعليم الكل كمقروء
        </DropdownMenuItem>
        {(Object.keys(SHELF_LABELS) as Shelf[])
          .filter((s) => s !== shelf)
          .map((s) => (
            <DropdownMenuItem key={s} disabled={pending} className="min-h-11 cursor-pointer" onClick={() => run(() => setLibraryItem({ seriesSlug: slug, shelf: s }))}>
              نقل إلى: {SHELF_LABELS[s]}
            </DropdownMenuItem>
          ))}
        <DropdownMenuItem disabled={pending} className="min-h-11 cursor-pointer text-danger focus:text-danger" onClick={() => run(() => setLibraryItem({ seriesSlug: slug, shelf: null }))}>
          إزالة من المكتبة
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    {error && <p role="alert" className="mt-2 text-xs leading-6 text-danger">{error}</p>}
    </div>
  );
}

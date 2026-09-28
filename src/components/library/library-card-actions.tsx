"use client";

import { useTransition } from "react";
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
export function LibraryCardActions({ slug, shelf }: { slug: string; shelf: Shelf }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending} className="h-7 w-full gap-1.5 border-border text-xs text-muted-foreground">
          <MoreHorizontal className="size-3.5" aria-hidden />
          إدارة
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem className="cursor-pointer" onClick={() => run(() => markSeriesRead(slug))}>
          <CheckCheck className="size-4 me-2" aria-hidden />
          تعليم الكل كمقروء
        </DropdownMenuItem>
        {(Object.keys(SHELF_LABELS) as Shelf[])
          .filter((s) => s !== shelf)
          .map((s) => (
            <DropdownMenuItem key={s} className="cursor-pointer" onClick={() => run(() => setLibraryItem({ seriesSlug: slug, shelf: s }))}>
              نقل إلى: {SHELF_LABELS[s]}
            </DropdownMenuItem>
          ))}
        <DropdownMenuItem className="cursor-pointer text-danger focus:text-danger" onClick={() => run(() => setLibraryItem({ seriesSlug: slug, shelf: null }))}>
          إزالة من المكتبة
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

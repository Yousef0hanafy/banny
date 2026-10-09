"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bookmark, BookmarkCheck, BookMarked, CheckCheck, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { setLibraryItem } from "@/lib/actions";
import { SHELF_LABELS, type Shelf } from "@/lib/constants";

const SHELF_ICONS = { reading: Clock3, plan: BookMarked, finished: CheckCheck } as const;

export function LibraryButton({ slug, initialShelf, compact = false }: { slug: string; initialShelf: Shelf | null; compact?: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shelf, setShelf] = useOptimistic(initialShelf);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const label = shelf ? SHELF_LABELS[shelf] : "أضف إلى مكتبتي";
  const Icon = shelf ? SHELF_ICONS[shelf] : Bookmark;
  const apply = (next: Shelf | null) => {
    setError(null);
    startTransition(async () => {
      setShelf(next);
      try {
        const result = await setLibraryItem({ seriesSlug: slug, shelf: next });
        if (!result.ok) { setError("تعذّر حفظ التغيير. حاول مرة أخرى."); return; }
        router.refresh();
      } catch { setError("تعذّر حفظ التغيير. تحقق من اتصالك وحاول مرة أخرى."); }
    });
  };
  const button = (
    <Button size="lg" variant="outline" disabled={pending || status === "loading"}
      aria-label={label} aria-describedby={error ? errorId : undefined}
      className={"h-11 gap-2 " + (shelf ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15" : "border-border") + " " + (compact ? "w-11 px-0 lg:w-auto lg:px-4" : "")}
      onClick={shelf && status === "authenticated" ? undefined : () => status === "unauthenticated" ? router.push("/login") : apply("reading")}>
      <Icon className="size-4" aria-hidden />
      <span className={compact ? "hidden lg:inline" : ""}>{label}</span>
    </Button>
  );
  return (
    <div className="relative shrink-0">
      {shelf && status === "authenticated" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {(Object.keys(SHELF_LABELS) as Shelf[]).map(s => (
              <DropdownMenuItem key={s} className="min-h-11 cursor-pointer" onClick={() => apply(s)}>
                {SHELF_LABELS[s]}
                {s === shelf && <BookmarkCheck className="ms-auto size-4 text-primary" aria-hidden />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11 cursor-pointer text-danger focus:text-danger" onClick={() => apply(null)}>إزالة من مكتبتي</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : button}
      {error && <p id={errorId} role="alert" className="absolute end-0 top-full z-20 mt-2 w-56 rounded-lg border border-danger/40 bg-card p-3 text-xs leading-6 text-danger">{error}</p>}
    </div>
  );
}

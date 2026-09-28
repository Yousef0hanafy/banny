"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookmarkCheck, BookMarked, CheckCheck, Clock3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLibraryItem } from "@/lib/actions";
import { SHELF_LABELS, type Shelf } from "@/lib/constants";

const SHELF_ICONS = { reading: Clock3, plan: BookMarked, finished: CheckCheck } as const;

/**
 * Personal-library control (Release B). Guests are sent to login;
 * signed-in readers add / switch shelf / remove via the Server Action.
 */
export function LibraryButton({ slug, initialShelf }: { slug: string; initialShelf: Shelf | null }) {
  const { status } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shelf, setShelf] = useOptimistic(initialShelf);

  if (status === "unauthenticated") {
    return (
      <Button
        size="lg"
        variant="outline"
        className="gap-2 border-border text-muted-foreground"
        onClick={() => router.push("/login")}
      >
        <Plus className="size-4" aria-hidden />
        أضف إلى مكتبتي
      </Button>
    );
  }

  const apply = (next: Shelf | null) => {
    startTransition(async () => {
      setShelf(next);
      await setLibraryItem({ seriesSlug: slug, shelf: next });
      router.refresh();
    });
  };

  if (shelf) {
    const Icon = SHELF_ICONS[shelf];
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            variant="outline"
            disabled={pending}
            className="gap-2 border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
          >
            <Icon className="size-4" aria-hidden />
            {SHELF_LABELS[shelf]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {(Object.keys(SHELF_LABELS) as Shelf[]).map((s) => (
            <DropdownMenuItem key={s} className="cursor-pointer" onClick={() => apply(s)}>
              {SHELF_LABELS[s]}
              {s === shelf && <BookmarkCheck className="size-4 ms-auto text-primary" aria-hidden />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-danger focus:text-danger" onClick={() => apply(null)}>
            إزالة من مكتبتي
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button size="lg" variant="outline" disabled={pending} className="gap-2 border-border" onClick={() => apply("reading")}>
      <Plus className="size-4" aria-hidden />
      أضف إلى مكتبتي
    </Button>
  );
}

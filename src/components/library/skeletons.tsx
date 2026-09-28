import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeletons (Release C — "Arabic skeletons" per docs/RELEASE_PLAN.md).
 * Shared by the per-route loading.tsx files; shapes mirror each surface's
 * real layout so navigation feels continuous. Purely decorative — hidden
 * from assistive tech, which instead hears the route's page title.
 */

export function CardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="h-52 w-full animate-pulse rounded-2xl bg-accent/70 sm:h-64 sm:w-[420px]" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2.5">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeriesPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <Skeleton className="aspect-[2/3] w-40 shrink-0 rounded-xl sm:w-52" />
        <div className="flex-1 space-y-3 pt-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-4/6" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </div>
      <div className="mt-10 space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ListRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Skeleton className="h-9 w-48 rounded-lg" />
      <div className="mt-6 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
            <Skeleton className="aspect-[2/3] h-16 w-11 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Immersive reader loading — dark, centered, no chrome flash. */
export function ReaderSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080C]">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite" aria-label="جارٍ تحميل الفصل">
        <div className="flex gap-1.5">
          <span className="size-2.5 animate-pulse rounded-full bg-primary/80 [animation-delay:0ms]" />
          <span className="size-2.5 animate-pulse rounded-full bg-primary/80 [animation-delay:150ms]" />
          <span className="size-2.5 animate-pulse rounded-full bg-primary/80 [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-muted-foreground">نُجهّز الفصل…</p>
      </div>
    </div>
  );
}

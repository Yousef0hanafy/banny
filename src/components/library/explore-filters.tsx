"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENRES, FORMATS, FORMAT_LABELS, SERIES_STATUSES, STATUS_LABELS } from "@/lib/constants";

export function ExploreFilterBar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      startTransition(() => router.replace(`/explore?${next.toString()}`, { scroll: false }));
    },
    [params, router]
  );

  const hasFilters = ["q", "format", "genre", "status", "sort"].some((k) => params.get(k));

  return (
    <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-border/50 bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || null });
        }}
        role="search"
      >
        <div className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بعنوان العمل أو مؤلفه…"
            className="pe-10 bg-card"
            aria-label="البحث في المكتبة"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                update({ q: null });
              }}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="مسح البحث"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select value={params.get("format") ?? "all"} onValueChange={(v) => update({ format: v === "all" ? null : v })}>
          <SelectTrigger size="sm" className="w-[130px] bg-card" aria-label="نوع المحتوى">
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {FORMATS.map((f) => (
              <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={params.get("status") ?? "all"} onValueChange={(v) => update({ status: v === "all" ? null : v })}>
          <SelectTrigger size="sm" className="w-[140px] bg-card" aria-label="حالة العمل">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {SERIES_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={params.get("genre") ?? "all"} onValueChange={(v) => update({ genre: v === "all" ? null : v })}>
          <SelectTrigger size="sm" className="w-[150px] bg-card" aria-label="التصنيف">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ms-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <SlidersHorizontal className="size-3.5" aria-hidden />
            {pending ? "جارٍ التحديث…" : `${resultCount} عمل`}
          </span>
          <Select value={params.get("sort") ?? "popular"} onValueChange={(v) => update({ sort: v })}>
            <SelectTrigger size="sm" className="w-[130px] bg-card" aria-label="الترتيب">
              <SelectValue placeholder="الترتيب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">الأكثر رواجًا</SelectItem>
              <SelectItem value="newest">الأحدث تحديثًا</SelectItem>
              <SelectItem value="rating">الأعلى تقييمًا</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setQ("");
                startTransition(() => router.replace("/explore", { scroll: false }));
              }}
            >
              مسح الكل
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

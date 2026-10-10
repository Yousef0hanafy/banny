import Image from "next/image";
import Link from "next/link";
import { BookOpen, Layers, BookText, Palette } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, type Category } from "@/lib/constants";

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  manga: BookOpen,
  manhwa: Layers,
  novel: BookText,
  comic: Palette,
};

export function HomeCategories({
  categoryCovers,
}: {
  categoryCovers?: Partial<Record<Category, string>>;
}) {
  return (
    <section className="mt-4 sm:mt-5" aria-label="أقسام المكتبة">
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || BookOpen;
          const label = CATEGORY_LABELS[cat];
          const description = CATEGORY_DESCRIPTIONS[cat];
          const cover = categoryCovers?.[cat];

          return (
            <Link
              key={cat}
              href={`/explore?category=${cat}`}
              className="group relative flex h-20 min-w-0 flex-col justify-end overflow-hidden rounded-lg border border-border bg-card p-2 transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-24 sm:p-4"
            >
              {/* Cover Art Backdrop */}
              {cover && <div className="absolute inset-0 z-0">
                <Image
                  src={cover}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 25vw, 280px"
                  className="object-cover object-[50%_25%] opacity-65 transition duration-500 group-hover:scale-105"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent sm:bg-gradient-to-l sm:from-background/95 sm:via-background/65" />
              </div>}

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="grid size-6 shrink-0 place-items-center text-foreground sm:size-8">
                  <Icon className="size-5" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-foreground transition group-hover:text-primary sm:text-base">
                    {label}
                  </span>
                  <span className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">
                    {description}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

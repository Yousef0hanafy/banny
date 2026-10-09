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
    <section className="mt-8 sm:mt-10" aria-label="أقسام المكتبة">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || BookOpen;
          const label = CATEGORY_LABELS[cat];
          const description = CATEGORY_DESCRIPTIONS[cat];
          const cover = categoryCovers?.[cat];

          return (
            <Link
              key={cat}
              href={`/explore?category=${cat}`}
              className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-border/70 bg-[#191C25] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_8px_24px_-8px_rgba(180,151,239,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* Cover Art Backdrop */}
              {cover && <div className="absolute inset-0 z-0">
                <Image
                  src={cover}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover object-center opacity-30 transition duration-500 group-hover:scale-105 group-hover:opacity-40"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#191C25] via-[#191C25]/85 to-transparent" />
              </div>}

              {/* Content */}
              <div className="relative z-10 flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/80 bg-background/80 text-primary backdrop-blur">
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="block font-bold text-sm sm:text-base text-foreground transition group-hover:text-primary">
                    {label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
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

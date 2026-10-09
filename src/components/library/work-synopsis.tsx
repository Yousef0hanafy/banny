"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function WorkSynopsis({
  synopsis,
  className = "",
}: {
  synopsis: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const isLong = synopsis.length > 200;

  return (
    <div className={`text-sm leading-relaxed text-foreground/90 ${className}`}>
      <p id={contentId} className={`text-balance-ar ${!expanded && isLong ? "line-clamp-3 sm:line-clamp-4" : ""}`}>
        {synopsis}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-md text-xs font-semibold text-primary transition hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-ring"
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <span>{expanded ? "عرض أقل" : "اقرأ المزيد"}</span>
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      )}
    </div>
  );
}

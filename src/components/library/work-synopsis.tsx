"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function WorkSynopsis({
  synopsis,
  className = "",
}: {
  synopsis: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = synopsis.length > 200;

  return (
    <div className={`text-sm leading-relaxed text-foreground/90 ${className}`}>
      <p className={`text-balance-ar ${!expanded && isLong ? "line-clamp-3 sm:line-clamp-4" : ""}`}>
        {synopsis}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary/80"
          aria-expanded={expanded}
        >
          <span>{expanded ? "عرض أقل" : "اقرأ المزيد"}</span>
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      )}
    </div>
  );
}

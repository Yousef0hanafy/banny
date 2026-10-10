"use client";

import Image from "next/image";
import { useState } from "react";

export function ReaderImage({ src, alt, width, height, sizes, eager = false }: {
  src: string; alt: string; width: number; height: number; sizes: string; eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <div className="relative w-full" style={{ aspectRatio: `${width}/${height}` }}>
    {!failed ? <Image key={attempt} src={src} alt={alt} fill sizes={sizes} className="object-contain"
      loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} /> :
      <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card px-4 text-center"
        onClick={event => event.stopPropagation()}>
        <p className="text-sm font-semibold">تعذّر تحميل {alt}</p>
        <button type="button" className="min-h-11 rounded-lg border border-border px-4 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>إعادة المحاولة</button>
      </div>}
  </div>;
}

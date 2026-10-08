import type { Format } from "@/lib/constants";

export function readerHref(format: Format, seriesSlug: string, chapterNumber: number): string {
  return `/read/${format}/${seriesSlug}/${chapterNumber}`;
}

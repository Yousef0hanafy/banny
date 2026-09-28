"use client";

/**
 * Guest/mirror reading progress in localStorage (docs/DECISIONS.md D-16, D-25).
 * Signed-in users also persist via the saveReadingProgress Server Action;
 * this mirror is always written so the Continue Reading hero works instantly.
 */

export type LocalProgress = {
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  pageIndex: number;
  percent: number;
  total: number;
  format: "manga" | "webtoon" | "novel";
  coverPath: string;
  accent: string;
  updatedAt: number;
};

const KEY = "bunny.progress.v1";

export function readAllLocal(): LocalProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as LocalProgress[]) : [];
  } catch {
    return [];
  }
}

export function readLocal(seriesSlug: string): LocalProgress | null {
  const all = readAllLocal();
  return all.find((p) => p.seriesSlug === seriesSlug) ?? null;
}

export function writeLocal(p: Omit<LocalProgress, "updatedAt">) {
  if (typeof window === "undefined") return;
  try {
    const all = readAllLocal().filter((x) => x.seriesSlug !== p.seriesSlug);
    all.unshift({ ...p, updatedAt: Date.now() });
    window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 20)));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function hasReadLocal(seriesSlug: string, chapterNumber: number): boolean {
  const p = readLocal(seriesSlug);
  if (!p) return false;
  return p.chapterNumber > chapterNumber || (p.chapterNumber === chapterNumber && p.percent >= 99);
}

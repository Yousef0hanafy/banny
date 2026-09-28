/**
 * Arabic display labels for server-only vocabulary values rendered in UI.
 * (Kept separate from constants.ts to leave that module as the zod/JWT source of truth.)
 */
export const EVENT_LABELS: Record<string, string> = {
  read_start: "بدأ قراءة",
  read_page: "واصل القراءة",
  read_complete: "أتم فصلًا",
  login: "سجّل الدخول",
  publish: "نُشر فصل",
};

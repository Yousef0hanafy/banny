/**
 * Shared constants for the catalog/role vocabularies.
 * These values are ALSO enforced at the database level as native Postgres enums
 * (see prisma/schema.prisma — user_role, series_format, series_status,
 * chapter_workflow, reading_direction, analytics_event_type). This module remains
 * the source of truth for Arabic labels, zod schemas and JWT/session validation.
 */

export const ROLES = ["reader", "editor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const FORMATS = ["manga", "webtoon"] as const; // novel lands in Release B
export type Format = (typeof FORMATS)[number];
export const FORMAT_LABELS: Record<Format, string> = {
  manga: "مانجا",
  webtoon: "ويبتون",
};

export const SERIES_STATUSES = ["ongoing", "completed", "hiatus"] as const;
export type SeriesStatus = (typeof SERIES_STATUSES)[number];
export const STATUS_LABELS: Record<SeriesStatus, string> = {
  ongoing: "مستمر",
  completed: "مكتمل",
  hiatus: "متوقف مؤقتًا",
};

export const WORKFLOWS = ["draft", "review", "published"] as const;
export type Workflow = (typeof WORKFLOWS)[number];
export const WORKFLOW_LABELS: Record<Workflow, string> = {
  draft: "مسودة",
  review: "مراجعة",
  published: "منشور",
};

export const READING_DIRECTIONS = ["rtl", "ltr"] as const;
export type ReadingDirection = (typeof READING_DIRECTIONS)[number];

export const GENRES = [
  "فانتازيا",
  "أكشن",
  "رومانسي",
  "غموض",
  "تاريخي",
  "خيال علمي",
  "شريحة من الحياة",
  "دراما",
  "رعب",
  "كوميديا",
] as const;

export const EVENT_TYPES = [
  "read_start",
  "read_page",
  "read_complete",
  "login",
  "publish",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}
export function isFormat(v: unknown): v is Format {
  return typeof v === "string" && (FORMATS as readonly string[]).includes(v);
}
export function isSeriesStatus(v: unknown): v is SeriesStatus {
  return typeof v === "string" && (SERIES_STATUSES as readonly string[]).includes(v);
}
export function isWorkflow(v: unknown): v is Workflow {
  return typeof v === "string" && (WORKFLOWS as readonly string[]).includes(v);
}
export function isReadingDirection(v: unknown): v is ReadingDirection {
  return typeof v === "string" && (READING_DIRECTIONS as readonly string[]).includes(v);
}

import type { Category, Format } from './constants';

/** Null is reserved for genuinely unclassified legacy records. */
export function categoryMatchesFormat(category: Category | null | undefined, format: Format): boolean {
  return category == null || (category === 'novel') === (format === 'novel');
}

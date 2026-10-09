import { describe, expect, test } from 'bun:test';
import { categoryMatchesFormat } from '../src/lib/content-category';

describe('content category is independent of visual reader layout', () => {
  test('all visual categories accept pages and vertical scroll', () => {
    for (const category of ['manga', 'manhwa', 'comic'] as const) {
      expect(categoryMatchesFormat(category, 'manga')).toBe(true);
      expect(categoryMatchesFormat(category, 'webtoon')).toBe(true);
      expect(categoryMatchesFormat(category, 'novel')).toBe(false);
    }
  });
  test('novels require the text reader', () => {
    expect(categoryMatchesFormat('novel', 'novel')).toBe(true);
    expect(categoryMatchesFormat('novel', 'manga')).toBe(false);
    expect(categoryMatchesFormat('novel', 'webtoon')).toBe(false);
  });
  test('legacy unknown category remains valid without guessing its identity', () => {
    expect(categoryMatchesFormat(null, 'webtoon')).toBe(true);
    expect(categoryMatchesFormat(undefined, 'manga')).toBe(true);
  });
});

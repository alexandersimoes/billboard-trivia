import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });

test('comparison percentiles are conservative about ties and small samples', async () => {
  const { comparisonFromCounts, ordinal, bestStreak } = await import('../lib/result-stats');
  expect(comparisonFromCounts(9, 9)).toBeNull();
  expect(comparisonFromCounts(100, 95)).toEqual({ games: 100, percentile: 95, topPercent: 5 });
  expect(comparisonFromCounts(10, 10)).toEqual({ games: 10, percentile: 100, topPercent: 1 });
  expect(comparisonFromCounts(20, 0)).toEqual({ games: 20, percentile: 0, topPercent: 100 });
  expect(comparisonFromCounts(30, 20)?.percentile).toBe(66);
  expect([1, 2, 3, 11, 12, 13, 21, 100].map(ordinal)).toEqual(['st', 'nd', 'rd', 'th', 'th', 'th', 'st', 'th']);
  expect(bestStreak({ 0: 'right', 1: 'right', 3: 'right', 4: 'right', 5: 'right' }, 6)).toBe(3);
});

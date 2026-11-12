import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page, comparison: 'ready' | 'sparse' | 'error' = 'ready') {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = async () => {};
    HTMLMediaElement.prototype.pause = () => {};
    // The iTunes lookup identifies the answer without depending on shuffled order.
    const fetchOriginal = window.fetch;
    window.fetch = async (...args) => {
      const url = String(args[0]);
      if (url.startsWith('https://itunes.apple.com/search')) {
        const term = new URL(url).searchParams.get('term') || '';
        (window as any).correctSong = term.match(/Test song \d+$/)?.[0];
      }
      return fetchOriginal(...args);
    };
  });
  const starts: Record<string, unknown>[] = [];
  const comparisonQueries: URL[] = [];
  await page.route('**/rest/v1/rpc/get_chart_date_range', route => route.fulfill({ json: [{ min_date: '1958-01-01', max_date: '2026-11-07' }] }));
  await page.route('**/rest/v1/rpc/get_distinct_dates', route => route.fulfill({ json: [{ date: '2024-01-06' }] }));
  const songs = Array.from({ length: 10 }, (_, i) => ({ song: `Test song ${i}`, artist: `Artist ${i}`, this_week: i + 1, last_week: null, peak_position: i + 1, weeks_on_chart: 3, date: '2024-01-06' }));
  await page.route('**/rest/v1/rpc/get_random_songs', route => {
    starts.push(route.request().postDataJSON());
    return route.fulfill({ json: songs });
  });
  await page.route('**/rest/v1/v_chart_entries?**', route => {
    starts.push(Object.fromEntries(new URL(route.request().url()).searchParams));
    return route.fulfill({ json: songs });
  });
  await page.route('https://itunes.apple.com/**', route => route.fulfill({ json: { results: [{ trackName: 'Test preview', artistName: 'Artist', previewUrl: 'https://example.test/preview.m4a' }] } }));
  await page.route('https://example.test/**', route => route.fulfill({ body: '', contentType: 'audio/mp4' }));
  await page.route('**/rest/v1/game_rounds?**', route => {
    const url = new URL(route.request().url());
    comparisonQueries.push(url);
    if (comparison === 'error') return route.fulfill({ status: 400, body: '' });
    const lower = url.searchParams.has('total_points');
    const genre = url.searchParams.has('genre');
    const count = comparison === 'sparse' ? 4 : genre ? lower ? 19 : 20 : lower ? 84 : 100;
    return route.fulfill({ body: '', headers: { 'content-range': `*/${count}`, 'access-control-expose-headers': 'content-range' } });
  });
  return { starts, comparisonQueries };
}

async function complete(page: Page, correct: boolean) {
  for (let i = 0; i < 10; i++) {
    await expect(page.getByRole('heading', { name: 'Which song is playing?' })).toBeVisible();
    const song = await page.evaluate(() => (window as any).correctSong as string);
    const options = page.locator('.option');
    const answer = page.getByText(song, { exact: true });
    await (correct ? options.filter({ has: answer }) : options.filter({ hasNot: answer }).first()).click();
    await page.getByRole('button', { name: i === 9 ? 'See results' : 'Next song', exact: true }).click();
  }
}

test('centered results count up, compare real cohorts, and replay the same settings', async ({ page }, testInfo) => {
  const { starts, comparisonQueries } = await setup(page);
  await page.goto('/trivia/country/?difficulty=easy&era=1990');
  await page.getByRole('button', { name: 'Play Country trivia' }).click();
  await complete(page, true);
  await expect(page.getByRole('heading', { name: 'A flawless set.' })).toBeVisible();
  await expect(page.locator('.results-comparison-value').first().locator('[aria-hidden="true"]')).toHaveText('5');
  await expect(page.getByText('You outscored 84% of 100 saved games.')).toBeVisible();
  await expect(page.locator('.results-stats > div').nth(1).locator('[aria-hidden="true"]')).toHaveText('100');
  expect(comparisonQueries).toHaveLength(4);
  expect(comparisonQueries.every(url => url.searchParams.get('mode') === 'eq.quick' && url.searchParams.get('difficulty') === 'eq.easy')).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bounds = await page.locator('.results-stage').boundingBox();
  expect(Math.abs(bounds!.x + bounds!.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(2);
  await page.screenshot({ path: testInfo.outputPath('country-results.png'), fullPage: true });
  await page.getByRole('button', { name: 'Try again?' }).click();
  await expect(page.getByRole('heading', { name: 'Which song is playing?' })).toBeVisible();
  expect(starts).toHaveLength(2);
  expect(starts[1]).toEqual(starts[0]);
  // Finish another set using the very same ten-song pool: no stale duplicate skips.
  await complete(page, true);
  await expect(page.getByRole('heading', { name: 'A flawless set.' })).toBeVisible();
  await page.getByRole('button', { name: 'Change selection' }).click();
  await expect(page.getByRole('button', { name: 'Easy', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '1990s' })).toHaveAttribute('aria-pressed', 'true');
});

test('low scores and sparse comparisons remain encouraging, with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setup(page, 'sparse');
  await page.goto('/trivia/country/?difficulty=easy');
  await page.getByRole('button', { name: 'Play Country trivia' }).click();
  await complete(page, false);
  await expect(page.getByRole('heading', { name: 'The next chorus is yours.' })).toBeVisible();
  await expect(page.getByText('We need 10 comparable saved games before showing a genre percentile.')).toBeVisible();
  expect(await page.locator('.results-hero').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await expect(page.getByText('Can you get 1 next time?')).toBeVisible();
});

test('comparison failures do not block results or a picked-week replay', async ({ page }) => {
  test.setTimeout(60000); // Includes ten intentional wheel animations.
  const { starts } = await setup(page, 'error');
  await page.goto('/trivia/country/?mode=specific&week=2024-01-06');
  await page.getByRole('button', { name: 'Play Country trivia' }).click();
  await complete(page, true);
  await expect(page.getByText('Your score is ready. Comparisons are taking a break—try the leaderboard later.')).toBeVisible();
  await page.getByRole('button', { name: 'Try again?' }).click();
  await expect(page.getByRole('heading', { name: 'Which song is playing?' })).toBeVisible();
  expect(starts).toHaveLength(2);
  expect(starts[1]).toEqual(starts[0]);
  expect(starts[1].date).toBe('eq.2024-01-06');
});

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Isolate navigation and settings from external database availability.
  await page.route('**/rest/v1/rpc/get_chart_date_range', route => route.fulfill({
    json: [{ min_date: '2013-01-26', max_date: '2026-11-07' }],
  }));
  await page.route('**/rest/v1/rpc/get_distinct_dates', route => route.fulfill({
    json: [{ date: '2024-01-06' }, { date: '2024-01-13' }],
  }));
  await page.route('**/rest/v1/game_rounds?**', route => route.fulfill({
    body: '', headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' },
  }));
});

test('genre navigation, history and illustrated scenes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Dance since 2013' }).click();
  await expect(page).toHaveURL(/\/trivia\/dance\/$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'disco');
  await expect(page.locator('.scene')).toBeHidden();
  expect(await page.locator('.sky').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('/scenes/dance/sky.webp');
  await page.getByRole('link', { name: 'Latin since 1994' }).click();
  await expect(page).toHaveURL(/\/trivia\/latin\/$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'plaza');
  expect(await page.locator('.ground-l').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('/scenes/latin/left.webp');
  await page.goBack();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'disco');
  expect(errors).toEqual([]);
});

test('shareable quick settings survive reload and copy', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => { (window as any).copied = text; } } });
  });
  await page.goto('/trivia/dance/?difficulty=hard&era=2010');
  await expect(page.getByRole('button', { name: 'Hard', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '2010s', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Easy', exact: true }).click();
  await expect(page).toHaveURL(/difficulty=easy&era=2010/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Easy', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Link copied!');
  expect(await page.evaluate(() => (window as any).copied)).toContain('/trivia/dance/?difficulty=easy&era=2010');
});

test('Pick a week defaults to the latest available week and updates the URL', async ({ page }) => {
  await page.route('**/rest/v1/rpc/get_chart_date_range', route => route.fulfill({
    json: [{ min_date: '2013-01-26', max_date: '2024-01-13' }],
  }));
  await page.goto('/trivia/dance/');
  await page.getByRole('button', { name: 'Pick a week' }).click();
  await expect(page.getByRole('combobox', { name: 'Year', exact: true })).toHaveValue('2024');
  await expect(page.getByRole('combobox', { name: 'Chart week' })).toHaveValue('2024-01-13');
  await expect(page.getByRole('button', { name: 'Play Dance trivia' })).toBeEnabled();
  await expect(page).toHaveURL(/mode=specific&week=2024-01-13/);
  await page.getByRole('combobox', { name: 'Chart week' }).selectOption('2024-01-06');
  await page.getByRole('button', { name: 'Quick play', exact: true }).click();
  await page.getByRole('button', { name: 'Pick a week' }).click();
  await expect(page.getByRole('combobox', { name: 'Chart week' })).toHaveValue('2024-01-13');
});

test('specific chart week restores after asynchronous date loading', async ({ page }) => {
  await page.goto('/trivia/latin/?mode=specific&week=2024-01-06');
  await expect(page.getByRole('button', { name: 'Pick a week' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', { name: 'Year', exact: true })).toHaveValue('2024');
  await expect(page.getByRole('combobox', { name: 'Chart week' })).toHaveValue('2024-01-06');
  await expect(page.getByRole('button', { name: 'Play Latin trivia' })).toBeEnabled();
  await page.getByRole('combobox', { name: 'Chart week' }).selectOption('2024-01-13');
  await expect(page).toHaveURL(/week=2024-01-13/);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Chart week' })).toHaveValue('2024-01-13');
});

test('invalid settings are normalized and unavailable weeks cannot start', async ({ page }) => {
  await page.goto('/trivia/dance/?difficulty=impossible&era=1900&mode=specific&week=2024-02-30');
  await expect(page).toHaveURL(/\/trivia\/dance\/\?mode=specific$/);
  await expect(page.getByRole('button', { name: 'Play Dance trivia' })).toBeDisabled();
  await page.goto('/trivia/dance/?mode=specific&week=2024-04-06');
  await expect(page.getByRole('combobox', { name: 'Chart week' })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Play Dance trivia' })).toBeDisabled();
});

test('clipboard denial provides a selectable link', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied'); } } });
  });
  await page.goto('/trivia/latin/');
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Quiz link', exact: true })).toHaveValue(/\/trivia\/latin\/$/);
});

test('guest can complete a quiz and share the result', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = async () => {};
    HTMLMediaElement.prototype.pause = () => {};
    Object.defineProperty(navigator, 'share', { value: undefined });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => { (window as any).copied = text; } } });
  });
  await page.route('**/rest/v1/rpc/get_random_songs', route => route.fulfill({
    json: Array.from({ length: 20 }, (_, i) => ({ song: `Test song ${i}`, artist: `Artist ${i}`, this_week: i + 1, last_week: null, peak_position: i + 1, weeks_on_chart: 3, date: '2024-01-06' })),
  }));
  await page.route('https://itunes.apple.com/**', route => route.fulfill({
    json: { results: [{ trackName: 'Test preview', artistName: 'Artist', previewUrl: 'https://example.test/preview.m4a' }] },
  }));
  await page.route('https://example.test/**', route => route.fulfill({ body: '', contentType: 'audio/mp4' }));
  await page.goto('/trivia/dance/?difficulty=easy&era=2010');
  await page.getByRole('button', { name: 'Play Dance trivia' }).click();
  for (let round = 0; round < 10; round++) {
    await expect(page.getByRole('heading', { name: 'Which song is playing?' })).toBeVisible();
    await expect(page.locator('.option')).toHaveCount(4);
    await page.locator('.option').first().click();
    await page.getByRole('button', { name: round === 9 ? 'See results' : 'Next song', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Try again?', exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View leaderboard' })).toHaveAttribute('href', '/leaderboard/?board=games');
  await expect(page.getByText('Guest scores aren’t saved.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Share result' }).click();
  expect(await page.evaluate(() => (window as any).copied)).toContain('/trivia/dance/?difficulty=easy&era=2010');
  expect(await page.evaluate(() => (window as any).copied)).toContain('I scored');
});

test('all genre pages export unique SEO and working artwork', async ({ request }) => {
  for (const genre of ['pop', 'streaming', 'spotify', 'global', 'rock', 'alternative', 'country', 'rnb', 'rap', 'dance', 'latin']) {
    const response = await request.get(`/trivia/${genre}/`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`href="https://trivia.rocks/trivia/${genre}/"`);
    expect(html).toContain('name="description"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card"');
    expect((await request.get(`/scenes/${genre}/left.webp`)).status()).toBe(200);
  }
  expect(await (await request.get('/sitemap.xml')).text()).toContain('https://trivia.rocks/trivia/dance/');
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://trivia.rocks/sitemap.xml');
});

test('landing layout has no horizontal overflow', async ({ page }, testInfo) => {
  await page.goto('/trivia/dance/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dance music trivia.');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dance.png'), fullPage: true });
  await page.goto('/trivia/latin/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('latin.png'), fullPage: true });
});

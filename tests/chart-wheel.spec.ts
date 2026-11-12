import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page, { blocked = false, failFirst = false } = {}) {
  await page.addInitScript(({ blocked }) => {
    (window as any).playEvents = [];
    let shouldBlock = blocked;
    HTMLMediaElement.prototype.play = async function () {
      (window as any).playEvents.push({
        spinning: document.querySelector('.chart-machine')?.getAttribute('data-spinning'),
        position: document.querySelector('.chart-wheel-position')?.textContent,
        song: (window as any).currentSong,
      });
      if (shouldBlock) { shouldBlock = false; throw new DOMException('Tap required', 'NotAllowedError'); }
    };
    HTMLMediaElement.prototype.pause = () => {};
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = String(args[0]);
      if (url.startsWith('https://itunes.apple.com/search')) {
        const term = new URL(url).searchParams.get('term') || '';
        (window as any).currentSong = term.match(/Mystery track \d+$/)?.[0];
      }
      return originalFetch(...args);
    };
  }, { blocked });
  await page.route('**/rest/v1/rpc/get_chart_date_range', route => route.fulfill({ json: [{ min_date: '2020-09-19', max_date: '2024-01-06' }] }));
  await page.route('**/rest/v1/rpc/get_distinct_dates', route => route.fulfill({ json: [{ date: '2024-01-06' }] }));
  await page.route('**/rest/v1/v_chart_entries?**', route => route.fulfill({ json: Array.from({ length: 200 }, (_, index) => ({
    song: `Mystery track ${index + 1}`, artist: `Singer ${index + 1}`, this_week: index + 1,
    last_week: index % 3 === 0 ? null : index + 3, peak_position: 1, weeks_on_chart: 5,
  })) }));
  let failedSong = '';
  await page.route('https://itunes.apple.com/**', route => {
    if (failFirst && !failedSong) {
      failedSong = new URL(route.request().url()).searchParams.get('term') || '';
      return route.fulfill({ json: { results: [] } });
    }
    return route.fulfill({ json: { results: [{ trackName: 'Preview', artistName: 'Singer', previewUrl: 'https://example.test/clip.m4a' }] } });
  });
  await page.route('https://example.test/**', route => route.fulfill({ body: '', contentType: 'audio/mp4' }));
  await page.route('**/rest/v1/game_rounds?**', route => route.fulfill({ body: '', headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } }));
  await page.goto('/trivia/global/?mode=specific&week=2024-01-06');
  await page.getByRole('button', { name: 'Play Global trivia' }).click();
  return { failedSong: () => failedSong };
}

test('wheel lands before playback, keeps titles secret, and reveals all 200 chart entries', async ({ page }, testInfo) => {
  await setup(page);
  const machine = page.getByRole('complementary', { name: 'Chart position wheel' });
  await expect(machine).toHaveAttribute('data-spinning', 'true');
  await expect(page.locator('.option')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).playEvents.length)).toBe(0);
  await expect(machine).not.toContainText('Mystery track');
  await expect(page.getByRole('heading', { name: 'Which song is playing?' })).toBeVisible();
  const first = await page.evaluate(() => (window as any).playEvents[0]);
  expect(first.spinning).toBe('false');
  expect(first.position).toBe(`No. ${first.song.split(' ').pop()}`);
  if (testInfo.project.name === 'mobile') await expect(page.locator('.option').last()).toBeInViewport();
  const gap = await page.evaluate(() => {
    const target = document.querySelector('.chart-wheel-target')!.getBoundingClientRect();
    return Math.min(...Array.from(document.querySelectorAll('.chart-wheel-row[data-active="true"]')).map(row => {
      const bounds = row.getBoundingClientRect();
      return Math.abs(bounds.y + bounds.height / 2 - target.y - target.height / 2);
    }));
  });
  expect(gap).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('chart-wheel.png'), fullPage: true });

  for (let index = 0; index < 10; index++) {
    if (index > 0) {
      await expect(machine).toHaveAttribute('data-spinning', 'true');
      await page.getByRole('button', { name: 'Skip spin' }).click();
      await expect(page.getByRole('heading', { name: 'Which song is playing?' })).toBeVisible();
    }
    const song = await page.evaluate(() => (window as any).currentSong as string);
    await page.locator('.option').filter({ has: page.getByText(song, { exact: true }) }).click();
    await expect(machine).toContainText(song);
    await expect(machine).toContainText(`${index + 1} positions uncovered`);
    await page.getByRole('button', { name: index === 9 ? 'See results' : 'Next song', exact: true }).click();
  }
  await expect(page.getByRole('region', { name: 'Full chart song list' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reveal the full list' }).click();
  await expect(page.locator('.chart-reveal-table tbody tr')).toHaveCount(200);
  await page.getByRole('searchbox', { name: 'Find a song or artist' }).fill('Mystery track 200');
  await expect(page.locator('.chart-reveal-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.chart-reveal-table tbody tr')).toContainText('Singer 200');
  await page.getByRole('searchbox', { name: 'Find a song or artist' }).fill('');
  await page.getByRole('checkbox', { name: 'From my quiz' }).check();
  await expect(page.locator('.chart-reveal-table tbody tr')).toHaveCount(10);
  await page.screenshot({ path: testInfo.outputPath('chart-reveal.png'), fullPage: true, animations: 'disabled' });
});

test('reduced motion lands instantly and autoplay rejection keeps the clock paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setup(page, { blocked: true });
  await expect(page.getByRole('button', { name: 'Play the clip' })).toBeVisible();
  await expect(page.locator('.chart-machine')).toHaveAttribute('data-spinning', 'false');
  await expect(page.locator('.timer-track')).toHaveCount(0);
  await expect(page.locator('.option')).toHaveCount(0);
  await page.getByRole('button', { name: 'Play the clip' }).click();
  await expect(page.getByRole('heading', { name: 'Which song is playing?' })).toBeVisible();
  await expect(page.locator('.timer-track')).toBeVisible();
});

test('missing preview selects a backup and lands on the actual song position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const state = await setup(page, { failFirst: true });
  await expect(page.getByRole('heading', { name: 'Which song is playing?' })).toBeVisible();
  const event = await page.evaluate(() => (window as any).playEvents[0]);
  expect(state.failedSong().match(/Mystery track \d+$/)?.[0]).not.toBe(event.song);
  expect(event.position).toBe(`No. ${event.song.split(' ').pop()}`);
  expect(event.spinning).toBe('false');
});

test('leaving during a spin cancels queued playback', async ({ page }) => {
  await setup(page);
  await expect(page.locator('.chart-machine')).toHaveAttribute('data-spinning', 'true');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'TuneTrivia', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play Global trivia' })).toBeVisible();
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => (window as any).playEvents.length)).toBe(0);
});

import { test, expect, type Page } from '@playwright/test';
import type { LeaderboardRound } from '../lib/leaderboard';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });

const completed = '2026-11-10T12:00:00Z';
function game(i: number, extra: Partial<LeaderboardRound> = {}): LeaderboardRound {
  return { id: `round-${String(i).padStart(4, '0')}`, user_id: `player-${i}`, total_points: 2000 - i,
    num_correct: 8, mode: 'quick', difficulty: 'hard', genre: i % 2 ? 'dance' : 'pop',
    decade_start: 2020, seed: null, started_at: completed, ended_at: completed, ...extra };
}

async function mockBoard(page: Page, rounds: LeaderboardRound[], pageCap = 500) {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  const offsets: number[] = [];
  await page.route('**/rest/v1/game_rounds?**', route => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get('offset') || 0);
    const limit = Math.min(Number(url.searchParams.get('limit') || 500), pageCap);
    offsets.push(offset);
    const rows = rounds.slice(offset, offset + limit);
    return route.fulfill({ json: rows, headers: {
      'content-range': `${offset}-${offset + rows.length - 1}/${rounds.length}`,
      'access-control-expose-headers': 'content-range',
    } });
  });
  await page.route('**/rest/v1/profiles?**', route => route.fulfill({ json:
    [...new Set(rounds.map(round => round.user_id))].map(user => ({ user_id: user, display_name: `Name ${user}`, username: null })),
  }));
  return offsets;
}

test('full pagination finds the selected game below the top 100', async ({ page }) => {
  // Deliberately cap the API below the requested page size, as Supabase can.
  const offsets = await mockBoard(page, Array.from({ length: 837 }, (_, i) => game(i)), 300);
  await page.goto('/leaderboard/?roundId=round-0836');
  const result = page.getByRole('status', { name: 'Your leaderboard result' });
  await expect(result).toContainText('#837');
  await expect(result).toContainText('Outside the displayed top 100');
  await expect(page.locator('[data-entry-id="round-0836"]')).toContainText('1,164');
  await expect(page.locator('.board-gap')).toBeVisible();
  expect(offsets).toEqual([0, 300, 600]);
  await page.getByRole('button', { name: 'Jump to row' }).click();
  await expect(page.locator('[data-entry-id="round-0836"]')).toBeInViewport();
});

test('players, weighting, weekly and genre filters update rankings and URL', async ({ page }) => {
  const rounds = [
    game(1, { user_id: 'alice', genre: 'dance', difficulty: 'easy', total_points: 900 }),
    game(2, { user_id: 'alice', genre: 'dance', difficulty: 'easy', total_points: 800 }),
    game(3, { user_id: 'bob', genre: 'rock', difficulty: 'hard', total_points: 2500, ended_at: '2026-11-08T23:59:59Z' }),
    game(4, { user_id: 'bob', genre: 'dance', difficulty: 'hard', total_points: 1000 }),
  ];
  await mockBoard(page, rounds);
  await page.goto('/leaderboard/');
  await expect(page.locator('.leaderboard-table tbody tr').first()).toContainText('Name alice');
  await expect(page.locator('.leaderboard-table tbody tr')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Rank players by' }).selectOption('total');
  await expect(page.locator('.leaderboard-table tbody tr').first()).toContainText('Name bob');
  await page.getByRole('button', { name: 'This week', exact: true }).click();
  await expect(page.locator('.leaderboard-table tbody tr').first()).toContainText('Name alice');
  await page.getByRole('combobox', { name: 'Genre / chart' }).selectOption('rock');
  await expect(page.getByText('No completed games match these filters yet.')).toBeVisible();
  await expect(page).toHaveURL(/period=week/);
  await expect(page).toHaveURL(/genre=rock/);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Genre / chart' })).toHaveValue('rock');
  await expect(page.getByRole('button', { name: 'This week', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('filtered-out games and guest highlight requests have useful explanations', async ({ page }) => {
  await mockBoard(page, [game(1)]);
  await page.goto('/leaderboard/?roundId=round-0001&genre=rock');
  await expect(page.getByRole('status', { name: 'Your leaderboard result' })).toContainText('outside the current filters');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('status', { name: 'Your leaderboard result' })).toContainText('#1');
  await page.goto('/leaderboard/?highlight=me');
  await expect(page.getByRole('status', { name: 'Your leaderboard result' })).toContainText('Guest games aren’t saved');
  await page.goto('/leaderboard/?roundId=missing');
  await expect(page.getByRole('status', { name: 'Your leaderboard result' })).toContainText('couldn’t be found');
});

test('highlight me finds the latest saved game and the player rank outside the top 100', async ({ page }) => {
  const rounds = Array.from({ length: 110 }, (_, i) => game(i));
  await mockBoard(page, rounds);
  const user = { id: 'player-109', aud: 'authenticated', role: 'authenticated', email: 'test@example.test', app_metadata: {}, user_metadata: { name: 'Test player' }, created_at: completed };
  const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  await page.route('**/auth/v1/**', route => route.fulfill({ json: user }));
  await page.addInitScript(({ key, user }) => localStorage.setItem(key, JSON.stringify({
    access_token: 'test-token', refresh_token: 'test-refresh', expires_at: 2000000000, expires_in: 3600, token_type: 'bearer', user,
  })), { key: `sb-${project}-auth-token`, user });
  await page.goto('/leaderboard/?highlight=me');
  await expect(page.getByRole('status', { name: 'Your leaderboard result' })).toContainText('Your game');
  await expect(page.getByRole('status', { name: 'Your leaderboard result' })).toContainText('#110');
  await expect(page.locator('[data-entry-id="round-0109"]')).toContainText('You');
  await page.getByRole('button', { name: 'Top players', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Your leaderboard result' })).toContainText('Your player ranking');
  await expect(page.locator('[data-entry-id="player-109"]')).toContainText('You');
  await page.goto('/leaderboard/');
  await page.getByRole('button', { name: 'Find my rank' }).click();
  await expect(page.getByRole('status', { name: 'Your leaderboard result' })).toContainText('Your player ranking');
});

test('average minimum and API failure show distinct states', async ({ page }) => {
  await mockBoard(page, [game(1)]);
  await page.goto('/leaderboard/?board=players&metric=average');
  await expect(page.getByRole('heading', { name: 'Five games earn a spot.' })).toBeVisible();
  await page.route('**/rest/v1/game_rounds?**', route => route.fulfill({ status: 400, json: { message: 'Unavailable' } }));
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('couldn’t load the full leaderboard');
  await expect(page.getByText('The stage is yours.')).toHaveCount(0);
});

test('leaderboard layout stays readable on desktop and mobile', async ({ page }, testInfo) => {
  await mockBoard(page, Array.from({ length: 12 }, (_, i) => game(i, { user_id: `player-${Math.floor(i / 3)}` })));
  await page.goto('/leaderboard/');
  await expect(page.locator('.leaderboard-table tbody tr')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('players.png'), fullPage: true });
  await page.getByRole('button', { name: 'Best games', exact: true }).click();
  await expect(page.locator('.leaderboard-table tbody tr')).toHaveCount(12);
  await page.screenshot({ path: testInfo.outputPath('games.png'), fullPage: true });
});

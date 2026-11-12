import { test, expect } from '@playwright/test';
import { adjustedScore, filterRounds, rankGames, rankPlayers, startOfWeek, type LeaderboardRound } from '../lib/leaderboard';

function game(id: string, user: string, points: number, extra: Partial<LeaderboardRound> = {}): LeaderboardRound {
  return { id, user_id: user, total_points: points, num_correct: 7, mode: 'quick', difficulty: 'easy', genre: 'pop',
    decade_start: null, seed: null, started_at: '2026-11-08T23:59:00Z', ended_at: '2026-11-09T00:00:00Z', ...extra };
}

test('best five removes bonuses and limits the contribution of extra games', () => {
  const rounds = [
    ...Array.from({ length: 6 }, (_, i) => game(`a${i}`, 'a', 1000)),
    ...Array.from({ length: 5 }, (_, i) => game(`b${i}`, 'b', 2250, { difficulty: 'hard' })),
  ];
  expect(rankPlayers(rounds, 'best-five').map(entry => [entry.userId, entry.score])).toEqual([['a', 5000], ['b', 4500]]);
  expect(rankPlayers(rounds, 'total').map(entry => [entry.userId, entry.score])).toEqual([['b', 11250], ['a', 6000]]);
  expect(adjustedScore(game('classic', 'c', 900, { mode: 'classic', difficulty: 'hard' }))).toBe(900);
});

test('average includes zero scores, requires five games, and ties share rank', () => {
  const rounds = [
    ...Array.from({ length: 5 }, (_, i) => game(`a${i}`, 'a', i === 4 ? 0 : 1000)),
    ...Array.from({ length: 5 }, (_, i) => game(`b${i}`, 'b', 800)),
    ...Array.from({ length: 4 }, (_, i) => game(`c${i}`, 'c', 1000)),
    ...Array.from({ length: 5 }, (_, i) => game(`d${i}`, 'd', 500)),
  ];
  expect(rankPlayers(rounds, 'average').map(entry => [entry.userId, entry.score, entry.rank])).toEqual([
    ['a', 800, 1], ['b', 800, 1], ['d', 500, 3],
  ]);
  expect(rankGames([game('a', 'a', 0), game('b', 'b', 100), game('c', 'c', 100)]).map(entry => entry.rank)).toEqual([1, 1, 3]);
});

test('week boundaries use Monday UTC and completion date; filters precede totals', () => {
  const now = new Date('2026-11-11T12:00:00Z');
  expect(startOfWeek(now).toISOString()).toBe('2026-11-09T00:00:00.000Z');
  expect(startOfWeek(new Date('2026-11-08T23:59:59Z')).toISOString()).toBe('2026-11-02T00:00:00.000Z');
  const rounds = [game('included', 'a', 500), game('old', 'a', 900, { ended_at: '2026-11-08T23:59:59Z' }),
    game('wrong-genre', 'a', 900, { genre: 'rock' }), game('future', 'a', 900, { ended_at: '2026-11-12T00:00:00Z' })];
  const matching = filterRounds(rounds, { period: 'week', genre: 'pop', mode: 'quick', difficulty: 'easy' }, now);
  expect(matching.map(round => round.id)).toEqual(['included']);
  expect(rankPlayers(matching, 'total')[0].score).toBe(500);
});

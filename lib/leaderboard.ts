export interface LeaderboardRound {
  id: string;
  user_id: string;
  genre: string;
  mode: 'classic' | 'quick';
  difficulty: 'easy' | 'medium' | 'hard' | null;
  decade_start: number | null;
  seed: string | null;
  started_at: string;
  ended_at: string;
  total_points: number;
  num_correct: number;
}

export type PlayerMetric = 'best-five' | 'total' | 'average';
export interface BoardFilters {
  period: 'all' | 'week';
  genre: string;
  mode: 'all' | 'quick' | 'classic';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
}

export interface RankedEntry {
  id: string;
  userId: string;
  rank: number;
  score: number;
  games: number;
  best: number;
  total: number;
  round?: LeaderboardRound;
}

export const METRICS: Record<PlayerMetric, { label: string; description: string }> = {
  'best-five': { label: 'Best five', description: 'Sum of each player’s five best adjusted scores. Fewer than five games still count; extra games can improve your best five.' },
  total: { label: 'Total points', description: 'Every completed game counts. Original points, including difficulty bonuses, reward both scores and time spent playing.' },
  average: { label: 'Average score', description: 'Average adjusted score across all matching games, including zero-score games. At least five games are required.' },
};

/** Calendar week starts Monday at 00:00 UTC, independent of the viewer's locale. */
export function startOfWeek(now: Date): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  return start;
}

/** Remove the quick-play multiplier; classic games have no multiplier. */
export function adjustedScore(round: LeaderboardRound): number {
  const multiplier = round.mode === 'quick'
    ? round.difficulty === 'hard' ? 2.5 : round.difficulty === 'medium' ? 1.5 : 1
    : 1;
  return round.total_points / multiplier;
}

export function filterRounds(rounds: LeaderboardRound[], filters: BoardFilters, now: Date): LeaderboardRound[] {
  const start = startOfWeek(now).getTime();
  return rounds.filter(round =>
    (filters.period === 'all' || (Date.parse(round.ended_at) >= start && Date.parse(round.ended_at) <= now.getTime()))
    && (filters.genre === 'all' || round.genre === filters.genre)
    && (filters.mode === 'all' || round.mode === filters.mode)
    && (filters.difficulty === 'all' || (round.mode === 'quick' && round.difficulty === filters.difficulty)));
}

function rank(entries: Omit<RankedEntry, 'rank'>[]): RankedEntry[] {
  // Rank on the displayed precision so visually equal scores really are tied.
  const sorted = entries.map(entry => ({ ...entry, score: Math.round(entry.score * 10) / 10 }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  let position = 0;
  return sorted.map((entry, i) => {
    if (i === 0 || entry.score !== sorted[i - 1].score) position = i + 1;
    return { ...entry, rank: position };
  });
}

export function rankGames(rounds: LeaderboardRound[]): RankedEntry[] {
  return rank(rounds.map(round => ({ id: round.id, userId: round.user_id, score: round.total_points,
    games: 1, total: round.total_points, best: round.total_points, round })));
}

export function rankPlayers(rounds: LeaderboardRound[], metric: PlayerMetric): RankedEntry[] {
  const players = new Map<string, LeaderboardRound[]>();
  for (const round of rounds) {
    const games = players.get(round.user_id) ?? [];
    games.push(round);
    players.set(round.user_id, games);
  }
  const entries: Omit<RankedEntry, 'rank'>[] = [];
  for (const [userId, games] of players) {
    if (metric === 'average' && games.length < 5) continue;
    const adjusted = games.map(adjustedScore).sort((a, b) => b - a);
    const total = games.reduce((sum, game) => sum + game.total_points, 0);
    const score = metric === 'total' ? total : metric === 'average'
      ? adjusted.reduce((sum, value) => sum + value, 0) / games.length
      : adjusted.slice(0, 5).reduce((sum, value) => sum + value, 0);
    entries.push({ id: userId, userId, score, games: games.length, total,
      best: games.reduce((best, game) => Math.max(best, game.total_points), 0) });
  }
  return rank(entries);
}

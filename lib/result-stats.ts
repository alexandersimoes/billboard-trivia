import { supabase } from './supabaseClient';

export const MIN_COMPARISON_GAMES = 10;
export interface Comparison { games: number; percentile: number; topPercent: number }
export interface ResultComparison { genre: Comparison | null; overall: Comparison | null }

// Strictly lower scores count as outscored. Ties never inflate the percentile.
export function comparisonFromCounts(games: number, lower: number): Comparison | null {
  if (games < MIN_COMPARISON_GAMES) return null;
  const percentile = Math.floor(100 * Math.min(games, Math.max(0, lower)) / games);
  return { games, percentile, topPercent: Math.max(1, 100 - percentile) };
}

export function bestStreak(results: Record<number, 'right' | 'wrong'>, total: number) {
  let best = 0, streak = 0;
  for (let i = 0; i < total; i++) {
    streak = results[i] === 'right' ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  return best;
}

export function ordinal(value: number) {
  const mod = value % 100;
  if (mod >= 11 && mod <= 13) return 'th';
  return value % 10 === 1 ? 'st' : value % 10 === 2 ? 'nd' : value % 10 === 3 ? 'rd' : 'th';
}

export async function loadResultComparison({ genre, mode, difficulty, score, roundId, signal }: {
  genre: string; mode: 'quick' | 'classic'; difficulty: 'easy' | 'medium' | 'hard';
  score: number; roundId: string | null; signal: AbortSignal;
}): Promise<ResultComparison> {
  const snapshot = new Date().toISOString();
  async function count(genreOnly: boolean, lowerOnly: boolean) {
    let query = supabase.from('game_rounds').select('id', { count: 'exact', head: true })
      .not('ended_at', 'is', null).lte('ended_at', snapshot).eq('mode', mode);
    if (mode === 'quick') query = query.eq('difficulty', difficulty);
    if (genreOnly) query = query.eq('genre', genre);
    if (roundId) query = query.neq('id', roundId);
    if (lowerOnly) query = query.lt('total_points', score);
    const { count, error } = await query.abortSignal(signal);
    if (error || count === null) throw new Error('Score comparisons are unavailable.');
    return count;
  }
  const [genreTotal, genreLower, total, lower] = await Promise.all([
    count(true, false), count(true, true), count(false, false), count(false, true),
  ]);
  return { genre: comparisonFromCounts(genreTotal, genreLower), overall: comparisonFromCounts(total, lower) };
}

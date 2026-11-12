import { supabase } from './supabaseClient';
import type { LeaderboardRound } from './leaderboard';

export async function loadLeaderboard(signal: AbortSignal, snapshot: string) {
  const rounds: LeaderboardRound[] = [];
  const pageSize = 500;
  let total: number | null = null;
  // Load the full public dataset, never mistake a capped API response for all games.
  // Fixed completion cutoff + unique ordering keeps pages stable as new games finish.
  do {
    const { data, error, count } = await supabase.from('game_rounds')
      .select('id,user_id,total_points,num_correct,genre,started_at,ended_at,seed,mode,difficulty,decade_start', { count: 'exact' })
      .not('ended_at', 'is', null).lte('ended_at', snapshot)
      .order('id', { ascending: true })
      .range(rounds.length, rounds.length + pageSize - 1).abortSignal(signal);
    if (error) throw error;
    if (count === null) throw new Error('The leaderboard count is unavailable.');
    total = count;
    if (!data?.length && rounds.length < total) throw new Error('The leaderboard response is incomplete.');
    rounds.push(...(data ?? []) as LeaderboardRound[]);
  } while (rounds.length < total);

  const names: Record<string, string> = {};
  const userIds = [...new Set(rounds.map(round => round.user_id))];
  let profilesUnavailable = false;
  for (let offset = 0; offset < userIds.length; offset += 100) {
    const { data, error } = await supabase.from('profiles').select('user_id,username,display_name')
      .in('user_id', userIds.slice(offset, offset + 100)).abortSignal(signal);
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (error) { profilesUnavailable = true; continue; }
    for (const profile of data ?? []) names[profile.user_id] = profile.display_name || profile.username || 'Anonymous';
  }
  return { rounds, names, profilesUnavailable };
}

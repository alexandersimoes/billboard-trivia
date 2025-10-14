import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (typeof window !== 'undefined') {
  console.log('Supabase URL configured:', !!supabaseUrl);
  console.log('Supabase Key configured:', !!supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

export interface Profile {
  user_id: string;
  username: string | null;
  created_at: string;
}

export interface GameRound {
  id: string;
  user_id: string;
  genre: string;
  chart_year: number;
  chart_week: number;
  seed: string | null;
  started_at: string;
  ended_at: string | null;
  total_points: number;
  num_correct: number;
  result: 'win' | 'loss' | null;
}

export interface Guess {
  id: string;
  round_id: string;
  user_id: string;
  question_index: number;
  track_id: string;
  options: any;
  chosen_id: string;
  is_correct: boolean;
  time_to_answer_ms: number;
  points_awarded: number;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  games_played: number;
  wins: number;
  losses: number;
  total_points: number;
  last_played_at: string | null;
}

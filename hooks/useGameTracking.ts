import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface Track {
  song: string;
  artist: string;
  this_week: number;
  last_week: number | null;
  peak_position: number;
  weeks_on_chart: number;
}

export function useGameTracking() {
  const currentRoundId = useRef<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize user session and keep it updated
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Start a new game round
  const startGameRound = async (
    genre: string,
    mode: 'classic' | 'quick',
    options: {
      chartYear?: number;
      chartWeek?: number;
      selectedWeek?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      decadeStart?: number | null;
    }
  ): Promise<string | null> => {
    if (!currentUserId) return null;

    try {
      // Generate a random seed for tracking
      const seed = options.selectedWeek || generateSeed();

      // Build the insert object based on mode
      const insertData: any = {
        user_id: currentUserId,
        mode,
        genre: mapGenre(genre),
        seed,
        started_at: new Date().toISOString(),
      };

      if (mode === 'classic') {
        // Classic mode: store chart_year and chart_week
        insertData.chart_year = options.chartYear;
        insertData.chart_week = options.chartWeek;
      } else if (mode === 'quick') {
        // Quick play mode: store difficulty and optionally decade_start
        insertData.difficulty = options.difficulty;
        if (options.decadeStart !== null && options.decadeStart !== undefined) {
          insertData.decade_start = options.decadeStart;
        }
      }

      const { data, error } = await supabase
        .from('game_rounds')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      currentRoundId.current = data.id;
      return data.id;
    } catch (error) {
      console.error('Error starting game round:', error);
      return null;
    }
  };

  // Generate a random seed (4 alphanumeric characters)
  const generateSeed = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let seed = '';
    for (let i = 0; i < 4; i++) {
      seed += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return seed;
  };

  // Record a guess
  const recordGuess = async (
    questionIndex: number,
    correctTrack: Track,
    chosenTrack: Track,
    options: Track[],
    timeElapsedMs: number,
    points: number
  ): Promise<void> => {
    if (!currentRoundId.current || !currentUserId) return;

    try {
      const trackId = `${correctTrack.song}-${correctTrack.artist}`;
      const chosenId = `${chosenTrack.song}-${chosenTrack.artist}`;
      const isCorrect = trackId === chosenId;

      await supabase.from('guesses').insert({
        round_id: currentRoundId.current,
        user_id: currentUserId,
        question_index: questionIndex + 1, // 1-indexed
        track_id: trackId,
        options: options.map(t => ({ song: t.song, artist: t.artist })),
        chosen_id: chosenId,
        is_correct: isCorrect,
        time_to_answer_ms: timeElapsedMs,
        points_awarded: points,
      });
    } catch (error) {
      console.error('Error recording guess:', error);
    }
  };

  // End the game round
  const endGameRound = async (
    totalPoints: number,
    numCorrect: number,
    totalQuestions: number
  ): Promise<void> => {
    if (!currentRoundId.current || !currentUserId) return;

    try {
      const result = numCorrect === totalQuestions ? 'win' : 'loss';

      // Update game round
      await supabase
        .from('game_rounds')
        .update({
          ended_at: new Date().toISOString(),
          total_points: totalPoints,
          num_correct: numCorrect,
          result,
        })
        .eq('id', currentRoundId.current);

      // Update user stats
      await updateUserStats(totalPoints, result);

      currentRoundId.current = null;
    } catch (error) {
      console.error('Error ending game round:', error);
    }
  };

  // Update user stats
  const updateUserStats = async (
    pointsEarned: number,
    result: 'win' | 'loss'
  ): Promise<void> => {
    if (!currentUserId) return;

    try {
      // Try to get existing stats
      const { data: existingStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (existingStats) {
        // Update existing stats
        await supabase
          .from('user_stats')
          .update({
            games_played: existingStats.games_played + 1,
            wins: existingStats.wins + (result === 'win' ? 1 : 0),
            losses: existingStats.losses + (result === 'loss' ? 1 : 0),
            total_points: existingStats.total_points + pointsEarned,
            last_played_at: new Date().toISOString(),
          })
          .eq('user_id', currentUserId);
      } else {
        // Create new stats
        await supabase.from('user_stats').insert({
          user_id: currentUserId,
          games_played: 1,
          wins: result === 'win' ? 1 : 0,
          losses: result === 'loss' ? 1 : 0,
          total_points: pointsEarned,
          last_played_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  // Map chart type to genre
  const mapGenre = (chartType: string): string => {
    const genreMap: Record<string, string> = {
      'hot-100': 'pop',
      'country': 'country',
      'rnb': 'rnb',
      'rap': 'rap',
      'alternative': 'alternative',
      'rock': 'rock',
      'latin': 'latin',
    };
    return genreMap[chartType] || 'other';
  };

  return {
    startGameRound,
    recordGuess,
    endGameRound,
  };
}

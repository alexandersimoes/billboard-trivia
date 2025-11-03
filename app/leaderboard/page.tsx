'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Audiowide } from 'next/font/google';
import Link from 'next/link';

const audiowide = Audiowide({ weight: '400', subsets: ['latin'] });

interface LeaderboardEntry {
  username: string | null;
  genre: string;
  started_at: string;
  seed: string | null;
  num_correct: number;
  total_points: number;
  mode: 'classic' | 'quick';
  difficulty: 'easy' | 'medium' | 'hard' | null;
  decade_start: number | null;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<'all' | 'classic' | 'quick'>('all');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // Get best rounds from all users
        let query = supabase
          .from('game_rounds')
          .select('total_points, num_correct, genre, started_at, seed, user_id, mode, difficulty, decade_start')
          .not('ended_at', 'is', null)
          .gt('num_correct', 0); // Only show games with at least 1 correct answer

        // Apply mode filter
        if (modeFilter !== 'all') {
          query = query.eq('mode', modeFilter);
        }

        const { data: roundsData, error: roundsError } = await query
          .order('total_points', { ascending: false })
          .limit(100);

        if (roundsError) throw roundsError;

        if (!roundsData || roundsData.length === 0) {
          setLeaderboard([]);
          return;
        }

        // Get all unique user IDs
        const userIds = [...new Set(roundsData.map(r => r.user_id))];

        // Fetch usernames for all users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Continue anyway with Anonymous usernames
        }

        // Create a map of user_id to display_name (fallback to username)
        const usernameMap = new Map(
          profilesData?.map(p => [p.user_id, p.display_name || p.username]) || []
        );

        // Transform data to match leaderboard format
        const data = roundsData.map((row) => ({
          username: usernameMap.get(row.user_id) || 'Anonymous',
          genre: row.genre,
          started_at: row.started_at,
          seed: row.seed,
          num_correct: row.num_correct,
          total_points: row.total_points,
          mode: row.mode,
          difficulty: row.difficulty,
          decade_start: row.decade_start,
        }));

        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [modeFilter]);

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 relative overflow-hidden" style={{
      backgroundColor: '#000000',
      backgroundImage: `
        radial-gradient(2px 2px at 20% 30%, white, transparent),
        radial-gradient(2px 2px at 60% 70%, white, transparent),
        radial-gradient(1px 1px at 50% 50%, white, transparent),
        radial-gradient(1px 1px at 80% 10%, white, transparent),
        radial-gradient(2px 2px at 90% 60%, white, transparent),
        radial-gradient(1px 1px at 33% 80%, white, transparent),
        radial-gradient(2px 2px at 15% 75%, white, transparent),
        radial-gradient(circle at 50% 50%, rgba(75, 0, 130, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 0, 0, 0.2) 0%, transparent 50%)
      `,
      backgroundSize: '200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 100% 100%, 100% 100%',
      backgroundAttachment: 'fixed',
    }}>
      {/* Constellation lines */}
      <div className="constellation-line" style={{ top: '20%', left: '10%', width: '30%', transform: 'rotate(45deg)' }} />
      <div className="constellation-line" style={{ top: '60%', right: '15%', width: '25%', transform: 'rotate(-30deg)' }} />
      <div className="constellation-line" style={{ bottom: '30%', left: '25%', width: '40%', transform: 'rotate(15deg)' }} />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header with logo and icons */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-20">
          <Link
            href="/"
            className={`${audiowide.className} text-xl sm:text-2xl md:text-3xl font-bold metallic-text cursor-pointer transition-all hover:scale-105`}
            style={{
              textShadow: '0 0 20px rgba(192, 192, 192, 0.8), 0 0 40px rgba(75, 0, 130, 0.6)'
            }}
          >
            🚀 TUNETRIVIA 🎸
          </Link>

          {/* Icons - right side */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Leaderboard button (current page indicator) */}
            <div className="relative group">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255, 215, 0, 0.3)',
                  color: '#FFD700',
                  border: '2px solid rgba(255, 215, 0, 0.6)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>

            {/* User/Auth button with circular icon */}
            {user ? (
              <Link
                href="/account"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(75, 0, 130, 0.8)',
                  border: '2px solid rgba(192, 192, 192, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <img
                  src={user.user_metadata?.picture}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              </Link>
            ) : (
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: 'rgba(75, 0, 130, 0.8)',
                  color: '#C0C0C0',
                  border: '2px solid rgba(192, 192, 192, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <h1 className={`${audiowide.className} text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 metallic-text`} style={{
          textShadow: '0 0 20px rgba(192, 192, 192, 0.8), 0 0 40px rgba(75, 0, 130, 0.6)'
        }}>
          🏆 LEADERBOARD
        </h1>

        {/* Mode Filter Tabs */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-6">
          <button
            onClick={() => setModeFilter('all')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              modeFilter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
            style={{
              backdropFilter: 'blur(10px)',
              border: modeFilter === 'all' ? '2px solid rgba(192, 192, 192, 0.5)' : '2px solid transparent',
            }}
          >
            🌟 All
          </button>
          <button
            onClick={() => setModeFilter('classic')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              modeFilter === 'classic'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
            style={{
              backdropFilter: 'blur(10px)',
              border: modeFilter === 'classic' ? '2px solid rgba(192, 192, 192, 0.5)' : '2px solid transparent',
            }}
          >
            📅 Classic
          </button>
          <button
            onClick={() => setModeFilter('quick')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              modeFilter === 'quick'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
            style={{
              backdropFilter: 'blur(10px)',
              border: modeFilter === 'quick' ? '2px solid rgba(192, 192, 192, 0.5)' : '2px solid transparent',
            }}
          >
            ⚡ Quick Play
          </button>
        </div>

        <div className="holographic-card rounded-3xl p-4 sm:p-6 md:p-8" style={{
          background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-6xl animate-spin inline-block mb-4">🌌</div>
              <div className="text-xl" style={{ color: '#C0C0C0' }}>Loading leaderboard...</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎮</div>
              <div className="text-xl" style={{ color: '#C0C0C0' }}>No players yet. Be the first!</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2" style={{ borderColor: 'rgba(192, 192, 192, 0.3)' }}>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold" style={{ color: '#C0C0C0' }}>Rank</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold" style={{ color: '#C0C0C0' }}>Player</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold hidden md:table-cell" style={{ color: '#C0C0C0' }}>Genre</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold" style={{ color: '#C0C0C0' }}>Score</th>
                    <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold" style={{ color: '#C0C0C0' }}>Points</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold hidden lg:table-cell" style={{ color: '#C0C0C0' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    let rankEmoji = '';
                    if (index === 0) rankEmoji = '🥇';
                    else if (index === 1) rankEmoji = '🥈';
                    else if (index === 2) rankEmoji = '🥉';

                    const genreEmojis: Record<string, string> = {
                      'pop': '🔥',
                      'country': '🤠',
                      'rnb': '🎤',
                      'rap': '🎙️',
                      'alternative': '🎸',
                      'rock': '🎧',
                      'latin': '💃',
                      'other': '🎵'
                    };

                    const formatChartWeek = (seedString: string | null) => {
                      if (!seedString) return null;
                      const date = new Date(seedString);
                      const day = date.getDate();
                      const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                                     day === 2 || day === 22 ? 'nd' :
                                     day === 3 || day === 23 ? 'rd' : 'th';
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }).replace(/(\d+)/, `$1${suffix}`);
                    };

                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                    };

                    const genreDisplay = entry.genre === 'rnb' ? 'R&B/Hip-Hop' :
                                        entry.genre.charAt(0).toUpperCase() + entry.genre.slice(1);

                    return (
                      <tr key={index} className="border-b transition-all hover:bg-white/5" style={{ borderColor: 'rgba(192, 192, 192, 0.1)' }}>
                        <td className="py-3 px-2 sm:px-4 text-sm sm:text-base font-bold" style={{ color: '#C0C0C0' }}>
                          {rankEmoji} {index + 1}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none" style={{ color: '#C0C0C0' }}>
                          {entry.username || 'Anonymous'}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm sm:text-base hidden md:table-cell" style={{ color: '#C0C0C0' }}>
                          <div>
                            <div>
                              <span className="mr-1">{genreEmojis[entry.genre] || '🎵'}</span>
                              {genreDisplay}
                            </div>
                            {entry.mode === 'classic' && formatChartWeek(entry.seed) && (
                              <div className="text-xs mt-1" style={{ color: 'rgba(192, 192, 192, 0.6)' }}>
                                Week of {formatChartWeek(entry.seed)}
                              </div>
                            )}
                            {entry.mode === 'quick' && (
                              <div className="text-xs mt-1" style={{ color: 'rgba(192, 192, 192, 0.6)' }}>
                                {entry.difficulty && (
                                  <span className="capitalize mr-2">
                                    {entry.difficulty === 'easy' ? '🟢 Easy' :
                                     entry.difficulty === 'medium' ? '🟡 Medium' :
                                     '🔴 Hard'}
                                  </span>
                                )}
                                {entry.decade_start && (
                                  <span>📅 {entry.decade_start}s</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm sm:text-base text-center font-bold" style={{ color: entry.num_correct === 10 ? '#00FF00' : '#C0C0C0' }}>
                          {entry.num_correct}/10
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm sm:text-base font-bold text-right metallic-text">
                          {entry.total_points.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell" style={{ color: 'rgba(192, 192, 192, 0.7)' }}>
                          {formatDate(entry.started_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

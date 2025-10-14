'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Audiowide } from 'next/font/google';
import Link from 'next/link';

const audiowide = Audiowide({ weight: '400', subsets: ['latin'] });

interface LeaderboardEntry {
  username: string | null;
  genre: string;
  started_at: string;
  num_correct: number;
  total_points: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // Get best rounds from all users
        const { data: roundsData, error: roundsError } = await supabase
          .from('game_rounds')
          .select('total_points, num_correct, genre, started_at, user_id')
          .not('ended_at', 'is', null)
          .order('total_points', { ascending: false })
          .limit(100);

        if (roundsError) throw roundsError;

        // Get all unique user IDs
        const userIds = [...new Set(roundsData?.map(r => r.user_id) || [])];

        // Fetch usernames for all users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of user_id to username
        const usernameMap = new Map(
          profilesData?.map(p => [p.user_id, p.username]) || []
        );

        // Transform data to match leaderboard format
        const data = roundsData?.map((row) => ({
          username: usernameMap.get(row.user_id) || 'Anonymous',
          genre: row.genre,
          started_at: row.started_at,
          num_correct: row.num_correct,
          total_points: row.total_points,
        })) || [];

        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

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
      {/* Back button - top left */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{
            backgroundColor: 'rgba(75, 0, 130, 0.5)',
            color: '#C0C0C0',
            border: '1px solid rgba(192, 192, 192, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          ← Back
        </Link>
      </div>

      {/* Constellation lines */}
      <div className="constellation-line" style={{ top: '20%', left: '10%', width: '30%', transform: 'rotate(45deg)' }} />
      <div className="constellation-line" style={{ top: '60%', right: '15%', width: '25%', transform: 'rotate(-30deg)' }} />
      <div className="constellation-line" style={{ bottom: '30%', left: '25%', width: '40%', transform: 'rotate(15deg)' }} />

      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className={`${audiowide.className} text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-8 sm:mb-12 metallic-text`} style={{
          textShadow: '0 0 30px rgba(192, 192, 192, 0.8), 0 0 60px rgba(75, 0, 130, 0.6)'
        }}>
          🏆 LEADERBOARD 🏆
        </h1>

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
                      'other': '🎵'
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
                          <span className="mr-1">{genreEmojis[entry.genre] || '🎵'}</span>
                          {genreDisplay}
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

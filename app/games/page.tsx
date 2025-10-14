'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Audiowide } from 'next/font/google';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const audiowide = Audiowide({ weight: '400', subsets: ['latin'] });

interface GameRound {
  id: string;
  genre: string;
  chart_year: number;
  chart_week: number;
  started_at: string;
  ended_at: string | null;
  total_points: number;
  num_correct: number;
  result: 'win' | 'loss' | null;
}

export default function Games() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<GameRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchGames() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('game_rounds')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });

        if (error) throw error;
        setGames(data || []);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchGames();
    }
  }, [user]);

  if (authLoading || !user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

      {/* Sign out button - top right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={signOut}
          className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{
            backgroundColor: 'rgba(75, 0, 130, 0.5)',
            color: '#C0C0C0',
            border: '1px solid rgba(192, 192, 192, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Constellation lines */}
      <div className="constellation-line" style={{ top: '20%', left: '10%', width: '30%', transform: 'rotate(45deg)' }} />
      <div className="constellation-line" style={{ top: '60%', right: '15%', width: '25%', transform: 'rotate(-30deg)' }} />
      <div className="constellation-line" style={{ bottom: '30%', left: '25%', width: '40%', transform: 'rotate(15deg)' }} />

      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className={`${audiowide.className} text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-8 sm:mb-12 metallic-text`} style={{
          textShadow: '0 0 30px rgba(192, 192, 192, 0.8), 0 0 60px rgba(75, 0, 130, 0.6)'
        }}>
          🎮 MY GAMES 🎮
        </h1>

        <div className="holographic-card rounded-3xl p-4 sm:p-6 md:p-8" style={{
          background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-6xl animate-spin inline-block mb-4">🌌</div>
              <div className="text-xl" style={{ color: '#C0C0C0' }}>Loading games...</div>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎸</div>
              <div className="text-xl mb-2" style={{ color: '#C0C0C0' }}>No games played yet</div>
              <div className="text-sm" style={{ color: '#C0C0C0' }}>Start playing to see your history!</div>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="rounded-xl p-4 transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.3) 0%, rgba(0, 0, 0, 0.3) 100%)',
                    border: '2px solid rgba(192, 192, 192, 0.2)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{genreEmojis[game.genre] || '🎵'}</span>
                        <span className="font-bold text-lg capitalize" style={{ color: '#C0C0C0' }}>
                          {game.genre === 'rnb' ? 'R&B/Hip-Hop' : game.genre}
                        </span>
                        <span className="text-sm" style={{ color: '#C0C0C0' }}>
                          Week {game.chart_week}, {game.chart_year}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(192, 192, 192, 0.7)' }}>
                        {formatDate(game.started_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs mb-1" style={{ color: '#C0C0C0' }}>Score</div>
                        <div className="text-xl font-bold metallic-text">{game.num_correct}/10</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs mb-1" style={{ color: '#C0C0C0' }}>Points</div>
                        <div className="text-xl font-bold" style={{
                          background: 'linear-gradient(135deg, #FF0000 0%, #FF6B00 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}>
                          {game.total_points}
                        </div>
                      </div>
                      <div>
                        {game.result === 'win' ? (
                          <span className="text-2xl">🏆</span>
                        ) : game.result === 'loss' ? (
                          <span className="text-2xl">😔</span>
                        ) : (
                          <span className="text-2xl">⏸️</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

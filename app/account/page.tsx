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
  mode: 'classic' | 'quick';
  genre: string;
  chart_year?: number;
  chart_week?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  decade_start?: number;
  started_at: string;
  ended_at: string | null;
  total_points: number;
  num_correct: number;
  result: 'win' | 'loss' | null;
}

export default function Account() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<GameRound[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const name = data?.display_name || data?.username || '';
        setDisplayName(name);
        setOriginalDisplayName(name);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessage({ type: 'error', text: 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

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
        setGamesLoading(false);
      }
    }

    if (user) {
      fetchGames();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    // Validate display name
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Display name cannot be empty' });
      return;
    }

    if (trimmedName.length > 50) {
      setMessage({ type: 'error', text: 'Display name must be 50 characters or less' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Check for profanity
      const profanityCheck = await fetch('https://vector.profanity.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedName }),
      });

      const profanityResult = await profanityCheck.json();

      if (profanityResult.isProfanity) {
        setMessage({ type: 'error', text: 'Display name contains inappropriate language. Please choose a different name.' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmedName })
        .eq('user_id', user.id);

      if (error) throw error;

      setOriginalDisplayName(trimmedName);
      setMessage({ type: 'success', text: 'Display name updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update display name' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = displayName.trim() !== originalDisplayName;

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen p-3 sm:p-6 md:p-8 flex items-center justify-center" style={{
        backgroundColor: '#000000',
        backgroundImage: `
          radial-gradient(2px 2px at 20% 30%, white, transparent),
          radial-gradient(2px 2px at 60% 70%, white, transparent),
          radial-gradient(1px 1px at 50% 50%, white, transparent),
          radial-gradient(circle at 50% 50%, rgba(75, 0, 130, 0.3) 0%, transparent 50%)
        `,
      }}>
        <div className="text-center">
          <div className="text-6xl animate-spin inline-block mb-4">🌌</div>
          <div className="text-xl" style={{ color: '#C0C0C0' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
            {/* Leaderboard icon */}
            <Link
              href="/leaderboard"
              className="relative group"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(75, 0, 130, 0.8)',
                  color: '#C0C0C0',
                  border: '2px solid rgba(192, 192, 192, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </Link>

            {/* User avatar (current page indicator) */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.3)',
                border: '2px solid rgba(255, 215, 0, 0.6)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <img
                src={user.user_metadata?.picture}
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <h1 className={`${audiowide.className} text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 metallic-text`} style={{
          textShadow: '0 0 20px rgba(192, 192, 192, 0.8), 0 0 40px rgba(75, 0, 130, 0.6)'
        }}>
          👤 MY ACCOUNT
        </h1>

        <div className="holographic-card rounded-3xl p-6 sm:p-8" style={{
          background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}>
          {/* User Info Section */}
          <div className="mb-8 pb-8 border-b" style={{ borderColor: 'rgba(192, 192, 192, 0.2)' }}>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={user.user_metadata?.picture}
                alt="User avatar"
                className="w-16 h-16 rounded-full border-2"
                style={{ borderColor: 'rgba(192, 192, 192, 0.5)' }}
              />
              <div>
                <div className="text-lg font-bold" style={{ color: '#C0C0C0' }}>
                  {user.user_metadata?.name || user.email}
                </div>
                <div className="text-sm" style={{ color: 'rgba(192, 192, 192, 0.6)' }}>
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="mb-8">
            <label className="block mb-2 text-sm font-bold" style={{ color: '#C0C0C0' }}>
              Display Name
            </label>
            <p className="text-xs mb-4" style={{ color: 'rgba(192, 192, 192, 0.6)' }}>
              This is how you'll appear on the leaderboard
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '2px solid rgba(192, 192, 192, 0.3)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(192, 192, 192, 0.6)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(192, 192, 192, 0.3)';
              }}
            />
            <div className="text-xs mt-2" style={{ color: 'rgba(192, 192, 192, 0.5)' }}>
              {displayName.length}/50 characters
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: message.type === 'success'
                  ? 'rgba(0, 255, 0, 0.1)'
                  : 'rgba(255, 0, 0, 0.1)',
                border: `2px solid ${message.type === 'success' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
                color: message.type === 'success' ? '#00FF00' : '#FF6B6B',
              }}
            >
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: hasChanges
                  ? 'linear-gradient(135deg, rgba(75, 0, 130, 0.8) 0%, rgba(138, 43, 226, 0.8) 100%)'
                  : 'rgba(75, 0, 130, 0.4)',
                border: '2px solid rgba(192, 192, 192, 0.5)',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={signOut}
              className="px-6 py-3 rounded-xl font-bold transition-all"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                border: '2px solid rgba(255, 0, 0, 0.4)',
                color: '#FF6B6B',
              }}
            >
              Sign Out
            </button>
          </div>

        </div>

        {/* Games History Section */}
        <h2 className={`${audiowide.className} text-lg sm:text-xl md:text-2xl font-bold text-center mt-8 mb-4 metallic-text`} style={{
          textShadow: '0 0 20px rgba(192, 192, 192, 0.8), 0 0 40px rgba(75, 0, 130, 0.6)'
        }}>
          🎮 GAME HISTORY
        </h2>

        <div className="holographic-card rounded-3xl p-4 sm:p-6 md:p-8" style={{
          background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}>
          {gamesLoading ? (
            <div className="text-center py-12">
              <div className="text-6xl animate-spin inline-block mb-4">🌌</div>
              <div className="text-xl" style={{ color: '#C0C0C0' }}>Loading games...</div>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎸</div>
              <div className="text-xl mb-2" style={{ color: '#C0C0C0' }}>No games played yet</div>
              <div className="text-sm mb-6" style={{ color: '#C0C0C0' }}>Start playing to see your history!</div>
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(75, 0, 130, 0.8)',
                  border: '2px solid rgba(192, 192, 192, 0.5)',
                  color: '#C0C0C0',
                }}
              >
                🎮 Play Now
              </Link>
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-2xl">{genreEmojis[game.genre] || '🎵'}</span>
                        <span className="font-bold text-lg capitalize" style={{ color: '#C0C0C0' }}>
                          {game.genre === 'rnb' ? 'R&B/Hip-Hop' : game.genre}
                        </span>
                        {game.mode === 'classic' ? (
                          <span className="text-sm" style={{ color: '#C0C0C0' }}>
                            Week {game.chart_week}, {game.chart_year}
                          </span>
                        ) : (
                          <span className="text-sm flex items-center gap-1" style={{ color: '#C0C0C0' }}>
                            <span className="px-2 py-0.5 rounded" style={{
                              backgroundColor: 'rgba(75, 0, 130, 0.5)',
                              fontSize: '0.7rem',
                              textTransform: 'uppercase'
                            }}>
                              {game.difficulty}
                            </span>
                            {game.decade_start && (
                              <span>• {game.decade_start}s</span>
                            )}
                            {!game.decade_start && <span>• All Time</span>}
                          </span>
                        )}
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

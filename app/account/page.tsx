'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import SiteHeader from '@/components/SiteHeader';
import { genreName } from '@/lib/charts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  if (authLoading || loading) {
    return (
      <div className="page">
        <p className="muted" role="status">Loading your account…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const avatar = user.user_metadata?.picture || user.user_metadata?.avatar_url;

  return (
    <div className="page">
      <SiteHeader user={user} current="account" />
      <main id="main-content" className="max-w-3xl">
        <h1 className="font-display text-5xl sm:text-6xl leading-none mb-6">My account</h1>

        <section className="panel p-5 sm:p-8 mb-10">
          <div className="flex items-center gap-4 mb-6">
            {avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-14 h-14 rounded-full" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-lg truncate">{user.user_metadata?.name || user.email}</div>
              <div className="muted text-sm truncate">{user.email}</div>
            </div>
          </div>

          <label className="block mb-4">
            <span className="group-title block">Name on the leaderboard</span>
            <input
              type="text"
              className="field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
          </label>

          {message && (
            <p className={`mb-4 ${message.type === 'success' ? 'accent' : ''}`} role={message.type === 'error' ? 'alert' : 'status'}>
              {message.text}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? 'Saving…' : 'Save name'}
            </button>
            <button className="btn btn-ghost" onClick={signOut}>Sign out</button>
          </div>
        </section>

        <h2 className="font-display text-3xl mb-4">Game history</h2>
        {gamesLoading ? (
          <p className="muted" role="status">Loading your games…</p>
        ) : games.length === 0 ? (
          <div className="panel p-6">
            <p className="text-lg mb-4">No games yet. Your scores will show up here.</p>
            <Link href="/" className="btn btn-primary">Play a game</Link>
          </div>
        ) : (
          <ul className="panel px-4 sm:px-6">
            {games.map((game, i) => (
              <li
                key={game.id}
                className="py-4 flex items-center justify-between gap-4"
                style={i ? { borderTop: '1px solid var(--line)' } : undefined}
              >
                <div className="min-w-0">
                  <div className="font-semibold">
                    {genreName(game.genre)}
                    <span className="muted font-normal">
                      {game.mode === 'classic'
                        ? `, week ${game.chart_week} of ${game.chart_year}`
                        : `, ${game.difficulty}, ${game.decade_start ? `${game.decade_start}s` : 'all years'}`}
                    </span>
                  </div>
                  <div className="muted text-sm">{formatDate(game.started_at)}</div>
                </div>
                <div className="text-right flex-none">
                  <div className={`font-display text-2xl leading-none ${game.result === 'win' ? 'accent' : ''}`}>
                    {game.total_points.toLocaleString()}
                  </div>
                  <div className="muted text-sm">{game.result ? `${game.num_correct}/10 correct` : 'not finished'}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

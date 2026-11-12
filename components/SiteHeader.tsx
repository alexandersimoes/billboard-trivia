'use client';

import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface Props {
  user: User | null;
  authLoading?: boolean;
  onSignIn?: () => void;
  /** Intercept the wordmark click (the game asks before abandoning a round). */
  onHome?: () => void;
  current?: 'leaderboard' | 'account';
}

export default function SiteHeader({ user, authLoading, onSignIn, onHome, current }: Props) {
  const avatar = user?.user_metadata?.picture || user?.user_metadata?.avatar_url;
  const initial =
    user?.user_metadata?.full_name?.[0] || user?.user_metadata?.name?.[0] || user?.email?.[0] || '?';

  return (
    <header className="site-header flex items-center justify-between gap-4 mb-8 sm:mb-12">
      {onHome ? (
        <button onClick={onHome} className="font-display text-2xl sm:text-3xl cursor-pointer">TuneTrivia</button>
      ) : (
        <Link href="/" className="font-display text-2xl sm:text-3xl">TuneTrivia</Link>
      )}
      <nav className="flex items-center gap-4 sm:gap-6 font-semibold">
        <Link
          href="/leaderboard"
          aria-current={current === 'leaderboard' ? 'page' : undefined}
          className={current === 'leaderboard' ? 'accent' : 'hover:underline underline-offset-4'}
        >
          Leaderboard
        </Link>
        {authLoading ? (
          <span className="muted">…</span>
        ) : user ? (
          <Link
            href="/account"
            aria-label="My games"
            title="My games"
            className="w-10 h-10 rounded-full overflow-hidden grid place-items-center"
            style={{ border: `2px solid ${current === 'account' ? 'var(--accent)' : 'var(--line)'}` }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{String(initial).toUpperCase()}</span>
            )}
          </Link>
        ) : onSignIn ? (
          <button onClick={onSignIn} className="btn btn-ghost" style={{ minHeight: '2.5rem', padding: '0.3rem 1rem' }}>
            Sign in
          </button>
        ) : null}
      </nav>
    </header>
  );
}

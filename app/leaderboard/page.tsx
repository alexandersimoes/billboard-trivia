'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SiteHeader from '@/components/SiteHeader';
import { CHARTS, genreName } from '@/lib/charts';
import { filterRounds, METRICS, rankGames, rankPlayers, startOfWeek, type BoardFilters, type LeaderboardRound, type PlayerMetric, type RankedEntry } from '@/lib/leaderboard';
import { loadLeaderboard } from '@/lib/load-leaderboard';

type Settings = BoardFilters & { board: 'players' | 'games'; metric: PlayerMetric };
const DEFAULTS: Settings = { board: 'players', metric: 'best-five', period: 'all', genre: 'all', mode: 'all', difficulty: 'all' };
function readSettings(params: { get: (name: string) => string | null }): Settings {
  const board = params.get('board');
  const metric = params.get('metric');
  const mode = params.get('mode');
  const difficulty = params.get('difficulty');
  const genre = params.get('genre');
  return {
    board: board === 'games' || (!board && (params.get('roundId') || params.get('highlight') === 'me')) ? 'games' : 'players',
    metric: metric === 'total' || metric === 'average' ? metric : 'best-five',
    period: params.get('period') === 'week' ? 'week' : 'all',
    genre: genre && (CHARTS.some(chart => chart.genre === genre) || genre === 'other') ? genre : 'all',
    mode: mode === 'quick' || mode === 'classic' ? mode : 'all',
    difficulty: mode !== 'classic' && (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') ? difficulty : 'all',
  };
}
const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
const shortDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function LeaderboardContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [settings, setSettings] = useState<Settings>(() => readSettings(params));
  const [rounds, setRounds] = useState<LeaderboardRound[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profilesUnavailable, setProfilesUnavailable] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [snapshot, setSnapshot] = useState(() => new Date());
  const focusRow = useRef<HTMLTableRowElement>(null);
  const roundId = params.get('roundId');
  const highlightMe = params.get('highlight') === 'me';
  const wantsFocus = Boolean(roundId || highlightMe);

  useEffect(() => {
    const controller = new AbortController();
    const now = new Date();
    setLoading(true);
    setError('');
    loadLeaderboard(controller.signal, now.toISOString()).then(result => {
      if (controller.signal.aborted) return;
      setRounds(result.rounds);
      setNames(result.names);
      setProfilesUnavailable(result.profilesUnavailable);
      setSnapshot(now);
    }).catch(() => {
      if (!controller.signal.aborted) setError('We couldn’t load the full leaderboard. Please try again.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    const restore = () => setSettings(readSettings(new URLSearchParams(window.location.search)));
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(settings)) {
      // Always include board: post-game links otherwise default to games.
      if (key === 'board' || value !== DEFAULTS[key as keyof Settings]) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  }, [settings]);

  const matching = useMemo(() => filterRounds(rounds, settings, snapshot), [rounds, settings, snapshot]);
  const entries = useMemo(() => settings.board === 'players'
    ? rankPlayers(matching, settings.metric) : rankGames(matching), [matching, settings.board, settings.metric]);
  const players = new Set(matching.map(round => round.user_id)).size;
  const highest = matching.reduce((best, round) => Math.max(best, round.total_points), 0);
  const latestPersonalGame = user ? rounds.filter(round => round.user_id === user.id)
    .sort((a, b) => b.ended_at.localeCompare(a.ended_at) || a.id.localeCompare(b.id))[0] : undefined;
  const targetGame = roundId ? rounds.find(round => round.id === roundId) : highlightMe ? latestPersonalGame : undefined;
  const targetUser = roundId ? targetGame?.user_id : highlightMe ? user?.id : undefined;
  const targetEntry = wantsFocus ? entries.find(entry => settings.board === 'games' ? entry.id === targetGame?.id : entry.userId === targetUser) : undefined;
  const shown = entries.slice(0, 100);
  const outsideTop = Boolean(targetEntry && !shown.some(entry => entry.id === targetEntry.id));
  const focusLabel = settings.board === 'players'
    ? targetUser === user?.id ? 'Your player ranking' : 'Selected player'
    : targetGame?.user_id === user?.id ? 'Your game' : 'Selected game';
  const scoreLabel = settings.board === 'games' || settings.metric === 'total' ? 'Points' : settings.metric === 'average' ? 'Avg. adjusted' : 'Best-five score';
  const weekStart = startOfWeek(snapshot);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
  const playHref = settings.genre !== 'all' && settings.genre !== 'other' ? `/trivia/${settings.genre}/` : '/';
  const update = (patch: Partial<Settings>) => setSettings(previous => ({ ...previous, ...patch }));

  let focusMessage = '';
  if (wantsFocus && !loading && !error && !targetEntry) {
    if (highlightMe && !roundId && !user) {
      focusMessage = authLoading ? 'Finding your account…' : 'Sign in to find your saved scores. Guest games aren’t saved to the leaderboard.';
    } else if (roundId && !targetGame) {
      focusMessage = 'This game couldn’t be found among saved, completed games. It may not have been saved successfully.';
    } else if (!targetUser || (!roundId && !latestPersonalGame)) {
      focusMessage = 'No completed games saved yet. Play while signed in to earn your place.';
    } else if (settings.board === 'players' && settings.metric === 'average' && matching.some(round => round.user_id === targetUser)) {
      const count = matching.filter(round => round.user_id === targetUser).length;
      focusMessage = `This player has ${count} matching ${count === 1 ? 'game' : 'games'}. Play ${5 - count} more to qualify for the average-score ranking.`;
    } else {
      focusMessage = 'That score is outside the current filters. Try all time and all genres to find it.';
    }
  }

  function renderRow(entry: RankedEntry) {
    const isTarget = entry.id === targetEntry?.id;
    const isMe = entry.userId === user?.id;
    const game = entry.round;
    const detail = game?.mode === 'classic'
      ? game.seed && /^\d{4}-\d{2}-\d{2}$/.test(game.seed) ? `Chart: ${shortDate(`${game.seed}T12:00:00Z`)}` : 'Picked week'
      : game ? [game.difficulty, game.decade_start ? `${game.decade_start}s` : 'all years'].filter(Boolean).join(' · ') : '';
    return (
      <tr key={entry.id} ref={isTarget ? focusRow : undefined} className={isTarget ? 'row-highlight' : ''} data-entry-id={entry.id}>
        <td className={`rank-cell font-display ${entry.rank <= 3 ? 'accent' : ''}`}><span className="sr-only">Rank </span>{number(entry.rank)}</td>
        <th scope="row" className="player-cell">
          <span className="player-name">{names[entry.userId] || 'Anonymous'}</span>
          {isMe && <span className="board-badge">You</span>}
          {isTarget && !isMe && <span className="board-badge">Selected</span>}
          <span className="muted block text-xs font-normal mt-1">
            {game ? `${genreName(game.genre)} · ${detail}` : `${number(entry.games)} ${entry.games === 1 ? 'game' : 'games'}${settings.metric === 'best-five' ? ` · ${Math.min(entry.games, 5)}/5 counted` : ''}`}
          </span>
        </th>
        <td className="board-detail muted">{game ? shortDate(game.ended_at) : number(entry.best)}</td>
        <td className="board-detail text-center">{game ? `${game.num_correct} correct` : number(entry.total)}</td>
        <td className="score-cell font-semibold">{number(entry.score)}</td>
      </tr>
    );
  }

  return (
    <div className="page">
      <SiteHeader user={user} authLoading={authLoading} onSignIn={signInWithGoogle} current="leaderboard" />
      <main id="main-content">
        <div className="board-intro">
          <div><p className="eyebrow">Good ears. Great company.</p><h1 className="font-display text-5xl sm:text-6xl leading-none mb-4">The music leaderboard.</h1><p className="muted max-w-xl">Find the standout players, the unforgettable games, and your own next score to beat.</p></div>
          <div className="flex flex-wrap gap-3 shrink-0">
            {user && <button className="btn btn-ghost" onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('roundId');
              url.searchParams.set('highlight', 'me');
              router.replace(url.pathname + url.search, { scroll: false });
            }}>Find my rank</button>}
            <Link className="btn btn-primary" href={playHref}>Play a quiz <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        <section className="panel board-controls" aria-label="Leaderboard filters">
          <div className="board-switches">
            <div className="seg" role="group" aria-label="Leaderboard type">
              <button aria-pressed={settings.board === 'players'} onClick={() => update({ board: 'players' })}>Top players</button>
              <button aria-pressed={settings.board === 'games'} onClick={() => update({ board: 'games' })}>Best games</button>
            </div>
            <div className="seg" role="group" aria-label="Time period">
              <button aria-pressed={settings.period === 'all'} onClick={() => update({ period: 'all' })}>All time</button>
              <button aria-pressed={settings.period === 'week'} onClick={() => update({ period: 'week' })}>This week</button>
            </div>
          </div>
          <div className="board-filter-grid">
            {settings.board === 'players' && <label><span className="group-title block">Rank players by</span><select className="field" value={settings.metric} onChange={event => update({ metric: event.target.value as PlayerMetric })}>{Object.entries(METRICS).map(([id, metric]) => <option key={id} value={id}>{metric.label}</option>)}</select></label>}
            <label><span className="group-title block">Genre / chart</span><select className="field" value={settings.genre} onChange={event => update({ genre: event.target.value })}><option value="all">All genres</option>{CHARTS.map(chart => <option key={chart.genre} value={chart.genre}>{chart.name}</option>)}<option value="other">Other / legacy</option></select></label>
            <label><span className="group-title block">Game mode</span><select className="field" value={settings.mode} onChange={event => update({ mode: event.target.value as Settings['mode'], ...(event.target.value === 'classic' ? { difficulty: 'all' as const } : {}) })}><option value="all">All modes</option><option value="quick">Quick play</option><option value="classic">Picked week</option></select></label>
            <label><span className="group-title block">Difficulty</span><select className="field" value={settings.difficulty} disabled={settings.mode === 'classic'} onChange={event => update({ difficulty: event.target.value as Settings['difficulty'] })}><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          </div>
          <p className="muted text-sm mt-4">{settings.board === 'players' ? METRICS[settings.metric].description : 'Individual completed games ranked by original points, including difficulty bonuses. Filter by difficulty for a closer comparison.'}</p>
          <p className="muted text-xs mt-2">{settings.period === 'week' ? `${shortDate(weekStart.toISOString())} – ${shortDate(new Date(weekEnd.getTime() - 1).toISOString())}. ` : ''}Weeks run Monday–Sunday, UTC, based on when a game finishes. Difficulty filters apply to Quick play.</p>
        </section>

        {!loading && !error && <div className="board-stats" aria-label="Leaderboard summary"><div><strong>{number(players)}</strong><span>players in this selection</span></div><div><strong>{number(matching.length)}</strong><span>completed games</span></div><div><strong>{number(highest)}</strong><span>highest game score</span></div></div>}

        {!loading && !error && wantsFocus && <section className="panel board-personal" aria-label="Your leaderboard result" role="status">
          {targetEntry ? <><div><p className="eyebrow">{focusLabel}</p><p className="font-display text-3xl">#{number(targetEntry.rank)} <span className="text-lg">of {number(entries.length)} {settings.board === 'players' ? 'players' : 'games'}</span></p><p className="muted text-sm mt-2">{outsideTop ? 'Outside the displayed top 100 this time. Your ranked row is included below—try another quiz to climb.' : 'You found your place on the board.'} Ranks reflect the current filters; equal scores share a rank.</p></div><button className="btn btn-ghost" onClick={() => focusRow.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })}>Jump to row ↓</button></>
            : <><p>{focusMessage}</p><div className="flex flex-wrap gap-3">{highlightMe && !roundId && !user && !authLoading ? <button className="btn btn-primary" onClick={signInWithGoogle}>Sign in</button> : <><button className="btn btn-ghost" onClick={() => update({ period: 'all', genre: 'all', mode: 'all', difficulty: 'all', metric: 'best-five' })}>Clear filters</button><Link className="btn btn-primary" href={playHref}>Try another quiz</Link></>}</div></>}
        </section>}

        <section className="panel board-results" aria-labelledby="board-heading" aria-busy={loading}>
          <div className="board-results-heading"><div><h2 id="board-heading" className="font-display text-2xl">{settings.board === 'players' ? 'Top players' : 'Best games'}{settings.period === 'week' ? ' this week' : ' of all time'}</h2><p className="muted text-xs mt-1">{!loading && !error ? `Showing ${Math.min(entries.length, 100)} of ${number(entries.length)} ${settings.board === 'players' ? 'ranked players' : 'games'}${outsideTop ? ', plus the selected result' : ''}.` : 'Scores from completed, saved games.'}</p></div><button className="text-link" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button></div>
          {loading ? <p className="muted py-10 text-center" role="status">Finding the scores and calculating ranks…</p>
            : error ? <div className="board-empty" role="alert"><p>{error}</p><button className="btn btn-primary mt-4" onClick={() => setRefresh(value => value + 1)}>Try again</button></div>
            : entries.length === 0 ? <div className="board-empty"><h3 className="font-display text-2xl mb-3">{settings.board === 'players' && settings.metric === 'average' && matching.length ? 'Five games earn a spot.' : 'The stage is yours.'}</h3><p className="muted mb-5">{settings.board === 'players' && settings.metric === 'average' && matching.length ? 'No player has five completed games in this selection yet. Try Best five or widen your filters.' : 'No completed games match these filters yet. Try another selection or set the first score.'}</p><Link className="btn btn-primary" href={playHref}>Play a quiz</Link></div>
            : <div className="overflow-x-auto"><table className="leaderboard-table"><caption className="sr-only">{settings.board === 'players' ? `Players ranked by ${METRICS[settings.metric].label}` : 'Games ranked by points'}. Equal scores share a rank.</caption><thead><tr><th scope="col">Rank</th><th scope="col">Player {settings.board === 'games' ? '/ game' : ''}</th><th scope="col" className="board-detail">{settings.board === 'games' ? 'Finished (UTC)' : 'Best game'}</th><th scope="col" className="board-detail text-center">{settings.board === 'games' ? 'Correct' : 'Total points'}</th><th scope="col" className="text-right">{scoreLabel}</th></tr></thead><tbody>{shown.map(renderRow)}{outsideTop && targetEntry && <><tr className="board-gap"><td colSpan={5}><span aria-hidden="true">•••</span><span className="sr-only">Other ranked entries omitted</span></td></tr>{renderRow(targetEntry)}</>}</tbody></table></div>}
          {profilesUnavailable && !loading && !error && <p className="muted text-xs p-4" role="status">Some player names couldn’t be loaded. Scores and ranks are available; refresh to retry names.</p>}
        </section>

        <details className="panel board-rules"><summary>How are the rankings calculated?</summary><div className="muted text-sm space-y-3 mt-4"><p><strong>Best five:</strong> add each player’s five highest adjusted scores, or all their games if they have fewer than five. More games give you chances to improve without every extra game adding to your score.</p><p><strong>Average:</strong> average all adjusted scores, including zeros, with at least five matching games. <strong>Total points:</strong> sum the original points from every matching game.</p><p><strong>Adjusted scores:</strong> remove Quick play’s difficulty bonus: easy ÷ 1, medium ÷ 1.5, hard ÷ 2.5. Picked-week scores stay unchanged. This removes the points multiplier; clip length and song difficulty still differ. Scores are rounded to one decimal for ranking, and equal scores share a rank (1, 1, 3).</p><p>All filters apply before player totals are calculated. Weekly boards use the completion date, not the historical chart week. Only saved, completed games appear; guest games aren’t recorded.</p></div></details>
      </main>
    </div>
  );
}

export default function Leaderboard() {
  return <Suspense fallback={<div className="page"><p role="status">Loading leaderboard…</p></div>}><LeaderboardContent /></Suspense>;
}

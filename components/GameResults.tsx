'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { ChartConfig } from '@/lib/charts';
import { bestStreak, loadResultComparison, MIN_COMPARISON_GAMES, ordinal, type ResultComparison } from '@/lib/result-stats';

function CountUp({ value, delay = 700 }: { value: number; delay?: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let timer = 0;
    const finish = () => { cancelAnimationFrame(frame); clearTimeout(timer); setDisplayed(value); };
    if (motion.matches) { finish(); return; }
    setDisplayed(0);
    timer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / 1200);
        setDisplayed(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    const onMotionChange = () => { if (motion.matches) finish(); };
    motion.addEventListener('change', onMotionChange);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); motion.removeEventListener('change', onMotionChange); };
  }, [value, delay]);
  return <span><span className="sr-only">{value.toLocaleString('en-US')}</span><span aria-hidden="true">{displayed.toLocaleString('en-US')}</span></span>;
}

interface Props {
  chart: ChartConfig;
  score: number;
  correct: number;
  total: number;
  results: Record<number, 'right' | 'wrong'>;
  mode: 'quick' | 'specific';
  difficulty: 'easy' | 'medium' | 'hard';
  selectionLabel: string;
  saving: boolean;
  roundId: string | null;
  signedIn: boolean;
  onRetry: () => void;
  onChangeSelection: () => void;
  onShare: () => void;
  chartReveal?: React.ReactNode;
}

export default function GameResults(props: Props) {
  const { chart, score, correct, total, results, mode, difficulty, saving, roundId } = props;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [comparison, setComparison] = useState<ResultComparison | null>(null);
  const [comparisonState, setComparisonState] = useState<'loading' | 'ready' | 'error'>('loading');
  const accuracy = total ? Math.round(correct / total * 100) : 0;
  const streak = bestStreak(results, total);
  const perfect = correct === total && total > 0;
  const title = perfect ? 'A flawless set.' : accuracy >= 70 ? 'Encore-worthy.' : accuracy >= 50 ? 'Finding your rhythm.' : 'The next chorus is yours.';
  const message = perfect ? 'Every song, right on cue. Take a bow.' : accuracy >= 70 ? 'You know your soundtrack. Can you top that?' : accuracy >= 50 ? 'A few got past you. Your next great set is one play away.' : 'Better luck next time. Every good ear starts with another listen.';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (saving) return;
    const controller = new AbortController();
    setComparisonState('loading');
    const timeout = window.setTimeout(() => { setComparisonState('error'); controller.abort(); }, 12000);
    loadResultComparison({ genre: chart.genre, mode: mode === 'quick' ? 'quick' : 'classic', difficulty, score, roundId, signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) { setComparison(value); setComparisonState('ready'); } })
      .catch(() => { if (!controller.signal.aborted) setComparisonState('error'); })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [saving, chart.genre, mode, difficulty, score, roundId]);

  return (
    <main id="main-content" className="results-stage" aria-labelledby="result-title">
      <div className="results-hero">
        <p className="eyebrow">Your {chart.name} encore</p>
        <h1 id="result-title" ref={titleRef} tabIndex={-1} className="font-display results-title">{title}</h1>
        <p className="results-message">{message}</p>
        <div className="results-tally" aria-label={`${correct} of ${total} songs correct`}>
          <span className="font-display">{correct}</span><span className="results-tally-total">/ {total}<small>songs recognized</small></span>
        </div>
        <div className="pips results-pips" aria-hidden="true">{Array.from({ length: total }, (_, index) => <span key={index} className="pip" data-state={results[index] ?? 'wrong'} style={{ animationDelay: `${650 + index * 65}ms` }} />)}</div>
      </div>

      <dl className="results-stats results-reveal" aria-label="Your game statistics">
        <div><dt>Points earned</dt><dd><CountUp value={score} /></dd></div>
        <div><dt>Accuracy</dt><dd><CountUp value={accuracy} delay={850} /><span className="results-unit">%</span></dd></div>
        <div><dt>Best streak</dt><dd><CountUp value={streak} delay={1000} /><span className="results-unit"> in a row</span></dd></div>
      </dl>

      <section className="results-comparisons results-reveal" aria-label="How your score compares" aria-busy={comparisonState === 'loading'}>
        {comparisonState === 'loading' ? <p role="status" className="muted">Finding your place in the music crowd…</p>
          : comparisonState === 'error' ? <p className="muted">Your score is ready. Comparisons are taking a break—try the leaderboard later.</p>
          : <div className="results-comparison-grid">
            <div>
              {comparison?.genre ? <>
                <p className="results-stat-kicker">{comparison.genre.percentile >= 50 ? `${chart.name} standout` : 'Room for an encore'}</p>
                <p className="results-comparison-value font-display">{comparison.genre.percentile >= 50 ? <>Top <CountUp value={comparison.genre.topPercent} delay={100} />%</> : <><CountUp value={comparison.genre.percentile} delay={100} />% outscored</>}</p>
                <p className="muted text-sm">Among {comparison.genre.games.toLocaleString()} saved {chart.name} games.</p>
              </> : <><p className="results-stat-kicker">The {chart.name} story is growing</p><p className="font-display text-2xl my-2">A score to build on.</p><p className="muted text-sm">We need {MIN_COMPARISON_GAMES} comparable saved games before showing a genre percentile.</p></>}
            </div>
            <div>
              {comparison?.overall ? <>
                <p className="results-stat-kicker">Across all genres</p>
                <p className="results-comparison-value font-display"><CountUp value={comparison.overall.percentile} delay={250} /><sup>{ordinal(comparison.overall.percentile)}</sup> <span className="results-percentile-label">percentile</span></p>
                <p className="muted text-sm">You outscored {comparison.overall.percentile}% of {comparison.overall.games.toLocaleString()} saved games.</p>
              </> : <><p className="results-stat-kicker">Your next challenge</p><p className="font-display text-2xl my-2">{perfect ? 'Go for the encore.' : `Can you get ${Math.min(total, correct + 1)} next time?`}</p><p className="muted text-sm">Not enough comparable games for an overall percentile yet.</p></>}
            </div>
          </div>}
        {comparisonState === 'ready' && <p className="results-comparison-note">Compared with saved games, not people. {mode === 'quick' ? `Quick play · ${difficulty} difficulty` : 'Picked-week mode'} · all eras. Tied scores aren’t counted as outscored; your saved game is excluded.</p>}
      </section>

      <div className="results-actions results-reveal">
        <div className="results-primary-actions">
          <button className="btn btn-primary btn-lg" onClick={props.onRetry} disabled={saving}>Try again? <span aria-hidden="true">↻</span></button>
          <button className="btn btn-ghost btn-lg" onClick={props.onChangeSelection} disabled={saving}>Change selection</button>
        </div>
        <p className="muted text-sm mt-3">{props.selectionLabel} · same settings, fresh songs.</p>
        <div className="results-secondary-actions">
          <button className="text-link" onClick={props.onShare}>Share result</button>
          {saving ? <span role="status" className="muted text-sm">Saving your score…</span> : <Link className="text-link" href={roundId ? `/leaderboard/?roundId=${encodeURIComponent(roundId)}` : '/leaderboard/?board=games'}>View leaderboard</Link>}
        </div>
        {!saving && !roundId && <p className="results-save-note">{props.signedIn ? 'This score could not be saved. You can still browse the leaderboard.' : 'Guest scores aren’t saved. Sign in before your next game to join the leaderboard.'}</p>}
      </div>
      {props.chartReveal}
    </main>
  );
}

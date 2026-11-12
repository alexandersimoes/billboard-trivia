'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ChartTrack, RevealedPositions } from '@/lib/tracks';

export interface ChartSpin { id: number; position: number }
const ROW_HEIGHT = 56;

function ChartWheel({ tracks, label, week, spin, revealed, onLanded }: {
  tracks: ChartTrack[]; label: string; week: string;
  spin: ChartSpin | null; revealed: RevealedPositions;
  onLanded: (id: number) => void;
}) {
  const rows = useMemo(() => [...tracks].sort((a, b) => a.this_week - b.this_week), [tracks]);
  const reel = useRef<HTMLDivElement>(null);
  const machine = useRef<HTMLElement>(null);
  const previousIndex = useRef(0);
  const landedCallback = useRef(onLanded);
  landedCallback.current = onLanded;
  const finishSpin = useRef<() => void>(() => {});
  const [landedId, setLandedId] = useState<number | null>(null);
  const spinning = Boolean(spin && landedId !== spin.id);

  useEffect(() => {
    if (!spin || !rows.length || !reel.current) return;
    const element = reel.current;
    const center = ((element.parentElement?.clientHeight ?? 280) - ROW_HEIGHT) / 2;
    const index = rows.findIndex(track => track.this_week === spin.position);
    if (index < 0) { landedCallback.current(spin.id); return; }
    const start = center - (rows.length + previousIndex.current) * ROW_HEIGHT;
    const end = center - (2 * rows.length + index) * ROW_HEIGHT;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (window.innerWidth < 768 && (machine.current?.getBoundingClientRect().top ?? 0) < 0) {
      machine.current?.scrollIntoView({ block: 'start', behavior: motion.matches ? 'auto' : 'smooth' });
    }
    let animation: Animation | undefined;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      animation?.cancel();
      element.style.transform = `translateY(calc(var(--wheel-center) - ${(rows.length + index) * ROW_HEIGHT}px))`;
      previousIndex.current = index;
      setLandedId(spin.id);
    };
    finishSpin.current = finish;
    element.style.transform = `translateY(${start}px)`;
    if (motion.matches || !element.animate) finish();
    else {
      animation = element.animate([
        { transform: `translateY(${start}px)`, offset: 0, easing: 'cubic-bezier(.12,.68,.14,1)' },
        { transform: `translateY(${end - 7}px)`, offset: 0.91, easing: 'ease-out' },
        { transform: `translateY(${end}px)`, offset: 1 },
      ], { duration: 1750, fill: 'forwards' });
      animation.onfinish = finish;
    }
    const reduceMotion = () => { if (motion.matches) finish(); };
    motion.addEventListener('change', reduceMotion);
    return () => { finished = true; animation?.cancel(); finishSpin.current = () => {}; motion.removeEventListener('change', reduceMotion); };
  }, [spin, rows]);

  // Release playback only after the landed highlight has committed to the DOM.
  useEffect(() => {
    if (spin && landedId === spin.id) landedCallback.current(spin.id);
  }, [landedId, spin]);

  return (
    <aside ref={machine} className="chart-machine" aria-label="Chart position wheel" data-spinning={spinning}>
      <div className="chart-machine-lights" aria-hidden="true" />
      <header className="chart-machine-header">
        <p className="eyebrow">TuneTrivia chart spin</p>
        <h2 className="font-display text-2xl">{label}</h2>
        <p className="muted text-xs mt-1">Week of {week} · {rows.length} entries</p>
      </header>
      <div className="chart-wheel-shell">
        <div className="chart-wheel-pointer" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M3 5h18l16 15-16 15H3z" fill="currentColor" /><circle cx="12" cy="20" r="4" fill="var(--bg-deep)" /></svg></div>
        <div className="chart-wheel-window" aria-hidden="true">
          <div ref={reel} className="chart-wheel-reel" style={{ transform: `translateY(calc(var(--wheel-center) - ${rows.length * ROW_HEIGHT}px))` }}>
            {Array.from({ length: 4 }, (_, copy) => rows.map(track => {
              const known = revealed[track.this_week];
              return <div key={`${copy}-${track.this_week}`} className="chart-wheel-row" data-active={Boolean(spin && !spinning && spin.position === track.this_week)} data-known={Boolean(known)}>
                <span className="chart-wheel-rank">{track.this_week}</span>
                <div className="chart-wheel-title">{known ? <><strong>{track.song}</strong><small>{track.artist}</small></> : <><i style={{ width: `${48 + track.this_week % 5 * 8}%` }} /><i style={{ width: `${30 + track.this_week % 3 * 7}%` }} /></>}</div>
                {known && <span className="chart-wheel-mark">{known === 'right' ? '✓' : '♪'}</span>}
              </div>;
            }))}
          </div>
        </div>
        <div className="chart-wheel-target" aria-hidden="true" />
      </div>
      <div className="chart-wheel-announcement" role="status" aria-live="polite">
        {spinning ? <><span className="muted text-sm">Around the charts we go…</span><button className="text-link" onClick={() => finishSpin.current()}>Skip spin</button></>
          : spin ? <><span className="chart-wheel-position font-display">No. {spin.position}</span><span className="muted text-sm">{revealed[spin.position] ? 'Another piece of the chart, uncovered.' : 'That’s your clue. Name the song.'}</span></>
          : <><span className="font-display text-xl">The chart is your clue.</span><span className="muted text-sm">Cueing your next mystery song…</span></>}
      </div>
      <p className="chart-machine-footer">{Object.keys(revealed).length} positions uncovered <span aria-hidden="true">·</span> Titles unlock after each guess</p>
    </aside>
  );
}

export default memo(ChartWheel);

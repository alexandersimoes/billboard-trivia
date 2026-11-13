'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChartTrack, RevealedPositions } from '@/lib/tracks';

export default function ChartReveal({ tracks, label, week, revealed, chartUrl }: {
  tracks: ChartTrack[]; label: string; week: string; revealed: RevealedPositions; chartUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyQuiz, setOnlyQuiz] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const sorted = useMemo(() => [...tracks].sort((a, b) => a.this_week - b.this_week), [tracks]);
  const visible = sorted.filter(track => (!onlyQuiz || revealed[track.this_week])
    && `${track.song} ${track.artist}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()));
  useEffect(() => {
    if (open) heading.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => { if (scrollArea.current) scrollArea.current.scrollTop = 0; }, [search, onlyQuiz]);

  return <section className={`chart-reveal${open ? ' is-open' : ''}`} aria-label="Explore the full chart">
    {chartUrl && <p className="mb-4"><a href={chartUrl} className="text-link">Explore this week’s full chart →</a></p>}
    {!open ? <div className="chart-reveal-invitation">
      <span className="chart-reveal-record" aria-hidden="true">♪</span>
      <div><p className="eyebrow">One week. A whole soundtrack.</p><h2 className="font-display text-2xl">What else was on the chart?</h2><p className="muted text-sm mt-2">You heard a few. Discover every available entry from this week.</p></div>
      <button className="btn btn-primary" onClick={() => setOpen(true)} aria-expanded={false}>Reveal the full list <span aria-hidden="true">↓</span></button>
    </div> : <>
      <div className="chart-reveal-heading"><div><p className="eyebrow">The full picture</p><h2 ref={heading} tabIndex={-1} className="font-display text-3xl">{label}</h2><p className="muted text-sm mt-2">Week of {week} · {tracks.length} available chart entries</p></div><span className="chart-reveal-record" aria-hidden="true">♪</span></div>
      <div className="chart-reveal-tools">
        <label className="flex-1"><span className="sr-only">Find a song or artist</span><input className="field" type="search" placeholder="Find a song or artist…" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label className="chart-reveal-toggle"><input type="checkbox" checked={onlyQuiz} onChange={event => setOnlyQuiz(event.target.checked)} /> From my quiz</label>
      </div>
      <p className="muted text-xs text-left mb-3" role="status">{visible.length} {visible.length === 1 ? 'song' : 'songs'} · Movement is from the previous chart week.</p>
      <div ref={scrollArea} className="chart-reveal-scroll" tabIndex={0} role="region" aria-label="Full chart song list">
        <table className="chart-reveal-table"><thead><tr><th scope="col">Rank</th><th scope="col">Song / artist</th><th scope="col">Move</th><th scope="col" className="chart-reveal-extra">Peak</th><th scope="col" className="chart-reveal-extra">Weeks</th></tr></thead>
          <tbody>{visible.map((track, index) => <tr key={`${track.this_week}-${track.song}`} style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }} data-outcome={revealed[track.this_week]}>
            <td className="font-display text-2xl">{track.this_week}</td>
            <th scope="row"><span className="chart-reveal-song">{track.song}</span><span className="muted block font-normal text-sm">{track.artist}</span>{revealed[track.this_week] && <span className="chart-reveal-badge">{revealed[track.this_week] === 'right' ? '✓ You got it' : '♪ In your quiz'}</span>}</th>
            <td className="text-sm">{track.last_week === null || track.last_week === 0 ? <span className="accent">New</span> : track.last_week === track.this_week ? <span aria-label="Unchanged">—</span> : <span aria-label={`${track.last_week > track.this_week ? 'Up' : 'Down'} ${Math.abs(track.last_week - track.this_week)}`}>{track.last_week > track.this_week ? '↑' : '↓'} {Math.abs(track.last_week - track.this_week)}</span>}</td>
            <td className="chart-reveal-extra">{track.peak_position}</td><td className="chart-reveal-extra">{track.weeks_on_chart}</td>
          </tr>)}</tbody></table>
        {!visible.length && <p className="muted py-8">No songs match this search.</p>}
      </div>
      <p className="muted text-xs text-left mt-3">A TuneTrivia chart companion. Chart data belongs to its original publisher.</p>
    </>}
  </section>;
}

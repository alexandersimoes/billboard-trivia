import { rankJourney } from './artist-songs.mjs';

export function renderArtistSongs(songs, { esc, link, charts, chartHref, artistSlug, getRelease, renderRelease, artist }) {
  return `<div class="song-groups">${songs.map((song, index) => {
    const id = `song-${artistSlug(song.title)}`;
    const release=getRelease(artist,song.title);
    return `<details class="song-group" id="${id}" ${index === 0 ? 'open' : ''}>
      <summary>${release?`<img class="song-cover" src="${esc(release.artwork)}" alt="" width="56" height="56" loading="lazy" decoding="async">`:''}<span class="song-summary"><strong>${esc(song.title)}</strong><span class="muted">${song.first.slice(0,4)}${song.first.slice(0,4)!==song.last.slice(0,4)?`–${song.last.slice(0,4)}`:''} · ${[...song.series.keys()].map(genre=>esc(charts.find(c=>c.genre===genre).name)).join(' / ')}</span>${release?`<span class="release-name">${esc(release.album)}</span><a href="${esc(release.url)}" target="_blank" rel="noopener noreferrer"><img class="store-badge" src="/brand/listen-on-apple-music.svg" alt="Listen on Apple Music (opens in a new tab)" width="100" height="29" loading="lazy"></a>`:''}</span><span class="song-summary-stats"><b>#${song.peak}</b> best rank<span>${song.rows.length} appearances</span></span><span class="song-toggle" aria-hidden="true">+</span></summary>
      <div class="song-details">${renderRelease(release,esc)}<p class="muted">${song.first} – ${song.last} · ${song.rows.length} song-week appearances across ${song.series.size} ${song.series.size===1?'chart':'charts'}.</p>
      ${[...song.series].map(([genre, rows]) => {
        const journey = rankJourney(rows);
        const name = charts.find(c=>c.genre===genre).label;
        const label = `${song.title} on ${name}: ${rows.length} appearances, best observed rank ${journey.peak.this_week}.`;
        const ticks = [1, Math.round(journey.ceiling/2), journey.ceiling];
        return `<section class="song-chart" aria-label="${esc(name)} journey"><h3>${esc(name)}</h3><div class="journey-meta"><span><b>#${journey.peak.this_week}</b> peak · ${link(chartHref(genre,journey.peak.date),journey.peak.date)}</span><span>${rows.filter(row=>row.this_week<=10).length} top-10 appearances</span></div>
        <svg class="rank-journey" data-genre="${genre}" data-ceiling="${journey.ceiling}" data-series="${esc(JSON.stringify(rows.map(row=>[row.date,row.this_week])))}" viewBox="0 0 640 206" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><desc>Higher is better. Dates run left to right. Gaps separate nonconsecutive chart weeks. Exact values are in the weekly history below.</desc>
        ${ticks.map(rank=>{const y=22+(rank-1)/(journey.ceiling-1)*142;return `<line x1="46" x2="594" y1="${y}" y2="${y}" class="journey-grid"/><text x="35" y="${y+4}" text-anchor="end">#${rank}</text>`;}).join('')}
        ${journey.runs.map(run=>run.length===1?`<circle cx="${run[0].x}" cy="${run[0].y}" r="3.5" class="journey-dot"/>`:`<path d="${run.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ')}" class="journey-line"/>`).join('')}
        <circle cx="${journey.peak.x.toFixed(1)}" cy="${journey.peak.y.toFixed(1)}" r="5" class="journey-peak"/>
        <text x="46" y="195">${rows[0].date}</text><text x="594" y="195" text-anchor="end">${rows.at(-1).date}</text></svg>
        <p class="journey-inspect" hidden><span class="journey-value"></span> · <a class="journey-week" href="${chartHref(genre,journey.peak.date)}">Open this week →</a></p><p class="journey-note muted">Higher is better · Gaps indicate weeks without an entry in this archive.</p></section>`;
      }).join('')}
      <details class="song-weeks"><summary>View all ${song.rows.length} weekly positions</summary><div class="table-scroll"><table><caption class="muted">${esc(song.title)} · newest first</caption><thead><tr><th scope="col">Rank</th><th scope="col">Chart</th><th scope="col">Week</th></tr></thead><tbody>${song.rows.map(row=>`<tr><td>${row.this_week}</td><td>${esc(charts.find(c=>c.genre===row.genre).name)}</td><td>${link(chartHref(row.genre,row.date),row.date)}</td></tr>`).join('')}</tbody></table></div></details>
      </div></details>`;
  }).join('')}</div>`;
}

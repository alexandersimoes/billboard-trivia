/** Keep original titles intact; do not merge remixes or similarly named songs. */
export function groupArtistSongs(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.song)) groups.set(row.song, { title: row.song, rows: [], series: new Map() });
    const group = groups.get(row.song);
    group.rows.push(row);
    if (!group.series.has(row.genre)) group.series.set(row.genre, []);
    group.series.get(row.genre).push(row);
  }
  for (const song of groups.values()) {
    song.rows.sort((a, b) => b.date.localeCompare(a.date) || a.this_week - b.this_week);
    song.first = song.rows.at(-1).date;
    song.last = song.rows[0].date;
    song.peak = Math.min(...song.rows.map(row => row.this_week));
    for (const series of song.series.values()) series.sort((a, b) => a.date.localeCompare(b.date));
  }
  return [...groups.values()].sort((a, b) => b.last.localeCompare(a.last) || a.title.localeCompare(b.title));
}

/** Real elapsed time on X, best rank at the top; missing weeks break the line. */
export function rankJourney(rows) {
  const points = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const day = date => Date.parse(`${date}T00:00:00Z`) / 86400000;
  const first = day(points[0].date), last = day(points.at(-1).date);
  const ceiling = Math.max(10, Math.ceil(Math.max(...points.map(row => row.this_week)) / 10) * 10);
  const x = date => last === first ? 320 : 46 + (day(date) - first) / (last - first) * 548;
  const y = rank => 22 + (rank - 1) / (ceiling - 1) * 142;
  const runs = [];
  points.forEach((row, index) => {
    if (!index || day(row.date) - day(points[index - 1].date) > 8) runs.push([]);
    runs.at(-1).push({ ...row, x: Number(x(row.date).toFixed(1)), y: Number(y(row.this_week).toFixed(1)) });
  });
  const peak = points.reduce((best, row) => row.this_week < best.this_week ? row : best);
  return { runs, ceiling, peak: { ...peak, x: x(peak.date), y: y(peak.this_week) } };
}

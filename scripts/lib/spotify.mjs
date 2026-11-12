// Spotify Charts (charts.spotify.com).
//
// Two endpoints matter:
//   public/v0/charts                       no login; top 50 of the LATEST weekly global chart only
//   auth/v0/charts/<alias>/<YYYY-MM-DD>    needs a logged-in bearer token; top 200 for any week
//
// The weekly updater uses the public one (no credentials to manage). History comes
// from scripts/import_spotify_history.mjs, fed by a one-off export from a logged-in browser.

const PUBLIC_URL = 'https://charts-spotify-com-service.spotify.com/public/v0/charts';
export const SPOTIFY_TOP_N = 50;

/** Convert Spotify chart entries to the repo's chart JSON rows. */
export function convertEntries(entries, topN = SPOTIFY_TOP_N) {
  return entries
    .map((e) => {
      const c = e.chartEntryData || {};
      const t = e.trackMetadata || {};
      const pos = (n) => (Number.isInteger(n) && n > 0 ? n : null);
      return {
        song: (t.trackName || '').trim(),
        artist: (t.artists || []).map((a) => a.name).filter(Boolean).join(', '),
        this_week: c.currentRank,
        last_week: pos(c.previousRank),
        peak_position: pos(c.peakRank),
        weeks_on_chart: pos(c.appearancesOnChart),
        new: c.entryStatus === 'NEW_ENTRY',
      };
    })
    .filter((r) => r.song && r.artist && Number.isInteger(r.this_week) && r.this_week <= topN)
    .sort((a, b) => a.this_week - b.this_week);
}

/** Latest "Weekly Top Songs: Global" from the public endpoint. Dates are the Thursday the week ends. */
export async function fetchLatestSpotifyGlobal() {
  const res = await fetch(PUBLIC_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Spotify charts: HTTP ${res.status}`);
  const body = await res.json();
  const chart = (body.chartEntryViewResponses || []).find(
    (c) => c.displayChart?.chartMetadata?.alias === 'REGIONAL_GLOBAL_WEEKLY'
  );
  if (!chart) throw new Error('Spotify charts: REGIONAL_GLOBAL_WEEKLY missing from the public response');
  const data = convertEntries(chart.entries || []);
  if (data.length < 40) throw new Error(`Spotify charts: only ${data.length} usable entries`);
  return { date: chart.displayChart.date, data };
}

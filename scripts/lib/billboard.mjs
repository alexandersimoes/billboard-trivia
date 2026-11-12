// Billboard chart fetcher + parser.
//
// billboard.com has no public API; charts are server-rendered HTML at
//   https://www.billboard.com/charts/<slug>/            (latest week)
//   https://www.billboard.com/charts/<slug>/YYYY-MM-DD/ (the week containing that date)
//
// The parser leans on the visible text of each row ("LW 3 PEAK 1 WEEKS ON CHART 12")
// rather than CSS class names, which Billboard changes often (that is what broke
// the old billboard.py based scripts).

import * as cheerio from 'cheerio';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

export class ChartNotFoundError extends Error {}
export class ChartParseError extends Error {}

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const toInt = (s) => (/^\d+$/.test(s || '') ? parseInt(s, 10) : null);

export function chartUrl(slug, date) {
  return `https://www.billboard.com/charts/${slug}/${date ? `${date}/` : ''}`;
}

/** Parse a Billboard chart page into { date, data: [...] } (the repo's JSON format). */
export function parseChartHtml(html, slug = '') {
  const $ = cheerio.load(html);

  const date = $('#chart-date-picker').attr('data-date') || null;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ChartParseError(`${slug}: could not find the chart date on the page`);
  }

  const data = [];
  $('.o-chart-results-list-row-container').each((_, el) => {
    const row = $(el);
    const titleEl = row.find('h3#title-of-a-story, h3.c-title').first();
    const song = clean(titleEl.text());
    const artist = clean(titleEl.nextAll('span').first().text());
    const text = clean(row.text());

    const rank = toInt((text.match(/^(\d+)\b/) || [])[1]);
    // Stats repeat (desktop + mobile markup); the first occurrence is enough.
    const lw = (text.match(/\bLW (\d+|-)/) || [])[1];
    const peak = toInt((text.match(/\bPEAK (\d+)/) || [])[1]);
    const weeks = toInt((text.match(/\bWEEKS ON CHART (\d+)/) || [])[1]);
    if (!song || !artist || rank === null) return;

    // Badges sit between the rank and the title.
    const head = text.slice(0, Math.max(0, text.indexOf(song)));
    const isReentry = /RE-\s*ENTRY/i.test(head);
    const isNew = !isReentry && /\bNEW\b/.test(head);

    data.push({
      song,
      artist,
      this_week: rank,
      last_week: toInt(lw),
      peak_position: peak,
      weeks_on_chart: weeks,
      new: isNew,
    });
  });

  if (!data.length) throw new ChartParseError(`${slug} ${date}: no chart rows found (markup changed or paywalled)`);
  return { date, data };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch one chart week. `date` omitted = latest published week. */
export async function fetchChart(slug, date, { retries = 3 } = {}) {
  const url = chartUrl(slug, date);
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow' });
      if (res.status === 404) throw new ChartNotFoundError(`${slug}: chart not found (${url})`);
      if (!res.ok) throw new Error(`${slug}: HTTP ${res.status} for ${url}`);
      // Unknown slugs redirect to the /charts/ index instead of 404ing.
      if (!new URL(res.url).pathname.startsWith(`/charts/${slug}`)) {
        throw new ChartNotFoundError(`${slug}: redirected to ${res.url}`);
      }
      return parseChartHtml(await res.text(), slug);
    } catch (err) {
      if (err instanceof ChartNotFoundError || err instanceof ChartParseError) throw err;
      lastErr = err;
      await sleep(1500 * (attempt + 1));
    }
  }
  throw lastErr;
}

/** YYYY-MM-DD + n days (UTC, no DST surprises). */
export function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

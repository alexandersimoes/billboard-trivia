#!/usr/bin/env node
// Fetch every chart week that Supabase is missing, save it under public/charts/,
// and ingest it. Safe to run as often as you like: it only does work when a chart
// has a newer week than the database.
//
//   node scripts/update_charts.mjs                      all charts, missing weeks only
//   node scripts/update_charts.mjs --chart hot-100      one chart (repeatable; app id or slug)
//   node scripts/update_charts.mjs --since 2013-01-19   also fill gaps back to this date
//   node scripts/update_charts.mjs --backfill           fill gaps back to each chart's first week
//   node scripts/update_charts.mjs --no-ingest          download JSON only
//   node scripts/update_charts.mjs --dry-run            report what is missing, change nothing
//   node scripts/update_charts.mjs --force              refetch + re-ingest even if present

import { fetchChart, addDays, ChartNotFoundError } from './lib/billboard.mjs';
import { fetchLatestSpotifyGlobal } from './lib/spotify.mjs';
import { CHARTS, getSupabase, getLatestWeek, getStoredWeeks, ingestWeek, readChartFile, writeChartFile } from './lib/ingest.mjs';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const values = (name) => argv.flatMap((a, i) => (a === `--${name}` && argv[i + 1] ? [argv[i + 1]] : []));

const opts = {
  charts: values('chart'),
  since: values('since')[0] || null,
  backfill: flag('backfill'),
  ingest: !flag('no-ingest'),
  dryRun: flag('dry-run'),
  force: flag('force'),
  concurrency: parseInt(values('concurrency')[0] || '3', 10),
};
if (opts.since && !/^\d{4}-\d{2}-\d{2}$/.test(opts.since)) {
  console.error('--since must be YYYY-MM-DD');
  process.exit(2);
}

const sb = opts.ingest || opts.dryRun ? getSupabase() : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pool(items, size, worker) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await worker(items[next++]);
    })
  );
}

// Pages download in parallel, but database writes go one week at a time:
// neighbouring weeks share most songs, and parallel upserts of the same rows deadlock.
let queue = Promise.resolve();
function serial(fn) {
  const run = queue.then(fn);
  queue = run.catch(() => {});
  return run;
}

async function updateBillboard(chart) {
  const { slug } = chart;
  const latest = await fetchChart(slug);
  writeIfWanted(slug, latest);

  const dbLatest = sb ? await getLatestWeek(sb, slug) : null;
  // Where to stop walking backwards. By default any hole in the last two years is
  // filled too, so a failed or skipped run heals itself on the next one.
  let floor;
  if (opts.since) floor = opts.since;
  else if (opts.backfill || !dbLatest) floor = chart.since || latest.date;
  else floor = addDays(latest.date, -7 * 104);
  if (chart.since && floor < chart.since) floor = chart.since;

  const stored = sb && !opts.force ? await getStoredWeeks(sb, slug, addDays(floor, -7)) : new Set();

  // Billboard weeks are 7 days apart; asking for any date returns the week containing it.
  const wanted = [];
  for (let d = latest.date; d >= floor; d = addDays(d, -7)) if (!stored.has(d)) wanted.push(d);

  if (!wanted.length) return report(slug, `up to date (${dbLatest})`);
  if (opts.dryRun) return report(slug, `${wanted.length} week(s) missing: ${wanted.at(-1)} .. ${wanted[0]}`);

  let done = 0;
  let failed = 0;
  const seen = new Set();
  await pool(wanted, opts.concurrency, async (date) => {
    try {
      let payload = date === latest.date ? latest : !opts.force ? readChartFile(slug, date) : null;
      if (!payload) {
        payload = await fetchChart(slug, date);
        await sleep(250);
      }
      // Before a chart existed (or in a skipped week) Billboard answers with the nearest week.
      if (seen.has(payload.date) || (stored.has(payload.date) && payload.date !== date)) return;
      seen.add(payload.date);
      writeIfWanted(slug, payload);
      if (opts.ingest) await serial(() => ingestWeek(sb, slug, payload));
      done++;
      if (done % 25 === 0) report(slug, `${done}/${wanted.length} weeks...`);
    } catch (err) {
      failed++;
      console.error(`  ${slug} ${date}: ${err.message}`);
    }
  });
  report(slug, `${done} week(s) ${opts.ingest ? 'ingested' : 'downloaded'} (${wanted.at(-1)} .. ${wanted[0]})${failed ? `, ${failed} FAILED` : ''}`);
  if (failed) process.exitCode = 1;
}

async function updateSpotify(chart) {
  const { slug } = chart;
  const latest = await fetchLatestSpotifyGlobal();
  const dbLatest = sb ? await getLatestWeek(sb, slug) : null;
  if (dbLatest && dbLatest >= latest.date && !opts.force) return report(slug, `up to date (${dbLatest})`);
  if (opts.dryRun) return report(slug, `1 week missing: ${latest.date}`);
  if (dbLatest && addDays(dbLatest, 7) < latest.date) {
    console.warn(`  ${slug}: gap between ${dbLatest} and ${latest.date}. The public feed only has the latest week; ` +
      'fill older weeks with scripts/import_spotify_history.mjs.');
  }
  if (opts.ingest) {
    // The public feed has no peak / weeks-on-chart, so they are derived from stored history,
    // then written back to the local file so it matches the database.
    await ingestWeek(sb, slug, latest, { derive: true });
  }
  writeChartFile(slug, latest);
  report(slug, `1 week ${opts.ingest ? 'ingested' : 'downloaded'} (${latest.date})`);
}

function writeIfWanted(slug, payload) {
  if (!opts.dryRun) writeChartFile(slug, payload);
}

function report(slug, msg) {
  console.log(`${slug.padEnd(28)} ${msg}`);
}

const selected = opts.charts.length
  ? CHARTS.filter((c) => opts.charts.includes(c.slug) || opts.charts.includes(c.id))
  : CHARTS;
if (!selected.length) {
  console.error(`No matching chart. Known: ${CHARTS.map((c) => c.slug).join(', ')}`);
  process.exit(2);
}

for (const chart of selected) {
  try {
    if (chart.source === 'spotify') await updateSpotify(chart);
    else await updateBillboard(chart);
  } catch (err) {
    process.exitCode = 1;
    const hint = err instanceof ChartNotFoundError ? ' (did Billboard rename the chart? update lib/charts.json)' : '';
    console.error(`${chart.slug.padEnd(28)} FAILED: ${err.message}${hint}`);
  }
}

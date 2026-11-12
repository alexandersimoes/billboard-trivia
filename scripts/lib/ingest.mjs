// Batched Supabase ingest for one chart week.
//
// One week = ~5 requests (chart_type, chart_week, artists, songs, entries) instead
// of ~3 requests per chart entry, so a full Hot 100 week lands in about a second.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CHARTS_DIR = path.join(ROOT, 'public', 'charts');
export const CHARTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'charts.json'), 'utf-8'));

export function getSupabase() {
  dotenv.config({ path: path.join(ROOT, '.env.local'), quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE (set them in .env.local or the environment).');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

const chartTypeIds = new Map();

export async function getChartTypeId(sb, slug, { create = true } = {}) {
  if (chartTypeIds.has(slug)) return chartTypeIds.get(slug);
  const found = must(await sb.from('chart_type').select('id').eq('slug', slug).maybeSingle(), 'chart_type lookup');
  let id = found?.id ?? null;
  if (id === null && create) {
    const label = CHARTS.find((c) => c.slug === slug)?.label ?? slug;
    id = must(await sb.from('chart_type').insert({ slug, label }).select('id').single(), 'chart_type insert').id;
  }
  if (id !== null) chartTypeIds.set(slug, id);
  return id;
}

/** Latest week_date stored for a chart, or null when the chart has no data yet. */
export async function getLatestWeek(sb, slug) {
  const id = await getChartTypeId(sb, slug, { create: false });
  if (id === null) return null;
  const rows = must(
    await sb.from('chart_week').select('week_date').eq('chart_type_id', id).order('week_date', { ascending: false }).limit(1),
    'latest week'
  );
  return rows[0]?.week_date ?? null;
}

/** All week_dates stored for a chart on or after `since`. */
export async function getStoredWeeks(sb, slug, since = '1900-01-01') {
  const id = await getChartTypeId(sb, slug, { create: false });
  const out = new Set();
  if (id === null) return out;
  for (let from = 0; ; from += 1000) {
    const rows = must(
      await sb.from('chart_week').select('week_date').eq('chart_type_id', id).gte('week_date', since).order('week_date').range(from, from + 999),
      'stored weeks'
    );
    rows.forEach((r) => out.add(r.week_date));
    if (rows.length < 1000) break;
  }
  return out;
}

/**
 * Charts that do not publish peak / weeks-on-chart (Spotify's public feed) get
 * them derived from what is already stored for earlier weeks of the same chart.
 */
async function deriveStats(sb, chartTypeId, weekDate, rows) {
  const ids = rows.map((r) => r.song_id);
  const prior = must(
    await sb
      .from('chart_entry')
      .select('song_id, this_week, peak_position, weeks_on_chart, chart_week!inner(week_date, chart_type_id)')
      .eq('chart_week.chart_type_id', chartTypeId)
      .lt('chart_week.week_date', weekDate)
      .in('song_id', ids)
      .order('weeks_on_chart', { ascending: false })
      .limit(5000),
    'prior entries'
  );
  const best = new Map();
  for (const p of prior) {
    const b = best.get(p.song_id) || { weeks: 0, peak: Infinity };
    b.weeks = Math.max(b.weeks, p.weeks_on_chart ?? 0);
    b.peak = Math.min(b.peak, p.peak_position ?? p.this_week);
    best.set(p.song_id, b);
  }
  for (const r of rows) {
    const b = best.get(r.song_id);
    r.weeks_on_chart = (b?.weeks ?? 0) + 1;
    r.peak_position = Math.min(b?.peak ?? Infinity, r.this_week);
    r.is_new = !b;
  }
}

/**
 * Ingest one week. `payload` is the repo's chart JSON: { date, data: [{ song, artist,
 * this_week, last_week, peak_position, weeks_on_chart, new }] }.
 * Idempotent: re-ingesting a week updates it in place.
 */
export async function ingestWeek(sb, slug, payload, { derive = false } = {}) {
  const entries = (payload.data || [])
    .map((e) => ({ ...e, song: String(e.song ?? '').trim(), artist: String(e.artist ?? '').trim() }))
    .filter((e) => e.song && e.artist && Number.isInteger(e.this_week));
  if (!entries.length) throw new Error(`${slug} ${payload.date}: no valid entries`);

  const chartTypeId = await getChartTypeId(sb, slug);
  const week = must(
    await sb
      .from('chart_week')
      .upsert({ chart_type_id: chartTypeId, week_date: payload.date }, { onConflict: 'chart_type_id,week_date' })
      .select('id')
      .single(),
    'chart_week upsert'
  );

  try {
    const artistNames = [...new Set(entries.map((e) => e.artist))];
    const artists = must(
      await sb.from('artist').upsert(artistNames.map((name) => ({ name })), { onConflict: 'name' }).select('id, name'),
      'artist upsert'
    );
    const artistId = new Map(artists.map((a) => [a.name, a.id]));

    const songKey = (aid, title) => `${aid}\u0000${title}`;
    const songRows = new Map();
    for (const e of entries) {
      const aid = artistId.get(e.artist);
      if (aid === undefined) throw new Error(`${slug} ${payload.date}: artist not returned by upsert: ${e.artist}`);
      songRows.set(songKey(aid, e.song), { artist_id: aid, title: e.song });
    }
    const songs = must(
      await sb.from('song').upsert([...songRows.values()], { onConflict: 'artist_id,title' }).select('id, artist_id, title'),
      'song upsert'
    );
    const songId = new Map(songs.map((s) => [songKey(s.artist_id, s.title), s.id]));

    const rows = new Map();
    for (const e of entries) {
      const sid = songId.get(songKey(artistId.get(e.artist), e.song));
      if (sid === undefined) throw new Error(`${slug} ${payload.date}: song not returned by upsert: ${e.song}`);
      if (rows.has(sid)) continue; // same song listed twice in one week: keep the higher rank
      rows.set(sid, {
        chart_week_id: week.id,
        song_id: sid,
        this_week: e.this_week,
        last_week: e.last_week ?? null,
        peak_position: e.peak_position ?? null,
        weeks_on_chart: e.weeks_on_chart ?? null,
        is_new: e.new === true,
      });
    }
    const entryRows = [...rows.values()];
    if (derive) await deriveStats(sb, chartTypeId, payload.date, entryRows);

    must(await sb.from('chart_entry').upsert(entryRows, { onConflict: 'chart_week_id,song_id' }), 'chart_entry upsert');
    return entryRows.length;
  } catch (err) {
    // Never leave an empty week behind: the updater treats a stored week as done.
    const { count } = await sb.from('chart_entry').select('id', { count: 'exact', head: true }).eq('chart_week_id', week.id);
    if (count === 0) await sb.from('chart_week').delete().eq('id', week.id);
    throw err;
  }
}

export function chartFilePath(slug, date) {
  return path.join(CHARTS_DIR, slug, `${slug}-${date}.json`);
}

export function readChartFile(slug, date) {
  const p = chartFilePath(slug, date);
  if (!fs.existsSync(p)) return null;
  try {
    const obj = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return Array.isArray(obj?.data) && obj.data.length ? obj : null;
  } catch {
    return null;
  }
}

export function writeChartFile(slug, payload) {
  const p = chartFilePath(slug, payload.date);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(payload, null, 2));
  return p;
}

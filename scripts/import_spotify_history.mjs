#!/usr/bin/env node
// Import past weeks of Spotify "Weekly Top Songs: Global".
//
// Spotify's public feed only exposes the latest week (that is what
// update_charts.mjs uses), so history has to come from charts.spotify.com while
// logged in. Two inputs are accepted:
//
//   1. The CSVs from the download button on each chart page
//      (regional-global-weekly-YYYY-MM-DD.csv):
//        node scripts/import_spotify_history.mjs ~/Downloads/regional-global-weekly-*.csv
//
//   2. A text dump with one "# YYYY-MM-DD" header per week followed by
//      rank|peak|previous|weeks|title|artists rows:
//        node scripts/import_spotify_history.mjs dump.txt
//
// Only the top 50 is kept so history matches the weekly public feed.
// Add --no-ingest to only write public/charts/spotify-global/*.json.

import fs from 'node:fs';
import path from 'node:path';
import { getSupabase, ingestWeek, writeChartFile } from './lib/ingest.mjs';
import { SPOTIFY_TOP_N } from './lib/spotify.mjs';

const SLUG = 'spotify-global';
const args = process.argv.slice(2);
const ingest = !args.includes('--no-ingest');
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('Usage: node scripts/import_spotify_history.mjs <file.csv|dump.txt>... [--no-ingest]');
  process.exit(2);
}

const num = (s) => {
  const n = parseInt(String(s ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function row(rank, peak, prev, weeks, song, artist) {
  const last = num(prev);
  return {
    song: song.trim(),
    artist: artist.trim(),
    this_week: num(rank),
    last_week: last,
    peak_position: num(peak),
    weeks_on_chart: num(weeks),
    new: last === null && num(weeks) === 1,
  };
}

function fromCsv(file) {
  const date = (path.basename(file).match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
  if (!date) throw new Error(`${file}: no YYYY-MM-DD in the file name`);
  const lines = fs.readFileSync(file, 'utf-8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`${file}: missing column "${name}"`);
    return i;
  };
  const c = { rank: col('rank'), artist: col('artist_names'), song: col('track_name'), peak: col('peak_rank'), prev: col('previous_rank'), weeks: col('weeks_on_chart') };
  const data = lines.slice(1).map(parseCsvLine).map((f) => row(f[c.rank], f[c.peak], f[c.prev], f[c.weeks], f[c.song] || '', f[c.artist] || ''));
  return [{ date, data }];
}

function fromDump(file) {
  const weeks = [];
  for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const head = line.match(/^#\s*(\d{4}-\d{2}-\d{2})/);
    if (head) { weeks.push({ date: head[1], data: [] }); continue; }
    const parts = line.split('|');
    if (parts.length < 6 || !weeks.length) continue;
    const [rank, peak, prev, wks] = parts;
    weeks.at(-1).data.push(row(rank, peak, prev, wks, parts.slice(4, -1).join('|'), parts.at(-1)));
  }
  return weeks;
}

const weeks = files
  .flatMap((f) => (f.toLowerCase().endsWith('.csv') ? fromCsv(f) : fromDump(f)))
  .map((w) => ({
    date: w.date,
    data: w.data.filter((r) => r.song && r.artist && r.this_week && r.this_week <= SPOTIFY_TOP_N).sort((a, b) => a.this_week - b.this_week),
  }))
  .sort((a, b) => a.date.localeCompare(b.date));

const sb = ingest ? getSupabase() : null;
let ok = 0;
for (const w of weeks) {
  if (w.data.length < 40) {
    console.error(`  ${w.date}: only ${w.data.length} usable rows, skipped`);
    continue;
  }
  writeChartFile(SLUG, w);
  if (sb) await ingestWeek(sb, SLUG, w);
  ok++;
}
console.log(`${SLUG}: ${ok}/${weeks.length} week(s) ${ingest ? 'ingested' : 'written'}${weeks.length ? ` (${weeks[0].date} .. ${weeks.at(-1).date})` : ''}`);

#!/usr/bin/env node
// Ingest chart JSON files that are already on disk (no network fetches).
//
//   node scripts/ingest_charts_dir.mjs                      every chart under public/charts
//   node scripts/ingest_charts_dir.mjs hot-100              one chart folder
//   node scripts/ingest_charts_dir.mjs hot-100 2026-01-10   one chart, weeks on/after a date
//
// Files: public/charts/<slug>/<slug>-YYYY-MM-DD.json  ->  { date, data: [...] }
// For the normal weekly refresh use scripts/update_charts.mjs instead.

import fs from 'node:fs';
import path from 'node:path';
import { CHARTS_DIR, getSupabase, ingestWeek } from './lib/ingest.mjs';

const [chartFilter, since] = process.argv.slice(2);
const sb = getSupabase();

const slugs = fs
  .readdirSync(CHARTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && (!chartFilter || d.name === chartFilter))
  .map((d) => d.name);
if (!slugs.length) {
  console.error(`No chart folders found under ${CHARTS_DIR}${chartFilter ? ` matching "${chartFilter}"` : ''}`);
  process.exit(1);
}

let failed = 0;
for (const slug of slugs) {
  const files = fs
    .readdirSync(path.join(CHARTS_DIR, slug))
    .map((name) => ({ name, date: (name.match(new RegExp(`^${slug}-(\\d{4}-\\d{2}-\\d{2})\\.json$`)) || [])[1] }))
    .filter((f) => f.date && (!since || f.date >= since))
    .sort((a, b) => a.date.localeCompare(b.date));

  let ok = 0;
  for (const f of files) {
    try {
      const payload = JSON.parse(fs.readFileSync(path.join(CHARTS_DIR, slug, f.name), 'utf-8'));
      await ingestWeek(sb, slug, { ...payload, date: f.date });
      ok++;
    } catch (err) {
      failed++;
      console.error(`  ${slug} ${f.date}: ${err.message}`);
    }
  }
  console.log(`${slug.padEnd(28)} ${ok}/${files.length} week(s) ingested`);
}
process.exit(failed ? 1 : 0);

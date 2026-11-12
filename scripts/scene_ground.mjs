#!/usr/bin/env node
// Turn a genre street illustration into the transparent "ground" layer that sits
// at the bottom of every screen, as one image scaled to the screen width. For a
// fixed-height footer that repeats its middle instead, use scene_slices.mjs.
//
//   node scripts/scene_ground.mjs <input.png> <genre> [--tolerance 9] [--preview]
//   node scripts/scene_ground.mjs ~/Downloads/pop.png pop      -> public/scenes/pop/ground.webp
//
// The sky is removed (or kept transparent if it already is) and empty rows at
// the top are trimmed. Prints the --ground-ratio to set in globals.css.
//   --tolerance 9   max per-channel step between neighbouring sky pixels
//   --preview       also write ground-preview.png flattened on green, to check the cut

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { loadGround, webp } from './lib/scene_image.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const preview = args.includes('--preview');
if (preview) args.splice(args.indexOf('--preview'), 1);
const tolerance = Number(flag('--tolerance', 9));
const [input, genre] = args;
if (!input || !genre) {
  console.error('usage: node scripts/scene_ground.mjs <input.png> <genre> [--tolerance 9] [--preview]');
  process.exit(1);
}

const { rgba, W, H, trimmed, mode } = await loadGround(input, { tolerance });
const raw = { raw: { width: W, height: H, channels: 4 } };
const outDir = path.join('public', 'scenes', genre);
mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'ground.webp');
const { size } = await sharp(rgba, raw).webp(webp).toFile(out);
console.log(`${out}  ${W}x${H}  ${(size / 1024).toFixed(0)} KB  ${mode}${trimmed ? `  trimmed ${trimmed}px from top` : ''}`);
console.log(`--ground-ratio: ${(W / H).toFixed(3)};`);
if (preview) {
  const p = path.join(outDir, 'ground-preview.png');
  await sharp(rgba, raw).flatten({ background: '#00c853' }).png().toFile(p);
  console.log(`${p}  (delete once checked)`);
}

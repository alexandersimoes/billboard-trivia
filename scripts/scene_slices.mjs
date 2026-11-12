#!/usr/bin/env node
// Cut a genre street illustration into a three-part footer: a left end and a
// right end that stay put, and a middle tile that repeats between them. The
// footer then keeps a fixed height at any screen width instead of growing with
// it (scene_ground.mjs makes a single image that scales to the width instead).
//
//   node scripts/scene_slices.mjs <input.png> <genre> --left <x> --right <x> [options]
//
//   --left <x>       source column where the left end stops and the tile starts
//   --right <x>      source column where the tile stops and the right end starts
//   --blend 110      width in px of the overlap the tile's wrap seam is found
//                    in (its last columns switch, along the least visible
//                    path, to the columns that lead into its first one)
//   --hard <y0:y1>   source rows that wrap with a straight cut at --left/--right
//                    instead, e.g. a fence when those sit on post centres
//                    (repeatable)
//   --tolerance 9    sky flood-fill tolerance, as in scene_ground.mjs
//   --preview <w>    also write slices-preview.png: the footer assembled at w px
//                    wide over a flat sky colour, to check the joins
//
// Pick --left and --right on matching features (fence posts, lamp posts, gaps
// between bushes) so the tile's edges meet cleanly. Writes left/mid/right.webp
// to public/scenes/<genre>/ and prints the CSS variables for globals.css.

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { loadGround, webp } from './lib/scene_image.mjs';

const args = process.argv.slice(2);
const opts = { hard: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith('--')) continue;
  const v = args[i + 1];
  if (a === '--hard') opts.hard.push(v.split(':').map(Number));
  else opts[a.slice(2)] = v;
  args.splice(i, 2);
  i--;
}
const [input, genre] = args;
const left = Number(opts.left), right = Number(opts.right);
const blend = Number(opts.blend ?? 110);
if (!input || !genre || !left || !right || right <= left) {
  console.error('usage: node scripts/scene_slices.mjs <input.png> <genre> --left <x> --right <x> [--blend 110] [--hard y0:y1] [--preview 1600]');
  process.exit(1);
}

const { rgba, W, H, trimmed, mode } = await loadGround(input, { tolerance: Number(opts.tolerance ?? 9) });
if (left - blend < 0) throw new Error(`--blend ${blend} needs ${blend}px of art left of --left ${left}`);
const px = (x, y) => (y * W + x) * 4;

function slice(x0, x1) {
  const w = x1 - x0;
  const out = Buffer.alloc(w * H * 4);
  for (let y = 0; y < H; y++) rgba.copy(out, y * w * 4, px(x0, y), px(x1, y));
  return { buf: out, w };
}

const hardRow = y => opts.hard.some(([a, b]) => y + trimmed >= a && y + trimmed <= b);

// Join two overlapping strips of source columns with a seam instead of a fade:
// in each row, `part` takes strip A (source columns from `aX`) left of the seam
// and strip B (from `bX`) right of it. The seam is the cheapest top-to-bottom
// path through the difference between A and B (as in image quilting), so it
// slips through gaps where both strips show the same thing, typically sky,
// and never leaves half-transparent ghosts. `hardAt` pins the seam in hard
// rows (count = all A, 0 = all B). A 2px feather softens the switch.
function seam(part, at, count, aX, bX, hardAt) {
  const cost = new Float64Array(H * (count + 1));
  for (let y = 0; y < H; y++) {
    for (let s = 0; s <= count; s++) {
      let c;
      if (hardRow(y)) c = s === hardAt ? 0 : Infinity;
      else {
        // Cost of switching between columns s-1 (A) and s (B): how different
        // A and B look there, premultiplied so transparent pixels match. At
        // s = 0 or count this reaches one column outside the overlap, which
        // is where the switch would otherwise happen.
        c = 0;
        for (const i of [s - 1, s]) {
          const clampX = x => Math.min(W - 1, Math.max(0, x));
          const a = px(clampX(aX + i), y), b = px(clampX(bX + i), y);
          const aA = rgba[a + 3] / 255, bA = rgba[b + 3] / 255;
          for (let k = 0; k < 3; k++) c += Math.abs(rgba[a + k] * aA - rgba[b + k] * bA);
          c += Math.abs(rgba[a + 3] - rgba[b + 3]);
        }
      }
      cost[y * (count + 1) + s] = c;
    }
  }
  // Dynamic programming: the seam moves at most 2 columns per row.
  const total = new Float64Array(H * (count + 1));
  const from = new Int32Array(H * (count + 1));
  for (let s = 0; s <= count; s++) total[s] = cost[s];
  for (let y = 1; y < H; y++) {
    for (let s = 0; s <= count; s++) {
      let best = Infinity, arg = s;
      for (let d = -2; d <= 2; d++) {
        const p = s + d;
        if (p < 0 || p > count) continue;
        const t = total[(y - 1) * (count + 1) + p] + Math.abs(d) * 4;
        if (t < best) { best = t; arg = p; }
      }
      total[y * (count + 1) + s] = best + cost[y * (count + 1) + s];
      from[y * (count + 1) + s] = arg;
    }
  }
  const path = new Int32Array(H);
  let s = 0;
  for (let k = 1; k <= count; k++) if (total[(H - 1) * (count + 1) + k] < total[(H - 1) * (count + 1) + s]) s = k;
  for (let y = H - 1; y >= 0; y--) { path[y] = s; s = from[y * (count + 1) + s]; }

  for (let y = 0; y < H; y++) {
    for (let i = 0; i < count; i++) {
      const w = Math.min(1, Math.max(0, (i - path[y] + 1.5) / 3)); // 0 = A, 1 = B
      const a = px(aX + i, y), b = px(bX + i, y);
      const aA = rgba[a + 3] / 255, bA = rgba[b + 3] / 255;
      const outA = aA * (1 - w) + bA * w;
      const o = (y * part.w + at + i) * 4;
      for (let k = 0; k < 3; k++) {
        const c = rgba[a + k] * aA * (1 - w) + rgba[b + k] * bA * w;
        part.buf[o + k] = outA ? Math.round(c / outA) : 0;
      }
      part.buf[o + 3] = Math.round(outA * 255);
    }
  }
}

// Middle tile: columns [left, right). Its last `blend` columns switch, along a
// seam, to the columns just before `left`, so its right edge flows into its
// own left edge. Hard rows keep the tile's own art (they wrap on a post).
const mid = slice(left, right);
seam(mid, mid.w - blend, blend, right - blend, left - blend, blend);

// Right end: the tile now ends looking like the columns before `left`, so
// whatever follows should begin like `left`. Its first columns switch along a
// seam from [left, left + blend) to its own art. Hard rows are its own art.
const rightEnd = slice(right, W);
seam(rightEnd, 0, Math.min(blend, rightEnd.w), left, right, 0);

const outDir = path.join('public', 'scenes', genre);
mkdirSync(outDir, { recursive: true });
const parts = { left: slice(0, left), mid, right: rightEnd };
for (const [name, { buf, w }] of Object.entries(parts)) {
  const file = path.join(outDir, `${name}.webp`);
  const { size } = await sharp(buf, { raw: { width: w, height: H, channels: 4 } }).webp(webp).toFile(file);
  console.log(`${file}  ${w}x${H}  ${(size / 1024).toFixed(0)} KB`);
}
console.log(`${mode}${trimmed ? `, trimmed ${trimmed}px from top` : ''}\n`);
console.log(`  --ground-l: url("/scenes/${genre}/left.webp");`);
console.log(`  --ground-m: url("/scenes/${genre}/mid.webp");`);
console.log(`  --ground-r: url("/scenes/${genre}/right.webp");`);
console.log(`  --ground-l-w: ${(left / H).toFixed(4)};`);
console.log(`  --ground-r-w: ${((W - right) / H).toFixed(4)};`);

if (opts.preview) {
  // Assemble like the CSS does: ends pinned, middle tile stretched slightly so
  // a whole number of copies fits (background-repeat: round).
  const total = Number(opts.preview);
  const scale = Math.min(1, total / W);
  const h = Math.round(H * scale);
  const lw = Math.round(left * scale), rw = Math.round((W - right) * scale);
  const span = total - lw - rw;
  const n = Math.max(1, Math.round(span / (mid.w * scale)));
  const tw = span / n;
  const img = (p, w) => sharp(p.buf, { raw: { width: p.w, height: H, channels: 4 } }).resize(Math.max(1, Math.round(w)), h, { fit: 'fill' }).png().toBuffer();
  const layers = [{ input: await img(parts.left, lw), left: 0, top: 0 }];
  for (let k = 0; k < n; k++) layers.push({ input: await img(mid, Math.round(tw * (k + 1)) - Math.round(tw * k)), left: lw + Math.round(tw * k), top: 0 });
  layers.push({ input: await img(parts.right, rw), left: total - rw, top: 0 });
  const p = path.join(outDir, 'slices-preview.png');
  await sharp({ create: { width: total, height: h, channels: 3, background: opts.bg ?? '#0b6965' } }).composite(layers).png().toFile(p);
  console.log(`\n${p}  ${n} tile(s) at ${(tw / (mid.w * scale) * 100).toFixed(0)}% width  (delete once checked)`);
}

// Shared image handling for the scene scripts: load a ground illustration, make
// its sky transparent, and trim the empty rows above the tallest element.

import sharp from 'sharp';

/**
 * @returns {{ rgba: Buffer, W: number, H: number, trimmed: number, mode: string }}
 *   rgba is W×H RGBA after trimming; `trimmed` is how many source rows were cut.
 */
export async function loadGround(input, { tolerance = 9 } = {}) {
  const { data: src, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;

  let topIsClear = true;
  for (let x = 0; x < W && topIsClear; x++) if (src[x * 4 + 3] !== 0) topIsClear = false;

  const rgba = Buffer.from(src);
  if (topIsClear) {
    // Already transparent. Some generators top out just below full opacity
    // (e.g. 253), which lets the sky show faintly through; stretch to 255.
    let maxAlpha = 0;
    for (let i = 3; i < src.length; i += 4) if (src[i] > maxAlpha) maxAlpha = src[i];
    const scale = maxAlpha ? 255 / maxAlpha : 1;
    for (let i = 3; i < rgba.length; i += 4) rgba[i] = Math.min(255, Math.round(src[i] * scale));
  } else {
    // Flood-fill the sky from the top row. It is a smooth gradient, so the fill
    // follows it and stops at the inked outlines.
    const sky = new Uint8Array(W * H);
    const step = (a, b) => Math.max(
      Math.abs(src[a * 4] - src[b * 4]),
      Math.abs(src[a * 4 + 1] - src[b * 4 + 1]),
      Math.abs(src[a * 4 + 2] - src[b * 4 + 2]),
    );
    const stack = [];
    for (let x = 0; x < W; x++) {
      if (x === 0 || step(x, x - 1) <= tolerance) { sky[x] = 1; stack.push(x); }
    }
    const visit = (from, to) => {
      if (sky[to] || step(from, to) > tolerance) return;
      sky[to] = 1;
      stack.push(to);
    };
    while (stack.length) {
      const i = stack.pop();
      const x = i % W, y = (i / W) | 0;
      if (x + 1 < W) visit(i, i + 1);
      if (x > 0) visit(i, i - 1);
      if (y + 1 < H) visit(i, i + W);
      if (y > 0) visit(i, i - W);
    }
    for (let i = 0; i < W * H; i++) {
      let a = sky[i] ? 0 : 255;
      if (!sky[i]) {
        // Soften the outermost pixel of the cut so edges don't look jagged.
        const x = i % W, y = (i / W) | 0;
        const n = (x + 1 < W && sky[i + 1]) + (x > 0 && sky[i - 1]) + (y + 1 < H && sky[i + W]) + (y > 0 && sky[i - W]);
        if (n >= 2) a = 170;
      }
      rgba[i * 4 + 3] = a;
    }
  }

  // Trim empty rows above the tallest element, keeping a small margin.
  let first = 0;
  find: for (; first < H; first++) for (let x = 0; x < W; x++) if (rgba[(first * W + x) * 4 + 3] > 8) break find;
  const trimmed = first > H * 0.1 ? Math.max(0, first - Math.round(H * 0.04)) : 0;
  return {
    rgba: rgba.subarray(trimmed * W * 4),
    W,
    H: H - trimmed,
    trimmed,
    mode: topIsClear ? 'already transparent' : 'sky removed',
  };
}

export const webp = { quality: 86, alphaQuality: 90, effort: 6 };

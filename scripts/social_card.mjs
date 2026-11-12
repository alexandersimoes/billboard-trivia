// Rebuild the link-preview image from the existing Dance scene (no network).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/social', { recursive: true });
const art = await sharp('public/scenes/dance/left.webp').resize({ height: 580 }).png().toBuffer();
const text = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="shade"><stop stop-color="#180c39"/><stop offset="1" stop-color="#180c39" stop-opacity="0.2"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <g fill="#f6ead6" font-family="Georgia, serif">
    <text x="80" y="112" font-size="35">TuneTrivia</text>
    <text x="76" y="290" font-size="88">Name that tune.</text>
  </g>
  <g fill="#f6ead6" font-family="Arial, sans-serif">
    <text x="82" y="360" font-size="28">11 charts. Decades of hits. One good ear.</text>
    <text x="82" y="535" font-size="22">Free music trivia · trivia.rocks</text>
  </g>
  <rect x="82" y="410" width="70" height="4" rx="2" fill="#e8f45a"/>
</svg>`);
await sharp('public/scenes/dance/sky.webp').resize(1200, 630, { fit: 'cover' })
  .composite([{ input: art, left: 855, top: 50 }, { input: text }])
  .jpeg({ quality: 86, mozjpeg: true }).toFile('public/social/trivia.jpg');
console.log('Created public/social/trivia.jpg (1200×630)');

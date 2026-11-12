// Rebuild all browser and home-screen icons from the editable SVG master.
// Run: node scripts/favicon.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync('public/favicon.svg');
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()));
const directory = Buffer.alloc(6 + images.length * 16);
directory.writeUInt16LE(1, 2); // Windows icon
directory.writeUInt16LE(images.length, 4);
let offset = directory.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index];
  directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
const ico = Buffer.concat([directory, ...images]);
writeFileSync('public/favicon.ico', ico);
// Keep the former dark-mode URL consistent for cached pages.
writeFileSync('public/favicon-dark.ico', ico);
await sharp(source).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('Created 16/32/48px favicon.ico and 180px apple-touch-icon.png');

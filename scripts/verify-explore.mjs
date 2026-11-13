import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
let bytes=0,pages=0;const checked=new Set();
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){walk(file);continue;}bytes+=fs.statSync(file).size;if(!file.endsWith('.html')||!file.includes('/explore/'))continue;pages++;const html=fs.readFileSync(file,'utf8');assert(html.includes('rel="canonical"'));assert(html.includes('name="description"'));if(!html.includes('http-equiv="refresh"'))assert(html.includes('application/ld+json'));for(const [,href]of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){if(checked.has(href))continue;checked.add(href);const target=path.join('out',href,href.endsWith('/')?'index.html':'');assert(fs.existsSync(target),`Missing link: ${href} in ${file}`);}}}
walk('out');assert(bytes<1_000_000_000,`Export exceeds GitHub Pages 1GB limit: ${bytes}`);assert(pages>1000);console.log(`Verified ${pages} exploration pages, ${checked.size} local links/assets; ${(bytes/1e6).toFixed(1)} MB total.`);

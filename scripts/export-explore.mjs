import { releaseKey, renderRelease } from './lib/song-releases.mjs';
import { groupArtistSongs } from './lib/artist-songs.mjs';
import { renderArtistSongs } from './lib/render-artist-songs.mjs';
import fs from 'node:fs';
import path from 'node:path';
// Next exports the development route's placeholder as a file. Replace that
// generated placeholder with the real archive directory during postbuild.
if (fs.existsSync('out/explore') && fs.statSync('out/explore').isFile()) {
  if (fs.readFileSync('out/explore', 'utf8') !== 'The exploration archive is generated during postbuild.') {
    throw new Error('Unexpected file at out/explore; refusing to replace it.');
  }
  fs.unlinkSync('out/explore');
}
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync('lib/explore-links.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const mod={exports:{}};new Function('exports',compiled)(mod.exports);const {artistSlug,artistHref,chartHref}=mod.exports;
const charts=JSON.parse(fs.readFileSync('lib/charts.json','utf8'));
const images=JSON.parse(fs.readFileSync('data/artist-images.json','utf8'));
const releaseSeed=fs.existsSync('data/song-releases.json')?JSON.parse(fs.readFileSync('data/song-releases.json','utf8')).releases:{};
const releaseCache=fs.existsSync('.cache/music-releases/catalog.json')?JSON.parse(fs.readFileSync('.cache/music-releases/catalog.json','utf8')).releases:{};
const releases=Object.fromEntries(Object.entries({...releaseSeed,...releaseCache}).filter(([,release])=>release));
const getRelease=(artist,song)=>releases[releaseKey(artist,song)];
for(const directory of ['public/release-data','out/release-data']){
 fs.mkdirSync(directory,{recursive:true});
 for(const release of Object.values(releases))fs.writeFileSync(`${directory}/${release.collectionId}.json`,JSON.stringify({album:release.album,artwork:release.artwork,url:release.url}));
}
// The badge is shared by all catalog links, including development-route pages.
fs.mkdirSync('out/brand',{recursive:true});fs.copyFileSync('public/brand/listen-on-apple-music.svg','out/brand/listen-on-apple-music.svg');

const artists=new Map(), weeks=new Map(), summaries=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label)=>`<a href="${esc(url)}">${esc(label)}</a>`;
const site='https://trivia.rocks';const urls=[];
const style=fs.readFileSync('public/explore.css','utf8');
fs.writeFileSync('out/explore.css',style);
function emit(url,title,description,body,type='CollectionPage'){
 const target=path.join('out',url,'index.html');fs.mkdirSync(path.dirname(target),{recursive:true});urls.push(url);
 const json=JSON.stringify({'@context':'https://schema.org','@type':type,name:title,description,url:site+url,isPartOf:{'@type':'WebSite',name:'TuneTrivia',url:site}}).replace(/</g,'\\u003c');
 fs.writeFileSync(target,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | TuneTrivia</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${site+url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${site+url}"><meta property="og:type" content="website"><meta property="og:image" content="${site}/social/trivia.jpg"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml"><link rel="stylesheet" href="/explore.css"><script type="application/ld+json">${json}</script></head><body><a class="skip" href="#main-content">Skip to content</a><header><a class="brand" href="/">TuneTrivia</a><nav><a href="/explore/">Explore</a><a href="/explore/artists/">Artists</a><a href="/explore/charts/">Charts</a><a href="/">Play trivia</a></nav></header><main id="main-content">${body}</main><footer>Statistics describe the available TuneTrivia archive, not an artist’s entire career. Artist names preserve the original chart credit, including collaborations. Charts credited to Billboard and Spotify.<br><a href="/explore/">Explore the archive</a> · <a href="/">Play music trivia</a></footer><script src="/explore.js" defer></script></body></html>`);
}
function table(rows){return `<div class="table-scroll"><table><thead><tr><th scope="col">Rank</th><th scope="col">Song / artist</th><th scope="col">Last week</th><th scope="col">Peak</th><th scope="col">Weeks</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.this_week}</td><th scope="row">${esc(r.song)}<small style="display:block;font-weight:400">${link(artistHref(r.artist),r.artist)}</small>${getRelease(r.artist,r.song)?`<span class="chart-release" data-release="${getRelease(r.artist,r.song).collectionId}"></span>`:''}</th><td>${r.last_week||'—'}</td><td>${r.peak_position||'—'}</td><td>${r.weeks_on_chart||'—'}</td></tr>`).join('')}</tbody></table></div>`;}
for(const c of charts){const rows=JSON.parse(fs.readFileSync(`.cache/explore/${c.slug}.json`,'utf8'));const dates=new Map();
 for(const r of rows){if(!r.date||!r.artist||!r.song||!Number.isFinite(r.this_week))throw new Error('Invalid archive row');if(!dates.has(r.date))dates.set(r.date,[]);dates.get(r.date).push(r);const slug=artistSlug(r.artist);if(!artists.has(slug))artists.set(slug,{name:r.artist,slug,rows:[]});const a=artists.get(slug);if(a.name!==r.artist)throw new Error('Artist slug collision');a.rows.push({...r,genre:c.genre});}
 const ds=[...dates.keys()].sort();weeks.set(c.genre,ds);summaries.push({genre:c.genre,name:c.name,label:c.label,weeks:ds.length,first:ds[0],last:ds.at(-1)});
 for(let i=0;i<ds.length;i++){const d=ds[i],entries=dates.get(d).sort((a,b)=>a.this_week-b.this_week);emit(chartHref(c.genre,d),`${c.label} — ${d}`,`Explore ${entries.length} songs on the ${c.label} chart for ${d}, led by ${entries[0]?.song} by ${entries[0]?.artist}. See ranks and artist chart histories.`,`<p class="eyebrow">${link(chartHref(c.genre),c.name+' chart archive')}</p><h1>${esc(c.label)}</h1><p>Week of <time datetime="${d}">${d}</time> · ${entries.length} songs</p><a class="button" href="/trivia/${c.genre}/?mode=specific&week=${d}">Play this week</a><nav class="pagination">${i?link(chartHref(c.genre,ds[i-1]),'← Previous chart'):''}${i<ds.length-1?link(chartHref(c.genre,ds[i+1]),'Next chart →'):''}</nav>${table(entries)}`);}
 const years=[...new Set(ds.map(d=>d.slice(0,4)))].reverse();
 emit(chartHref(c.genre),`${c.label} chart archive`, `Browse ${ds.length} available weeks of ${c.label}, from ${ds[0]} to ${ds.at(-1)}. Explore songs, artists and music trivia.`,`<p class="eyebrow">${link('/explore/charts/','All charts')}</p><h1>${esc(c.label)} archive</h1><p>${ds.length.toLocaleString()} weeks · ${ds[0]} to ${ds.at(-1)}</p><p>${ds.length?link(chartHref(c.genre,ds.at(-1)),'Explore the latest chart →'):''}</p><div class="cards">${years.map(y=>link(chartHref(c.genre,y),`${y} · ${ds.filter(d=>d.startsWith(y)).length} weeks`)).join('')}</div>`);
 for(const y of years)emit(chartHref(c.genre,y),`${c.label} charts in ${y}`,`Browse every available ${c.label} chart week from ${y}. Discover the songs and artists that charted.`,`<p>${link(chartHref(c.genre),c.name+' archive')}</p><h1>${esc(c.label)} in ${y}</h1><div class="cards">${ds.filter(d=>d.startsWith(y)).reverse().map(d=>link(chartHref(c.genre,d),d)).join('')}</div>`);
}
const catalog=[];
for(const a of artists.values()){
 a.rows.sort((x,y)=>y.date.localeCompare(x.date)||x.this_week-y.this_week);const genres=[...new Set(a.rows.map(r=>r.genre))];const songs=new Set(a.rows.map(r=>r.song));const peak=Math.min(...a.rows.map(r=>r.this_week));const periods={};for(const r of a.rows){const key=`${r.genre}:${r.date.slice(0,4)}`;periods[key]=(periods[key]||0)+1;}
 catalog.push({name:a.name,slug:a.slug,genres,songs:songs.size,entries:a.rows.length,periods});
 const photo=images[a.slug];const grouped=groupArtistSongs(a.rows);const pages=Math.ceil(grouped.length/20);
 for(let page=1;page<=pages;page++){const base=artistHref(a.name),url=page===1?base:`${base}page/${page}/`;const songPage=grouped.slice((page-1)*20,page*20);
 emit(url,`${a.name} — chart history${page>1?` (page ${page})`:''}`,`${a.name}: ${songs.size} songs and ${a.rows.length} chart appearances across ${genres.length} charts in the available archive. Best observed rank: #${peak}.`,`${photo?`<figure><img src="${esc(photo.url)}" alt="${esc(a.name)}" width="200" loading="lazy"><figcaption><details><summary>Photo credits</summary>${esc(photo.credit)} · ${link(photo.source,'Source')} · ${link(photo.licenseUrl || photo.source,photo.license)} · ${esc(photo.changes)}</details></figcaption></figure>`:''}<p class="eyebrow">${link('/explore/artists/','Artist explorer')}</p><h1>${esc(a.name)}</h1><p class="muted">Chart history · ${a.rows.at(-1).date} – ${a.rows[0].date}</p><div class="stats"><div><strong>${songs.size}</strong>Distinct song titles</div><div><strong>#${peak}</strong>Best observed rank</div><div><strong>${a.rows.length.toLocaleString()}</strong>Song-week appearances</div></div><p>Charted on ${genres.map(g=>link(chartHref(g),charts.find(c=>c.genre===g).name)).join(' · ')}</p><h2>Songs and their chart journeys</h2><p class="muted">One card per song, newest chart activity first. Open a song to follow its rise, peak and return to the charts.</p>${renderArtistSongs(songPage,{esc,link,charts,chartHref,artistSlug,getRelease,renderRelease,artist:a.name})}<nav class="pagination">${page>1?link(page===2?base:`${base}page/${page-1}/`,'← Previous songs'):''}<span>Page ${page} of ${pages}</span>${page<pages?link(`${base}page/${page+1}/`,'More songs →'):''}</nav>`,'ProfilePage');
 }
 for(let oldPage=pages+1;oldPage<=Math.ceil(a.rows.length/100);oldPage++){
  const target=path.join('out',artistHref(a.name),'page',String(oldPage),'index.html');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const destination=artistHref(a.name);
  fs.writeFileSync(target,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${destination}"><meta name="description" content="This artist’s chart history is now grouped by song."><link rel="canonical" href="${site+destination}"><title>${esc(a.name)} — song journeys</title></head><body>${link(destination,'View songs and chart journeys')}</body></html>`);
 }
}
const suggestions={};
for(const a of catalog)for(const [period,count] of Object.entries(a.periods)){const [genre,year]=period.split(':');for(const key of [period,`${genre}:${Math.floor(Number(year)/10)*10}s`]){suggestions[key] ||= new Map();suggestions[key].set(a.name,(suggestions[key].get(a.name)||0)+count);}}
const featured=Object.fromEntries(Object.entries(suggestions).map(([key,values])=>[key,[...values].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name])=>name)]));
for(const a of catalog)delete a.periods;
catalog.sort((a,b)=>b.entries-a.entries||a.name.localeCompare(b.name));
fs.mkdirSync('public/explore-data',{recursive:true});fs.writeFileSync('public/explore-data/suggestions.json',JSON.stringify(featured));fs.writeFileSync('public/explore-data/artists.json',JSON.stringify(catalog));fs.writeFileSync('public/explore-data/weeks.json',JSON.stringify(Object.fromEntries(weeks)));
fs.mkdirSync('out/explore-data',{recursive:true});fs.copyFileSync('public/explore-data/suggestions.json','out/explore-data/suggestions.json');fs.copyFileSync('public/explore-data/artists.json','out/explore-data/artists.json');fs.copyFileSync('public/explore-data/weeks.json','out/explore-data/weeks.json');
const chartCards=summaries.map(c=>`<a class="card" href="${chartHref(c.genre)}"><strong>${esc(c.name)}</strong>${c.weeks.toLocaleString()} chart weeks<br><span class="muted">${c.first} – ${c.last}</span></a>`).join('');
emit('/explore/','Explore music charts and artists','Discover chart history by artist, genre and week. Browse Billboard and Spotify songs, then test your music knowledge.',`<p class="eyebrow">Follow the music</p><h1>Every song has a chart story.</h1><p>Find an artist. Revisit a week. Discover what was playing.</p><div class="cards"><a class="card" href="/explore/artists/"><strong>Explore artists →</strong>Follow songs across charts and years.</a><a class="card" href="/explore/charts/"><strong>Explore charts →</strong>Step into a week’s full soundtrack.</a></div><h2>Choose your chart</h2><div class="cards">${chartCards}</div>`);
emit('/explore/charts/','Browse Billboard and Spotify chart archives','Browse weekly charts by genre, year and date, with complete song lists and artist histories.',`<h1>Explore the charts</h1><p>Choose a chart, then travel to a year and week.</p><div class="cards">${chartCards}</div>`);
for(const c of charts){const matches=catalog.filter(a=>a.genres.includes(c.genre));for(let p=0;p<Math.ceil(matches.length/100);p++){const base=`/explore/artists/genre/${c.genre}/`;emit(p?`${base}page/${p+1}/`:base,`${c.name} artists and chart histories${p?` — page ${p+1}`:''}`,`Explore artist credits from ${c.label}, their songs and weekly chart positions.`,`<p>${link('/explore/artists/','All artists')}</p><h1>${esc(c.name)} artists</h1><p>${matches.length.toLocaleString()} artist credits in the archive.</p><div class="cards">${matches.slice(p*100,(p+1)*100).map(a=>`<a class="card" href="/explore/artists/${a.slug}/"><strong>${esc(a.name)}</strong>${a.songs} songs across the archive</a>`).join('')}</div><nav class="pagination">${p?link(p===1?base:`${base}page/${p}/`,'← Previous'):''}${(p+1)*100<matches.length?link(`${base}page/${p+2}/`,'Next →'):''}</nav>`);}}
// Paginated, crawlable directory; search enhances it without hiding links from crawlers.
for(let p=0;p<Math.ceil(catalog.length/100);p++){const url=p?`/explore/artists/page/${p+1}/`:'/explore/artists/';emit(url,`Explore artists${p?` — page ${p+1}`:''}`,`Browse artists and chart credits across Billboard and Spotify. Search by name and filter by chart genre.`, `<h1>Explore artists</h1><nav>${charts.map(c=>link(`/explore/artists/genre/${c.genre}/`,c.name)).join('')}</nav><p>Discover who charted, which songs made it, and when.</p><div class="tools"><input id="artist-search" type="search" aria-label="Search artists" placeholder="Find an artist…"><select id="artist-genre" aria-label="Filter artists by genre"><option value="">All genres</option>${charts.map(c=>`<option value="${c.genre}">${esc(c.name)}</option>`).join('')}</select></div><p id="artist-status" role="status"></p><div id="artist-results" class="cards">${catalog.slice(p*100,(p+1)*100).map(a=>`<a class="card" href="/explore/artists/${a.slug}/"><strong>${esc(a.name)}</strong>${a.songs} songs · ${a.entries.toLocaleString()} appearances</a>`).join('')}</div><nav class="pagination">${p?link(p===1?'/explore/artists/':`/explore/artists/page/${p}/`,'← Previous'):''}<span>Page ${p+1}</span>${(p+1)*100<catalog.length?link(`/explore/artists/page/${p+2}/`,'Next →'):''}</nav>`);}
fs.writeFileSync('out/explore.js',fs.readFileSync('public/explore.js'));
const batches=[];for(let i=0;i<urls.length;i+=10000){const filename=`explore-sitemap-${batches.length+1}.xml`;batches.push(filename);fs.writeFileSync(`out/${filename}`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.slice(i,i+10000).map(u=>`<url><loc>${site+u}</loc></url>`).join('')}</urlset>`);}
fs.writeFileSync('out/explore-sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${batches.map(f=>`<sitemap><loc>${site}/${f}</loc></sitemap>`).join('')}</sitemapindex>`);
console.log(`Exported ${urls.length} pages; ${catalog.length} artist credits.`);

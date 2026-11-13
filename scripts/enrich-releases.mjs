// Bounded, resumable catalog enrichment. One artist search can match many songs.
// node scripts/enrich-releases.mjs --artist='Death Cab for Cutie' --seed
import fs from 'node:fs';
import { matchRelease, releaseKey } from './lib/song-releases.mjs';
const charts=JSON.parse(fs.readFileSync('lib/charts.json','utf8'));
const argument=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const limit=Number(argument('limit')||20);if(!Number.isInteger(limit)||limit<1||limit>1000)throw Error('limit must be between 1 and 1000');
const filter=argument('artist');const file='.cache/music-releases/catalog.json';
const read=p=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{releases:{},artists:{}};
const seed=read('data/song-releases.json'), cached=read(file);
const state={releases:{...seed.releases,...cached.releases},artists:{...seed.artists,...cached.artists}};
const artists=new Map();
for(const c of charts){for(const r of JSON.parse(fs.readFileSync(`.cache/explore/${c.slug}.json`,'utf8'))){
 if(filter&&r.artist!==filter)continue;
 if(!artists.has(r.artist))artists.set(r.artist,{name:r.artist,songs:new Set(),last:r.date,count:0});
 const a=artists.get(r.artist);a.songs.add(r.song);a.last=a.last>r.date?a.last:r.date;a.count++;
}}
const queue=[...artists.values()].filter(a=>process.argv.includes('--refresh')||!state.artists[a.name]||Date.now()-Date.parse(state.artists[a.name].checkedAt)>30*86400000).sort((a,b)=>b.last.localeCompare(a.last)||b.count-a.count).slice(0,limit);
fs.mkdirSync('.cache/music-releases',{recursive:true});let matched=0;
for(const [index,artist] of queue.entries()){
 if(index)await new Promise(resolve=>setTimeout(resolve,3200));
 const url=new URL('https://itunes.apple.com/search');url.search=new URLSearchParams({term:artist.name,entity:'song',attribute:'artistTerm',limit:'200',country:'US',media:'music'});
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Catalog request failed (${response.status}); saved progress is retained. Retry later.`);
 const data=await response.json();if(!Array.isArray(data.results))throw Error('Invalid catalog response');let count=0;
 for(const song of artist.songs){const release=matchRelease(artist.name,song,data.results);if(release){state.releases[releaseKey(artist.name,song)]=release;count++;matched++;}else state.releases[releaseKey(artist.name,song)]=null;}
 state.artists[artist.name]={checkedAt:new Date().toISOString(),matched:count,total:artist.songs.size};
 fs.writeFileSync(file+'.tmp',JSON.stringify(state,null,2));fs.renameSync(file+'.tmp',file);
 console.log(`${artist.name}: ${count}/${artist.songs.size} song releases matched`);
}
if(process.argv.includes('--seed'))fs.writeFileSync('data/song-releases.json',JSON.stringify(state,null,2)+'\n');
console.log(`${queue.length} artists checked; ${matched} matches this run; ${Object.values(state.releases).filter(Boolean).length} cached releases.`);

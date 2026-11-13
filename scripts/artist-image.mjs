// Explicit identity matching: node scripts/artist-image.mjs 'Taylor Swift' Q26876
import fs from 'node:fs';
import sharp from 'sharp';
import ts from 'typescript';
const [name,id]=process.argv.slice(2);
if(!name||!/^Q\d+$/.test(id||''))throw Error('Supply an exact chart credit and verified Wikidata Q ID');
const module={exports:{}};new Function('exports',ts.transpileModule(fs.readFileSync('lib/explore-links.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(module.exports);
const headers={'User-Agent':'TuneTrivia/1.0 (https://trivia.rocks; artist-image attribution importer)'};
async function get(url){const r=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Image source returned ${r.status}`);return r;}
const data=await (await get(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`)).json();
const entity=data.entities[id];
const names=[entity.labels.en?.value,...(entity.aliases.en||[]).map(a=>a.value)].filter(Boolean);
if(!names.some(n=>n.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error(`Identity mismatch: ${name} is not among ${names.join(', ')}`);
const filename=data.entities[id].claims.P18?.[0]?.mainsnak.datavalue?.value;if(!filename)throw Error('No image for this identity');
const url=new URL('https://commons.wikimedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',titles:`File:${filename}`,prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'400'});
const info=Object.values((await (await get(url)).json()).query.pages)[0].imageinfo[0];const meta=info.extmetadata;
const plain=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&');
const license=plain(meta.LicenseShortName?.value);if(!/^(CC BY(?:-SA)? [\d.]+|CC0(?: [\d.]+)?|Public domain)$/i.test(license))throw Error(`Review unsupported license: ${license}`);
const slug=module.exports.artistSlug(name);fs.mkdirSync('public/artist-images',{recursive:true});
await sharp(Buffer.from(await (await get(info.thumburl||info.url)).arrayBuffer())).rotate().resize({width:400,withoutEnlargement:true}).webp({quality:85}).toFile(`public/artist-images/${slug}.webp`);
const file='data/artist-images.json';const manifest=JSON.parse(fs.readFileSync(file,'utf8'));manifest[slug]={name,wikidata:id,url:`/artist-images/${slug}.webp`,credit:plain(meta.Artist?.value),license,source:info.descriptionurl,licenseUrl:meta.LicenseUrl?.value,changes:'Resized and converted to WebP'};fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log(`Imported ${name}; ${license}`);

'use client';
import { useEffect, useState } from 'react';
import portraits from '@/data/artist-images.json';
import { artistSlug } from '@/lib/explore-links';
import { artistHref } from '@/lib/explore-links';
type Suggestions = Record<string, string[]>;
let catalog: Promise<Suggestions> | undefined;
export default function ArtistSuggestions({ genre, year, decade }: { genre: string; year?: number | null; decade?: string }) {
 const [artists, setArtists] = useState<Suggestions>({});
 useEffect(() => { let active=true; catalog ||= fetch('/explore-data/suggestions.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>{catalog=undefined;return {};}); catalog.then(data=>{if(active)setArtists(data);});return()=>{active=false;}; }, []);
 const start=year || Number.parseInt(decade || '',10);if(!start)return null;
 
 const names=artists[`${genre}:${year || `${start}s`}`] || [];
 if(!names.length)return null;
 return <aside className="artist-suggestions"><p className="muted text-sm">On the charts in {year || `${start}s`}</p><div>{names.map(a=><a key={a} href={artistHref(a)} target="_blank" rel="noopener noreferrer">{(portraits as Record<string, {url:string}>)[artistSlug(a)] && <img src={(portraits as Record<string, {url:string}>)[artistSlug(a)].url} alt="" width="24" height="24" loading="lazy" />} {a}<span className="sr-only"> (opens in a new tab)</span></a>)}</div>{names.map(name => { const photo = (portraits as Record<string, {credit:string; license:string; source:string; licenseUrl?:string}>)[artistSlug(name)]; return photo ? <p className="muted text-xs" key={name}>Photo: {photo.credit} · <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.license}</a> (resized)</p> : null; })}<p className="muted text-xs">Explore their chart stories. Your quiz still draws from the full selection.</p></aside>;
}

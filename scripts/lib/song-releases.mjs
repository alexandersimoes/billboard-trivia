import { createHash } from 'node:crypto';

export const releaseKey = (artist, song) => createHash('sha256').update(JSON.stringify([artist, song])).digest('hex').slice(0,24);
const normalize = text => String(text || '').normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const version = text => [...new Set(String(text || '').toLowerCase().match(/\b(live|remix|instrumental|karaoke|acoustic|demo|remastered|remaster|edit)\b/g) || [])].sort().join(',');
const withoutFeature = text => String(text || '').replace(/\s*[([]?\s*(?:feat\.?|featuring|ft\.?)\s+.*$/i,'').trim();
const safeUrl = (value, domain) => { try {const url=new URL(value);return url.protocol==='https:'&&(url.hostname===domain||url.hostname.endsWith('.'+domain));} catch{return false;} };

export function matchRelease(artist, song, candidates) {
  const title=normalize(withoutFeature(song)), credited=normalize(withoutFeature(artist));
  const matches=candidates.filter(r=>r.kind==='song' && version(r.trackName)===version(song) && normalize(withoutFeature(r.trackName))===title
    && normalize(withoutFeature(r.artistName))===credited && r.collectionName && Number.isSafeInteger(r.collectionId)
    && safeUrl(r.artworkUrl100,'mzstatic.com') && (safeUrl(r.collectionViewUrl,'music.apple.com')||safeUrl(r.collectionViewUrl,'itunes.apple.com')));
  // Prefer standard releases over compilations/deluxe editions, then the oldest
  // catalog release. This is a matched edition, never a claim of original album.
  const penalty=r=>/greatest hits|best of|compilation/i.test(r.collectionName)?2:/deluxe|anniversary|remaster/i.test(r.collectionName)?1:0;
  matches.sort((a,b)=>penalty(a)-penalty(b)||String(a.releaseDate||'9999').localeCompare(String(b.releaseDate||'9999'))||a.collectionId-b.collectionId);
  const r=matches[0];if(!r)return null;
  const url=new URL(r.collectionViewUrl);url.searchParams.delete('i');
  return {artist, song, collectionId:r.collectionId, album:r.collectionName, artwork:r.artworkUrl100, url:url.href, releaseDate:r.releaseDate||null, source:'itunes', matchedArtist:r.artistName, matchedSong:r.trackName};
}

export function renderRelease(release, esc) {
  if(!release)return '';
  return `<div class="release-detail"><a href="${esc(release.url)}" target="_blank" rel="noopener noreferrer" class="release-cover-link"><img class="release-cover" src="${esc(release.artwork)}" alt="${esc(release.album)} cover" width="80" height="80" loading="lazy" decoding="async"></a><div><p class="release-label">Album / single</p><p class="release-name">${esc(release.album)}</p><a href="${esc(release.url)}" target="_blank" rel="noopener noreferrer"><img class="store-badge" src="/brand/listen-on-apple-music.svg" alt="Listen on Apple Music (opens in a new tab)" width="120" height="35" loading="lazy"></a><p class="release-note">Matched catalog release; editions may differ.</p></div></div>`;
}

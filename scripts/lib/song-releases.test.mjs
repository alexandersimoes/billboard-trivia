import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRelease,releaseKey } from './song-releases.mjs';
const base={kind:'song',trackName:'Soul Meets Body',artistName:'Death Cab for Cutie',collectionId:123,collectionName:'Plans',artworkUrl100:'https://is1-ssl.mzstatic.com/image/cover.jpg',collectionViewUrl:'https://music.apple.com/us/album/plans/123?i=456',releaseDate:'2005-08-30'};
test('retains matched release identity and links to the album',()=>{const r=matchRelease('Death Cab for Cutie','Soul Meets Body',[base]);assert.equal(r.album,'Plans');assert.equal(new URL(r.url).searchParams.has('i'),false);assert.equal(r.collectionId,123);});
test('rejects wrong artists, live versions, unsafe URLs and missing art',()=>{for(const patch of [{artistName:'Tribute Band'},{trackName:'Soul Meets Body (Live)'},{artworkUrl100:null},{collectionViewUrl:'javascript:alert(1)'},{artworkUrl100:'https://mzstatic.com.evil.test/a.jpg'}])assert.equal(matchRelease('Death Cab for Cutie','Soul Meets Body',[{...base,...patch}]),null);});
test('prefers a standard edition over a newer compilation or deluxe',()=>{const r=matchRelease('Death Cab for Cutie','Soul Meets Body',[{...base,collectionName:'Greatest Hits',collectionId:456},{...base,collectionName:'Plans (Deluxe)',collectionId:789},base]);assert.equal(r.album,'Plans');});
test('keys distinguish songs with the same title by different artists',()=>{assert.notEqual(releaseKey('A','Song'),releaseKey('B','Song'));assert.equal(releaseKey('A','Song'),releaseKey('A','Song'));});
test('featuring credits match while retaining the archive credit',()=>{const r=matchRelease('Artist Featuring Guest','Song',[{...base,artistName:'Artist',trackName:'Song (feat. Guest)'}]);assert.equal(r.artist,'Artist Featuring Guest');});

test('does not strip a live or remix suffix that follows a featuring credit',()=>{assert.equal(matchRelease('Artist','Song',[{...base,artistName:'Artist',trackName:'Song (feat. Guest) [Live]'}]),null);});

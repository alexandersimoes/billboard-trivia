import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { groupArtistSongs,rankJourney } from './artist-songs.mjs';
const rows=[{song:'Song',genre:'pop',date:'2020-01-04',this_week:20},{song:'Song',genre:'pop',date:'2020-01-11',this_week:1},{song:'Song',genre:'pop',date:'2020-02-01',this_week:10},{song:'Song',genre:'rock',date:'2020-01-04',this_week:5}];
test('groups exact titles, retains all chart series and sorts by latest activity',()=>{
 const songs=groupArtistSongs([...rows,{...rows[0],song:'Song (Remix)',date:'2021-01-02'}]);
 assert.equal(songs.length,2);assert.equal(songs[0].title,'Song (Remix)');assert.equal(songs[1].series.size,2);assert.equal(songs[1].rows.length,4);assert.equal(songs[1].peak,1);
});
test('rank 1 is at the top, dates use elapsed time, missing weeks break paths',()=>{
 const j=rankJourney(groupArtistSongs(rows)[0].series.get('pop'));
 assert.equal(j.runs.length,2);assert.equal(j.runs[0][1].y,22);assert.equal(j.runs[0][0].y,164);assert(j.runs[0][1].x<320);assert.equal(j.peak.date,'2020-01-11');
});
test('single appearances remain visible without a zero-width time scale',()=>{const j=rankJourney([rows[0]]);assert.equal(j.runs[0][0].x,320);assert(Number.isFinite(j.runs[0][0].y));});

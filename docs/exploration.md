# Music exploration archive

Production builds run `postbuild`: `explore-data.mjs` downloads the public, read-only chart view using the anonymous key, then `export-explore.mjs` writes fully rendered HTML into `out/explore`. No service-role key or database migration is needed. Existing query pagination is bounded at 1,000 rows; ordering is by date and position within a chart. Failed downloads never replace a completed chart snapshot. GitHub Pages serves these real directories directly, including deep links without JavaScript.

Routes: `/explore/`, `/explore/artists/`, `/explore/artists/genre/<genre>/`, `/explore/artists/<name-hash>/`, `/explore/charts/<genre>/`, `/explore/charts/<genre>/<year>/`, `/explore/charts/<genre>/<date>/`. Artist pages group exact song titles, with 20 complete song histories per page; artist directories paginate at 100 credits; each page has a canonical URL and previous/next links. Slugs preserve exact credited identities; collaborations are separate credits rather than guessed band-member splits. All statistics explicitly describe the available archive. They do not imply comprehensive career coverage, especially for Spotify.

`npm run explore:sync` refreshes the `.cache/explore` snapshots before a local rebuild. Fresh CI checkouts fetch all current data. The deployment schedule follows the chart ingestion schedule, so new weeks become static pages automatically. Run `npm run build -- --webpack` locally if Turbopack cannot run in the sandbox. The snapshots and generated JSON are ignored by Git. Sitemap files are split into batches of 10,000 URLs and listed in `explore-sitemap.xml`; robots.txt includes that index plus the original sitemap. robots.txt is advisory only, not access control. Google/Bing can crawl; named bulk/AI crawlers are disallowed.

## Preview and verification

The exploration HTML is generated after the Next build. The Next development server serves that archive at the same `/explore/` URLs, so game links work on any local port. Run a build once to generate it; rebuild after refreshing chart data. You can also preview the complete export with `python3 -m http.server 3015 --directory out`. `node scripts/verify-explore.mjs` checks every generated local link and the total export against the GitHub Pages 1 GB limit; it runs automatically after builds.

## Artist photography

Wikidata P18 supplies a Commons filename. Import only explicitly verified artist identities:

```
node scripts/artist-image.mjs 'Taylor Swift' Q26876
```

The importer retains the photographer, source page, license URL and resize/conversion notice, and accepts only supported reusable licenses. Images are downloaded as local WebP; attribution appears on the artist page. Commit `data/artist-images.json` and `public/artist-images` together. Review the identity and photo before publishing. Credits without a verified photograph remain text-first; album covers are never passed off as portraits.

## Analytics

GA4 G-QK6FDXGTSJ is installed on the game and static archive. It loads only on trivia.rocks/www.trivia.rocks. Keep Enhanced Measurement page views and browser-history changes enabled in the GA4 web stream for Next.js navigation. Realtime verification requires deployment; no analytics test traffic should be submitted.


## Song journeys

Each artist song expands into separate rank timelines for each chart, using actual elapsed dates and an inverted rank axis (No. 1 at the top). A gap greater than eight days breaks the line; it indicates missing archive entries, not a claim about why the song disappeared. Peak and top-10 counts are derived from the available rows. Weekly positions stay in accessible HTML tables. SVGs work without JavaScript; pointer and arrow-key inspection adds a selected-week link when JavaScript is available. Legacy appearance-page URLs beyond the new song pagination redirect to the artist overview and are excluded from the sitemap.

Validate grouping, timing and gaps with `node --test scripts/lib/artist-songs.test.mjs`.

## Album names and release artwork

The chart source has song titles and artist credits, not album identities. `scripts/enrich-releases.mjs` matches songs against the iTunes catalog, caching the album/single title, collection ID, artwork URL, store URL and matching metadata. It searches once per artist (up to 200 candidates), uses strict title/artist matching and preserves live/remix differences. Unmatched songs stay text-only. A matched release is not asserted to be the original album; reissues, singles and regional editions can differ.

```
npm run releases:enrich -- --artist='Death Cab for Cutie' --seed
npm run releases:enrich -- --limit=100
npm run postbuild
```

`--seed` saves verified catalog matches in `data/song-releases.json` for committing. Ongoing results and attempt dates live in `.cache/music-releases/catalog.json`. Successful artist searches are refreshed after 30 days, or with `--refresh`. Requests are paced at no more than about 19 per minute. The deploy workflow restores the enrichment cache, processes up to 100 artists (newest chart activity first), then builds; catalog downtime does not prevent a build using existing metadata. This incrementally expands coverage, but the catalog search limit and conservative matching mean some songs will remain unmatched.

Artist cards render release titles and covers directly in HTML. Weekly chart rows load shared per-release metadata only when near the viewport, without making API searches. This keeps the static archive within GitHub Pages limits. Covers use Apple's hosted artwork, with the official linked Apple Music badge nearby. No audio or cover binaries are cached by this pipeline. Source documentation: https://performance-partners.apple.com/search-api ; badge source: https://tools.applemediaservices.com/api/badges/listen-on-apple-music/badge/en-us?size=small .

Validate release matching with `node --test scripts/lib/song-releases.test.mjs`.

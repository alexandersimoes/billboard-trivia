# Chart data

The game reads chart history from Supabase (`chart_type` → `chart_week` → `chart_entry`,
exposed to the app through the `v_chart_entries` view). These scripts keep it current.

The list of charts lives in one place, [`lib/charts.json`](../lib/charts.json), shared by
the scripts and the app (name, Supabase slug, source, first week, colour theme).

## Weekly update

```bash
npm run charts:check    # what is missing, changes nothing
npm run charts:update   # fetch + save + ingest every missing week
```

`update_charts.mjs` asks Supabase for the weeks it already has, fetches anything newer
(and any hole in the last two years), writes `public/charts/<slug>/<slug>-YYYY-MM-DD.json`
and ingests it. Running it twice does nothing the second time.

```bash
node scripts/update_charts.mjs --chart hot-100            # one chart (app id or slug)
node scripts/update_charts.mjs --chart dance --backfill   # everything since the chart began
node scripts/update_charts.mjs --since 2024-01-06         # fill gaps back to a date
node scripts/update_charts.mjs --no-ingest                # download JSON only
node scripts/update_charts.mjs --force --since 2026-11-07 # refetch and overwrite
```

It needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` in `.env.local` (or the
environment).

### Automation

`.github/workflows/update-charts.yml` runs the update on Tuesday/Wednesday (Billboard)
and Friday/Saturday (Spotify) at 16:00 UTC, and can be started by hand from the Actions
tab. One-time setup: add the `SUPABASE_SERVICE_ROLE` repository secret
(`NEXT_PUBLIC_SUPABASE_URL` is already there for the deploy workflow).

GitHub pauses scheduled workflows after 60 days without repository activity; re-enable
it from the Actions tab if that happens. If Billboard ever blocks GitHub's IP ranges the
run fails loudly; `npm run charts:update` from a laptop does the same job and the
two-year gap healing catches up whatever was missed.

## Sources

| Source | How | Notes |
| --- | --- | --- |
| Billboard | `https://www.billboard.com/charts/<slug>/<date>/` HTML, parsed in `lib/billboard.mjs` | No API. Weeks are dated the Saturday after release. The parser reads the visible row text, not CSS classes. |
| Spotify | `charts-spotify-com-service.spotify.com/public/v0/charts` JSON, in `lib/spotify.mjs` | No login, but only the **latest** week and only the top 50. Peak and weeks-on-chart are derived from stored history at ingest. |

Billboard slugs do not follow a pattern (`rap-song`, `r-and-b-songs`,
`hot-mainstream-rock-tracks`, `dance-electronic-songs` ...). If a chart starts failing
with "chart not found", check the URL on billboard.com/charts and update `lib/charts.json`.

### Spotify history

Older Spotify weeks need a logged-in charts.spotify.com session. Download the CSV from
each week's page and run:

```bash
node scripts/import_spotify_history.mjs ~/Downloads/regional-global-weekly-*.csv
```

## Adding a chart

1. Add an entry to `lib/charts.json` (pick an unused `theme` or add a palette to
   `app/globals.css`).
2. `node scripts/update_charts.mjs --chart <id>` (a chart with no data backfills from `since`).
3. Add the new `genre` value to the `game_rounds_genre_check` constraint
   (see `migrations/add_new_chart_genres.sql`); until then games are saved as `other`.

## Other scripts

- `ingest_charts_dir.mjs` re-ingests JSON already under `public/charts/` (no fetching).
- `legacy/` holds the old `billboard.py`-based scripts. That library no longer parses
  billboard.com, so they are kept for reference only.

## Scene assets

Dance and Latin use the same transparent three-slice pipeline as the other genres.
The supplied sources were already transparent; no sky removal was necessary.

```bash
node scripts/scene_slices.mjs '/path/to/Neon Art Deco Waterfront Nightscape.png' dance --left 497 --right 1177 --hard 821:929
node scripts/scene_slices.mjs '/path/to/Sunset Colonial Plaza with Bougainvillea.png' latin --left 494 --right 1106 --hard 855:943
```

Dance's `sky.webp` is **Purple Night Sky Searchlights.png** and Latin's is
**Moody Smoggy Dusk Sky.png**, converted with Sharp at WebP quality 90.
The concept board is a visual reference only. Slice dimensions and CSS ratios are
printed by the helper; details are in [`docs/scene-prompts.md`](../docs/scene-prompts.md).
`node scripts/social_card.mjs` rebuilds the 1200×630 social preview from the Dance assets.

## Genre links and verification

Every chart has an exported page at `/trivia/<genre>/` (Pop uses `/trivia/pop/`).
The `difficulty`, `era`, `mode`, `year`, and `week` query parameters preserve quiz
settings. For example, `/trivia/dance/?difficulty=hard&era=2010` or
`/trivia/latin/?mode=specific&week=2024-01-06`. Links select the same settings;
they do not promise identical randomly selected songs. Canonicals intentionally
point to the genre page without query parameters.

Production origin for metadata and the sitemap is `SITE_URL` in `lib/seo.ts`.
Trailing slashes allow direct navigation to the exported genre directories on
GitHub Pages. No server rewrite is required.

```bash
npm run build
# If the local Turbopack helper cannot start: npm run build -- --webpack
python3 -m http.server 3015 --bind 127.0.0.1 --directory out
# In another terminal:
npx playwright install chromium
npx playwright test
```

Browser tests cover genre navigation/history, restoring shared settings, invalid
dates, clipboard fallback, exported metadata, and mobile overflow. Database calls
are stubbed in these tests so the results do not depend on live chart availability.

## Leaderboard

`/leaderboard/` defaults to one row per player, ranked by the sum of their five best
adjusted scores. Players can also be ranked by total original points or average
adjusted score (at least five matching games). Quick-play adjustment divides by
the scoring multiplier: easy 1, medium 1.5, hard 2.5. Classic scores are unchanged.
Zero-score completed games count toward averages. Scores round to one decimal;
ties share a competition rank (1, 1, 3).

Best games ranks individual original scores. Both boards support `period=week`,
`genre=dance`, `mode=quick`, and `difficulty=hard`; player weights use
`metric=best-five|total|average`. Weeks begin Monday at 00:00 UTC and use `ended_at`.
All filters apply before aggregation.

`roundId` locates an exact saved game; `highlight=me` locates the signed-in player's
latest completed game (or player aggregate on Top players). The first 100 rows
are displayed with an ellipsis and the selected row if it falls farther down.
Guest, missing, filtered-out, and unqualified results have explicit explanations.

The loader paginates all public completed rounds against a fixed completion cutoff,
checks the API's exact count, and fetches only the fields used on the board. It
fails visibly rather than publishing a rank from a partial result. Profiles are
fetched in batches. This works with the existing schema and RLS; no migration is
required. At the current 225 completed games, browser aggregation is small. If
the history grows substantially, move the same aggregation and rank rules into a
database RPC to avoid downloading the full history on each visit.

`npx playwright test tests/leaderboard.spec.ts tests/leaderboard-math.spec.ts` checks
weighting, ties, UTC boundaries, filtered totals, pagination beyond 500 rows,
rank 837, signed-in highlights, errors, and responsive layouts with mocked data.

## Results reveal

`components/GameResults.tsx` centers the end-of-game recap, animates the entrance,
and counts points, accuracy, streaks, and comparisons up to their final values.
Reduced-motion settings skip both motion and counting. Screen readers receive the
final numbers rather than every animation frame.

Comparisons use exact count-only requests against completed `game_rounds` with a
fixed completion cutoff, the same mode, and (for Quick play) the same difficulty.
The genre comparison also filters by genre; overall includes all genres. Both span
all eras and exclude the current saved round. Percentile is the floored percentage
of scores strictly below this score; ties are not counted as outscored. The top
percentage is its complement, with a minimum of 1%. At least ten comparable games
are required per group. No names or game histories are downloaded for these stats.

Guest results can be compared without saving. Missing samples and request failures
have fallbacks and never block replay. “Try again?” starts a fresh game with the
same genre, mode, difficulty, era or chart week. “Change selection” returns to the
setup screen with those settings retained.

## Picked-week chart wheel

Picked-week games show a chart-position reel before each clip. The reel uses real
`this_week` positions, wraps through the selected week's entries, then decelerates
to the chosen song. Unanswered names are skeletons (never hidden answer text).
Answered positions stay revealed. Playback and the answer clock are gated on the
landed highlight; autoplay blocking still requires a tap before starting the clock.
“Skip spin” and reduced-motion preferences land immediately.
On phones, the view moves from the landed wheel to the answer panel before audio
or the clock begins, keeping all four choices in reach.

The full week is loaded in rank order (up to 1,000 rows, so the Global 200 isn't
cut off at 100). The post-game “Reveal the full list” opens all available entries
with an animated reveal, artist/title search, movement/peak/weeks, and a filter for
answered songs from the quiz. Revealing doesn't make another network request.

Round cancellation aborts outstanding preview fetches, resolves a waiting spin,
and clears delayed retries. Failed previews choose an unused backup that isn't
already assigned to another round. The wheel lands on that backup's real position.
All visuals are CSS and inline SVG; no extra bitmap assets or animation dependency
are needed.

`tests/chart-wheel.spec.ts` covers playback sequencing, hidden names, full 200-entry
reveals, search, quiz filtering, reduced motion, autoplay rejection, missing previews,
and leaving mid-spin on desktop and mobile.

-- Allow games on the charts added in Nov 2026 (Streaming, Spotify, Global, Dance)
-- to be saved under their own genre instead of 'other'.
-- Run once in the Supabase SQL editor. Safe to re-run.

ALTER TABLE game_rounds DROP CONSTRAINT IF EXISTS game_rounds_genre_check;

ALTER TABLE game_rounds
  ADD CONSTRAINT game_rounds_genre_check CHECK (
    genre IN (
      'pop', 'rock', 'alternative', 'country', 'rnb', 'rap', 'latin',
      'streaming', 'spotify', 'global', 'dance',
      'other'
    )
  );

-- Give the chart types readable labels (older rows used the slug as the label).
UPDATE chart_type SET label = 'Billboard Hot 100'          WHERE slug = 'hot-100';
UPDATE chart_type SET label = 'Mainstream Rock Airplay'    WHERE slug = 'hot-mainstream-rock-tracks';
UPDATE chart_type SET label = 'Alternative Airplay'        WHERE slug = 'alternative-airplay';
UPDATE chart_type SET label = 'Hot Country Songs'          WHERE slug = 'country-songs';
UPDATE chart_type SET label = 'Hot R&B Songs'              WHERE slug = 'r-and-b-songs';
UPDATE chart_type SET label = 'Hot Rap Songs'              WHERE slug = 'rap-song';
UPDATE chart_type SET label = 'Latin Airplay'              WHERE slug = 'latin-airplay';

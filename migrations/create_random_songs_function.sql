-- Function to get random songs with filters
-- This uses TABLESAMPLE to efficiently sample from large datasets
CREATE OR REPLACE FUNCTION get_random_songs(
  p_chart text,
  p_difficulty text,
  p_start_year integer DEFAULT NULL,
  p_end_year integer DEFAULT NULL,
  p_limit integer DEFAULT 200
)
RETURNS TABLE(
  song text,
  artist text,
  this_week integer,
  last_week integer,
  peak_position integer,
  weeks_on_chart integer,
  date date,
  is_new boolean
) AS $$
DECLARE
  min_weeks_threshold integer;
BEGIN
  -- For first decade (1950s), relax the weeks_on_chart requirement for easy mode
  -- since we only have 2 years of data
  IF p_start_year IS NOT NULL AND p_start_year < 1960 THEN
    min_weeks_threshold := 10;
  ELSE
    min_weeks_threshold := 20;
  END IF;

  RETURN QUERY
  SELECT
    v.song,
    v.artist,
    v.this_week,
    v.last_week,
    v.peak_position,
    v.weeks_on_chart,
    v.date,
    v.is_new
  FROM v_chart_entries v
  WHERE v.chart = p_chart
    AND (p_start_year IS NULL OR EXTRACT(YEAR FROM v.date) >= p_start_year)
    AND (p_end_year IS NULL OR EXTRACT(YEAR FROM v.date) < p_end_year)
    AND (
      (p_difficulty = 'easy' AND v.this_week <= 10 AND v.weeks_on_chart > min_weeks_threshold)
      OR (p_difficulty = 'medium' AND v.this_week <= 20)
      OR (p_difficulty = 'hard' AND v.this_week > 20 AND v.weeks_on_chart < 4)
    )
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

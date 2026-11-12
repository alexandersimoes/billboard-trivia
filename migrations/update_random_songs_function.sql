-- Updated function to get random songs with more flexible filters
-- This provides better results when data is sparse
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
  result_count integer;
BEGIN
  -- Set minimum weeks threshold - using 10 weeks as baseline
  min_weeks_threshold := 10;

  -- First, try with the original strict criteria
  IF p_difficulty = 'easy' THEN
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
      AND v.this_week <= 10
      AND v.weeks_on_chart > min_weeks_threshold
    ORDER BY RANDOM()
    LIMIT p_limit;

    -- Check if we got enough results
    GET DIAGNOSTICS result_count = ROW_COUNT;

    -- If we got fewer than 50 songs, relax the criteria
    IF result_count < 50 THEN
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
        AND v.this_week <= 20  -- Expand to top 20
        AND v.weeks_on_chart > (min_weeks_threshold / 2)  -- Cut weeks requirement in half
      ORDER BY RANDOM()
      LIMIT p_limit - result_count;
    END IF;

  ELSIF p_difficulty = 'medium' THEN
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
      AND v.this_week <= 20
    ORDER BY RANDOM()
    LIMIT p_limit;

  ELSE  -- hard
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
      AND v.this_week > 20
      AND v.weeks_on_chart < 4
    ORDER BY RANDOM()
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to efficiently get distinct dates for a chart and year
-- This avoids having to fetch thousands of rows and dedupe on the client
CREATE OR REPLACE FUNCTION get_distinct_dates(p_chart text, p_year integer)
RETURNS TABLE(date date) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT v.date
  FROM v_chart_entries v
  WHERE v.chart = p_chart
    AND EXTRACT(YEAR FROM v.date) = p_year
  ORDER BY v.date DESC;
END;
$$ LANGUAGE plpgsql;

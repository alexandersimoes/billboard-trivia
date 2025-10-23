-- Function to efficiently get the min and max date for a chart
-- Returns the year range in a single query
CREATE OR REPLACE FUNCTION get_chart_date_range(p_chart text)
RETURNS TABLE(min_date date, max_date date) AS $$
BEGIN
  RETURN QUERY
  SELECT
    MIN(v.date) as min_date,
    MAX(v.date) as max_date
  FROM v_chart_entries v
  WHERE v.chart = p_chart;
END;
$$ LANGUAGE plpgsql;

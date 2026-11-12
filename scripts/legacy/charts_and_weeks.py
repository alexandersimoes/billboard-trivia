#!/usr/bin/env python3
"""
pip install billboard.py

Examples:
  # List weeks for Hot 100 (latest back to the beginning)
  python billboard_weeks.py --chart hot-100

  # Limit to the last 20 weeks
  python billboard_weeks.py --chart hot-100 --limit 20

  # Only between dates (inclusive)
  python billboard_weeks.py --chart hot-100 --start 2010-01-01 --end 2011-12-31

  # Year-end charts: list available years (best-effort)
  python billboard_weeks.py --chart alternative-songs --year-end

  Use this to get the valid dates for a chart: https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/valid_dates.json
"""

import argparse
import sys
import time
from datetime import date, datetime
import billboard  # pip install billboard.py

# A small starter list. You can pass any valid slug via --chart.
KNOWN_CHARTS = [
    "hot-100",
    "billboard-200",
    "artist-100",
    "digital-song-sales",
    "radio-songs",
    "streaming-songs",
    "pop-songs",
    "r-b-hip-hop-songs",
    "country-songs",
    "dance-electronic-songs",
    "latin-songs",
    "rock-songs",
    "hot-alternative-songs",
]


def parse_date(s: str) -> date:
  return datetime.strptime(s, "%Y-%m-%d").date()


def within_bounds(dstr: str, start: date | None, end: date | None) -> bool:
  if not dstr:
    return False
  d = parse_date(dstr)
  if start and d < start:
    return False
  if end and d > end:
    return False
  return True


def iter_weeks(chart_name: str, start: date | None = None, end: date | None = None,
               polite_sleep: float = 0.2, limit: int | None = None):
  """
  Yield YYYY-MM-DD strings for all available weeks of a given chart by
  walking backward via .previousDate starting from latest.
  """
  count = 0
  # Get the latest chart first
  chart = billboard.ChartData(chart_name)  # date=None => latest
  # Walk backwards
  while chart and chart.date:
    dstr = chart.date
    if (start or end):
      if within_bounds(dstr, start, end):
        yield dstr
    else:
      yield dstr

    count += 1
    if limit and count >= limit:
      break

    if not chart.previousDate:
      break

    time.sleep(polite_sleep)  # be gentle
    chart = billboard.ChartData(chart_name, date=chart.previousDate)


def list_year_end_years(chart_name: str, min_year: int = 1958, max_year: int | None = None):
  """
  Year-end charts are requested with year='YYYY'.
  Billboard doesn’t expose a direct list, so we probe a reasonable range.
  """
  years_found = []
  if max_year is None:
    max_year = date.today().year

  for y in range(max_year, min_year - 1, -1):
    try:
      ch = billboard.ChartData(chart_name, year=str(y))
      # If this year-end chart has entries, consider it present.
      if ch and len(ch) > 0:
        years_found.append(y)
    except Exception:
      # Not available for this year, skip quietly
      pass
    time.sleep(0.1)
  return sorted(years_found)


def main():
  ap = argparse.ArgumentParser(description="Print available Billboard weeks (or year-end years) for a chart.")
  ap.add_argument("--chart", help="Chart slug (e.g., 'hot-100'). If omitted, you’ll be prompted.")
  ap.add_argument("--start", help="Start date (YYYY-MM-DD) inclusive.")
  ap.add_argument("--end", help="End date (YYYY-MM-DD) inclusive.")
  ap.add_argument("--limit", type=int, help="Max number of weeks to print (from latest backward).")
  ap.add_argument("--sleep", type=float, default=0.2, help="Delay between requests (seconds).")
  ap.add_argument("--year-end", action="store_true", help="List available year-end YEARS instead of weekly dates.")
  args = ap.parse_args()

  if not args.chart:
    print("Some common chart IDs:\n")
    for c in KNOWN_CHARTS:
      print(" -", c)
    chart = input("\nEnter a chart slug: ").strip()
  else:
    chart = args.chart.strip()

  start = parse_date(args.start) if args.start else None
  end = parse_date(args.end) if args.end else None

  try:
    if args.year_end:
      print(f"\nProbing available YEAR-END years for '{chart}' (this may take a moment)...\n")
      years = list_year_end_years(chart)
      if years:
        for y in years:
          print(y)
        print(f"\nTotal years found: {len(years)}")
      else:
        print("No year-end years found (check chart slug or try a different chart).")
    else:
      print(f"\nListing weekly chart dates for '{chart}'" +
            (f" between {args.start} and {args.end}" if (args.start or args.end) else "") +
            (f" (limit={args.limit})" if args.limit else "") + ":\n")
      count = 0
      for d in iter_weeks(chart, start=start, end=end, polite_sleep=args.sleep, limit=args.limit):
        print(d)
        count += 1
      print(f"\nTotal weeks printed: {count}")
      if count == 0:
        print("No weeks matched the bounds (or chart not found). Try removing --start/--end.")
  except Exception as e:
    print(f"Error while fetching weeks for '{chart}': {e}", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
  main()

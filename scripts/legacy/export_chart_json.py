#!/usr/bin/env python3
# pip install billboard.py
# Usage:
#   python export_chart_json.py --chart hot-100 --date 1958-08-04
#   python export_chart_json.py --chart rock-songs --date 2025-10-11 --out rock-2025-10-11.json

import argparse
import json
import sys
import os
from datetime import datetime
from urllib.request import Request, urlopen
import billboard  # billboard.py

VALID_DATES_URL = "https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/valid_dates.json"
ALLOWED_CHARTS = {
    "hot-100",
    "alternative-airplay",
    "country-songs",
    "hot-mainstream-rock-tracks",
    "latin-airplay",
    "r-and-b-songs",
    "rap-song",
}


def parse_args():
  parser = argparse.ArgumentParser(description="Export a Billboard chart week to JSON in standardized format.")
  parser.add_argument("--chart", "-c", required=True,
                      help="Chart slug (allowed: hot-100, alternative-airplay, country-songs, "
                           "hot-mainstream-rock-tracks, latin-airplay, r-and-b-songs, rap-song)")
  group = parser.add_mutually_exclusive_group(required=True)
  group.add_argument("--date", "-d", help="Week date YYYY-MM-DD")
  group.add_argument("--since", help="Fetch all weeks from this date through latest (YYYY-MM-DD).")
  parser.add_argument("--out", "-o", help="Output JSON file (optional, defaults to <chart>-<date>.json)")
  parser.add_argument("--timeout", type=float, default=25.0, help="HTTP timeout seconds (default: 25)")
  return parser.parse_args()


def validate_date(s: str) -> str:
  try:
    datetime.strptime(s, "%Y-%m-%d")
    return s
  except ValueError:
    print(f"Invalid date '{s}' (expected YYYY-MM-DD)", file=sys.stderr)
    sys.exit(2)


def load_valid_dates(timeout: float) -> list[str]:
  req = Request(VALID_DATES_URL, headers={"User-Agent": "billboard-trivia/1.0"})
  try:
    with urlopen(req, timeout=timeout) as resp:
      payload = resp.read().decode("utf-8")
  except Exception as exc:
    print(f"Failed to fetch valid dates list: {exc}", file=sys.stderr)
    sys.exit(1)
  try:
    data = json.loads(payload)
  except json.JSONDecodeError as exc:
    print(f"Failed to parse valid dates JSON: {exc}", file=sys.stderr)
    sys.exit(1)
  if not isinstance(data, list) or not all(isinstance(d, str) for d in data):
    print("Valid dates payload is not a list of strings.", file=sys.stderr)
    sys.exit(1)
  return sorted(set(data))


def export_chart(chart_slug: str, week: str, out_path: str | None, timeout: float = 25.0):
  print(f"Fetching chart '{chart_slug}' for week {week} ...")
  chart = billboard.ChartData(chart_slug, date=week, timeout=timeout)

  if not chart:
    print(f"No chart returned for {chart_slug} on {week}", file=sys.stderr)
    sys.exit(1)

  # Construct entries
  data = []
  for e in chart:
    last_week = None if (e.lastPos is None or e.lastPos == 0) else e.lastPos
    entry = {
        "song": e.title,
        "artist": e.artist,
        "this_week": e.rank,
        "last_week": last_week,
        "peak_position": e.peakPos,
        "weeks_on_chart": e.weeks,
        "new": bool(getattr(e, "isNew", False))
    }
    data.append(entry)

  payload = {"date": chart.date, "data": data}

  # If no output path provided, build one
  if not out_path:
    safe_chart = chart_slug.replace("/", "-")
    out_path = f"public/charts/{safe_chart}/{safe_chart}-{chart.date}.json"
    # Avoid accidental overwrite
    if os.path.exists(out_path):
      n = 1
      while os.path.exists(f"public/charts/{safe_chart}/{safe_chart}-{chart.date}-{n}.json"):
        n += 1
      out_path = f"public/charts/{safe_chart}/{safe_chart}-{chart.date}-{n}.json"

  # Ensure output directory exists
  out_dir = os.path.dirname(out_path)
  if out_dir:
    os.makedirs(out_dir, exist_ok=True)

  # Write JSON
  with open(out_path, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

  if chart.date != week:
    print(f"Note: requested {week}, got nearest available {chart.date}.", file=sys.stderr)
  print(f"Wrote {len(data)} entries to {out_path}")


def main():
  args = parse_args()
  chart = args.chart.strip()
  if chart not in ALLOWED_CHARTS:
    print(f"Chart '{chart}' is not allowed. Allowed charts: {', '.join(sorted(ALLOWED_CHARTS))}.", file=sys.stderr)
    sys.exit(2)
  if args.since:
    since = validate_date(args.since)
    dates = load_valid_dates(args.timeout)
    if since not in dates:
      print(f"'since' date {since} is not in the valid dates list.", file=sys.stderr)
      sys.exit(2)
    to_fetch = [d for d in dates if d >= since]
    if not to_fetch:
      print(f"No weeks found on or after {since}.", file=sys.stderr)
      sys.exit(1)
    for week in to_fetch:
      export_chart(chart, week, args.out, args.timeout)
  else:
    week = validate_date(args.date)
    export_chart(chart, week, args.out, args.timeout)


if __name__ == "__main__":
  main()

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
import billboard  # billboard.py


def parse_args():
  parser = argparse.ArgumentParser(description="Export a Billboard chart week to JSON in standardized format.")
  parser.add_argument("--chart", "-c", required=True, help="Chart slug (e.g. hot-100, rock-songs, billboard-200)")
  parser.add_argument("--date", "-d", required=True, help="Week date YYYY-MM-DD")
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
    out_path = f"{safe_chart}-{chart.date}.json"
    # Avoid accidental overwrite
    if os.path.exists(out_path):
      n = 1
      while os.path.exists(f"{safe_chart}-{chart.date}-{n}.json"):
        n += 1
      out_path = f"{safe_chart}-{chart.date}-{n}.json"

  # Write JSON
  with open(out_path, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

  if chart.date != week:
    print(f"Note: requested {week}, got nearest available {chart.date}.", file=sys.stderr)
  print(f"Wrote {len(data)} entries to {out_path}")


def main():
  args = parse_args()
  week = validate_date(args.date)
  export_chart(args.chart, week, args.out, args.timeout)


if __name__ == "__main__":
  main()

#!/usr/bin/env python3
# pip install billboard.py
# Examples:
#   python chart_week_dump.py --chart rock-songs --date 2025-10-11
#   python chart_week_dump.py -c hot-100 -d 2025-10-11 --json out.json --csv out.csv

import argparse
import csv
import json
import sys
from datetime import datetime
import billboard  # pip install billboard.py

FIELDS = [
    "rank", "title", "artist",
    "lastPos", "peakPos", "weeks",
    "isNew",   # <— added
    "image"
]


def parse_args():
  p = argparse.ArgumentParser(description="Print all entries for a Billboard chart on a given week.")
  p.add_argument("-c", "--chart", required=True, help="Chart slug (e.g., hot-100, rock-songs, billboard-200).")
  p.add_argument("-d", "--date", required=True, help="Week date in YYYY-MM-DD (e.g., 2025-10-11).")
  p.add_argument("--json", help="Write output to a JSON file.")
  p.add_argument("--csv", help="Write output to a CSV file.")
  p.add_argument("--timeout", type=float, default=25.0, help="HTTP timeout seconds (default: 25).")
  return p.parse_args()


def validate_date(dstr: str) -> str:
  try:
    datetime.strptime(dstr, "%Y-%m-%d")
    return dstr
  except ValueError:
    print(f"Error: '{dstr}' is not a valid YYYY-MM-DD date.", file=sys.stderr)
    sys.exit(2)


def chart_to_rows(chart: billboard.ChartData):
  rows = []
  for e in chart:
    rows.append({
        "rank": e.rank,
        "title": e.title,
        "artist": e.artist,
        "lastPos": e.lastPos,
        "peakPos": e.peakPos,
        "weeks": e.weeks,
        "isNew": bool(getattr(e, "isNew", False)),  # <— added
        "image": getattr(e, "image", None),
    })
  return rows


def print_table(rows, chart_name: str, date_str: str):
  if not rows:
    print(f"No entries for {chart_name} on {date_str}")
    return

  header = f"{chart_name} — {date_str} — {len(rows)} entries"
  print(header)
  print("-" * len(header))

  colw = {
      "rank": 4, "title": 40, "artist": 28,
      "lastPos": 7, "peakPos": 7, "weeks": 5, "isNew": 3
  }
  print(f"{'Rk':<{colw['rank']}}  {'Title':<{colw['title']}}  {'Artist':<{colw['artist']}}  "
        f"{'Last':<{colw['lastPos']}}  {'Peak':<{colw['peakPos']}}  {'Wks':<{colw['weeks']}}  "
        f"{'New':<{colw['isNew']}}")
  print("-" * (sum(colw.values()) + 14))

  for r in rows:
    title = (r['title'][:colw['title']-1] + "…") if len(str(r['title'])) > colw['title'] else r['title']
    artist = (r['artist'][:colw['artist']-1] + "…") if len(str(r['artist'])) > colw['artist'] else r['artist']
    new_flag = "Y" if r.get("isNew") else ""
    print(f"{r['rank']:<{colw['rank']}}  {title:<{colw['title']}}  {artist:<{colw['artist']}}  "
          f"{(r['lastPos'] if r['lastPos'] is not None else ''):<{colw['lastPos']}}  "
          f"{(r['peakPos'] if r['peakPos'] is not None else ''):<{colw['peakPos']}}  "
          f"{(r['weeks'] if r['weeks'] is not None else ''):<{colw['weeks']}}  "
          f"{new_flag:<{colw['isNew']}}")
  print("\n(‘New’ reflects ChartEntry.isNew; artwork URL is in the 'image' field.)")


def main():
  args = parse_args()
  date_str = validate_date(args.date)

  try:
    chart = billboard.ChartData(args.chart, date=date_str, timeout=args.timeout)
  except Exception as e:
    print(f"Failed to fetch chart '{args.chart}' for {date_str}: {e}", file=sys.stderr)
    sys.exit(1)

  if not chart or chart.date != date_str:
    if chart:
      print(f"Note: requested {date_str}, got {chart.date} (nearest available).\n", file=sys.stderr)
    else:
      print(f"No chart returned for {args.chart} on {date_str}.", file=sys.stderr)
      sys.exit(1)

  rows = chart_to_rows(chart)
  print_table(rows, args.chart, chart.date)

  if args.json:
    with open(args.json, "w", encoding="utf-8") as f:
      json.dump({
          "chart": args.chart,
          "date": chart.date,
          "previousDate": chart.previousDate,
          "nextDate": chart.nextDate,
          "entries": rows
      }, f, ensure_ascii=False, indent=2)
    print(f"Saved JSON to {args.json}")

  if args.csv:
    with open(args.csv, "w", newline="", encoding="utf-8") as f:
      w = csv.DictWriter(f, fieldnames=FIELDS)
      w.writeheader()
      for r in rows:
        w.writerow({k: r.get(k, "") for k in FIELDS})
    print(f"Saved CSV to {args.csv}")


if __name__ == "__main__":
  main()

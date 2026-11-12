#!/usr/bin/env python3
import json
import argparse
from pathlib import Path
import pandas as pd


def load_rows(folder: Path, pattern: str):
  rows, bad, empty = [], [], []
  for fp in folder.glob(pattern):
    try:
      payload = json.loads(fp.read_text(encoding="utf-8"))
      week = payload.get("date")
      entries = payload.get("data", [])
      if not isinstance(entries, list) or not entries:
        empty.append(fp.name)
        continue
      for e in entries:
        rows.append({
            "week": week,
            "song": (e.get("song") or "").strip(),
            "artist": (e.get("artist") or "").strip(),
            "streams": e.get("streams", 0),
        })
    except Exception:
      bad.append(fp.name)
  return rows, bad, empty


def main():
  ap = argparse.ArgumentParser(
      description="Summarize Spotify weekly JSON files (top songs by streams)."
  )
  ap.add_argument("folder", nargs="?", default=".", help="Folder with .json files")
  ap.add_argument("--pattern", default="*.json", help="Glob pattern (default: *.json)")
  ap.add_argument("--by-week", action="store_true",
                  help="Group by week, artist, song (song-weeks).")
  ap.add_argument("--top", type=int, default=10, help="How many rows to show (default: 10)")
  args = ap.parse_args()

  rows, bad, empty = load_rows(Path(args.folder), args.pattern)
  if not rows:
    print("No rows parsed.")
    if empty:
      print("  Skipped (no data entries):", ", ".join(empty))
    if bad:
      print("  Failed to parse:", ", ".join(bad))
    return

  df = pd.DataFrame(rows)
  df["streams"] = pd.to_numeric(df["streams"], errors="coerce").fillna(0)

  if args.by_week:
    # song-weeks: sum streams per (week, artist, song), then sort by streams desc
    out = (df.groupby(["week", "artist", "song"], as_index=False)["streams"]
             .sum()
             .sort_values(["streams", "week", "artist", "song"], ascending=[False, True, True, True])
             .reset_index(drop=True))
  else:
    # all-time across weeks: sum streams per (artist, song)
    out = (df.groupby(["artist", "song"], as_index=False)["streams"]
             .sum()
             .sort_values(["streams", "artist", "song"], ascending=[False, True, True])
             .reset_index(drop=True))

  print(out.head(args.top).to_string(index=False))

  if empty or bad:
    print("\nNote:")
    if empty:
      print("  Skipped (no data entries):", ", ".join(empty))
    if bad:
      print("  Failed to parse:", ", ".join(bad))


if __name__ == "__main__":
  main()

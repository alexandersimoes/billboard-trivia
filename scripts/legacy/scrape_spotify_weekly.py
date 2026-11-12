
from pathlib import Path
import json
import re
from bs4 import BeautifulSoup
from datetime import datetime
import sys


def month_to_num(name: str) -> int:
  try:
    return datetime.strptime(name[:3], "%b").month
  except Exception:
    return datetime.strptime(name, "%B").month


def iso_date_from_header(text: str):
  m = re.search(r'([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),\s*(\d{4})', text)
  if m:
    month_name = m.group(1)
    end_day = int(m.group(3))
    year = int(m.group(4))
    month = month_to_num(month_name)
    return f"{year:04d}-{month:02d}-{end_day:02d}"
  m2 = re.search(r'Week of\s+([A-Za-z]+)\s+(\d{1,2})', text, re.IGNORECASE)
  if m2:
    month_name = m2.group(1)
    day = int(m2.group(2))
    y = re.search(r'(\d{4})', text)
    if y:
      year = int(y.group(1))
      month = month_to_num(month_name)
      return f"{year:04d}-{month:02d}-{day:02d}"
  m3 = re.search(r'\b(20\d{2}|19\d{2})-\d{2}-\d{2}\b', text)
  if m3:
    return m3.group(0)
  return None


def text_clean(s: str) -> str:
  return " ".join((s or "").split())


def safe_int(s):
  if s is None:
    return None
  s = text_clean(str(s))
  if s in {"—", "–", "-", ""}:
    return None
  s = re.sub(r"[^\d\-]", "", s)
  if s == "":
    return None
  try:
    return int(s)
  except Exception:
    return None


def extract_song_title(cell):
  title = None
  for el in cell.find_all(["span", "div"], recursive=True):
    classes = " ".join(el.get("class", []))
    if "StyledTruncatedTitle" in classes or "StyledTitle" in classes:
      title = el.get_text(strip=True)
      if title:
        break
  if not title:
    a = cell.find("a", href=re.compile(r"/track/"))
    if a:
      title = a.get_text(" ", strip=True)
  return text_clean(title or "") or None


def extract_artists(cell):
  artists = []
  container = None
  for div in cell.find_all("div", recursive=True):
    classes = " ".join(div.get("class", []))
    if "StyledArtistsTruncatedDiv" in classes:
      container = div
      break
  if not container:
    container = cell
  for a in container.find_all("a", href=re.compile(r"/artist/")):
    name = a.get_text(strip=True)
    if name:
      artists.append(name)
  seen, out = set(), []
  for n in artists:
    if n not in seen:
      seen.add(n)
      out.append(n)
  return ", ".join(out) if out else None


def is_new_entry(position_cell):
  if position_cell.find(attrs={"aria-label": re.compile(r"new entry", re.I)}):
    return True
  txt = position_cell.get_text(" ", strip=True)
  return "new" in txt.lower()


def detect_col_offsets(tds):
  """
  Handles two layouts:
  A) [pos, info, peak, prev, streak, streams, ...]
  B) [blank, pos, info, peak, prev, streak, streams, ...]
  Return indices for (pos, info, peak, prev, streak, streams)
  """
  def has_pos(td):
    return td.find(attrs={"aria-label": "Current position"}) is not None or re.search(r"\b\d+\b", td.get_text(" ", strip=True))
  # Try layout A
  if len(tds) >= 6 and has_pos(tds[0]):
    return 0, 1, 2, 3, 4, 5
  # Try layout B (leading blank)
  if len(tds) >= 7 and not has_pos(tds[0]) and has_pos(tds[1]):
    return 1, 2, 3, 4, 5, 6
  # Fallback best-effort guess
  return max(0, len(tds)-6), max(1, len(tds)-5), max(2, len(tds)-4), max(3, len(tds)-3), max(4, len(tds)-2), max(5, len(tds)-1)


def parse_table_rows(table_root):
  rows = []
  for tr in table_root.find_all("tr"):
    tds = tr.find_all("td")
    if len(tds) < 5:
      continue
    pos_i, info_i, peak_i, prev_i, streak_i, streams_i = detect_col_offsets(tds)

    pos_cell = tds[pos_i]
    info_cell = tds[info_i]
    peak_cell = tds[peak_i]
    prev_cell = tds[prev_i]
    streak_cell = tds[streak_i]
    streams_cell = tds[streams_i] if streams_i < len(tds) else None

    pos_span = pos_cell.find(attrs={"aria-label": "Current position"})
    if pos_span and pos_span.get_text(strip=True).isdigit():
      this_week = int(pos_span.get_text(strip=True))
    else:
      m = re.search(r"\d+", pos_cell.get_text(" ", strip=True))
      this_week = int(m.group(0)) if m else None

    song = extract_song_title(info_cell)
    artist = extract_artists(info_cell)

    peak = safe_int(peak_cell.get_text())
    last_week = safe_int(prev_cell.get_text())
    weeks_on_chart = safe_int(streak_cell.get_text())

    streams = None
    if streams_cell:
      streams = safe_int(streams_cell.get_text(" ", strip=True))
      if streams is None:
        for span in streams_cell.find_all(["span", "div"]):
          streams = safe_int(span.get_text(" ", strip=True))
          if streams is not None:
            break

    newflag = is_new_entry(pos_cell)

    rows.append({
        "song": song,
        "artist": artist,
        "this_week": this_week,
        "last_week": last_week,
        "peak_position": peak,
        "weeks_on_chart": weeks_on_chart,
        "streams": streams,
        "new": bool(newflag),
    })
  rows = [r for r in rows if r["song"] and r["artist"] and r["this_week"] is not None]
  return rows


def scrape_offline_html(input_html: str):
  p = Path(input_html)
  html = p.read_text(encoding="utf-8", errors="ignore")
  soup = BeautifulSoup(html, "html.parser")

  # Prefer YYYY-MM-DD from the filename; fallback to header-derived date
  m = re.search(r"(\d{4}-\d{2}-\d{2})", p.name)
  filename_date = m.group(1) if m else None
  header_date = iso_date_from_header(soup.get_text(" ", strip=True))
  date_iso = filename_date or header_date

  table_root = soup.find(attrs={"data-testid": "charts-table"})
  if not table_root:
    candidates = soup.select('div[data-testid="charts-table"]')
    table_root = candidates[0] if candidates else None

  rows = parse_table_rows(table_root) if table_root else []
  return {"date": date_iso, "data": rows}


def main():
  if len(sys.argv) != 2:
    print("Usage: python spotify_charts_offline_scraper.py <input.html>")
    sys.exit(1)
  input_html = sys.argv[1]
  output_json = Path(input_html).with_suffix(".json")
  result = scrape_offline_html(input_html)
  Path(output_json).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
  print(f"Wrote {len(result['data'])} rows to {output_json}. Date: {result['date']}")


if __name__ == "__main__":
  main()

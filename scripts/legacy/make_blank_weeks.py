from datetime import date, timedelta
from pathlib import Path

start = date(2016, 12, 29)
end = date(2025, 10, 23)  # change this to your desired final date
delta = timedelta(days=7)

while start <= end:
  filename = f"spotify-global-{start.isoformat()}.html"
  Path(filename).write_text("", encoding="utf-8")  # create an empty file
  print(f"Created {filename}")
  start += delta

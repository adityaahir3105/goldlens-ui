#!/usr/bin/env python3
"""Build src/data/history/gold-history.json for the History page.

Sources (both public, no API key):
  - Gold, USD per troy ounce: https://github.com/datasets/gold-prices (monthly.csv).
    1833-1959 are annual figures compiled by Timothy Green (repeated for every month in the
    file, so only one point per year is kept); 1960 onward is the World Bank Pink Sheet
    monthly average.
  - US CPI-U: https://github.com/datasets/cpi-us (cpiai.csv, BLS, 1913 onward). Used to
    express prices in the dollars of the latest CPI month.

Usage:
  python scripts/history/build_gold_history.py
"""

from __future__ import annotations

import csv
import io
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

GOLD_URL = "https://raw.githubusercontent.com/datasets/gold-prices/main/data/monthly.csv"
CPI_URL = "https://raw.githubusercontent.com/datasets/cpi-us/main/data/cpiai.csv"
OUT = Path(__file__).resolve().parents[2] / "src" / "data" / "history" / "gold-history.json"

MONTHLY_FROM = 1960


def fetch_csv(url: str) -> list[dict[str, str]]:
    with urllib.request.urlopen(url, timeout=60) as resp:
        text = resp.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(text)))


def main() -> None:
    gold_rows = fetch_csv(GOLD_URL)
    cpi_rows = fetch_csv(CPI_URL)

    cpi = {row["Date"][:7]: float(row["Index"]) for row in cpi_rows if row.get("Index")}
    cpi_latest_month = max(cpi)
    cpi_latest = cpi[cpi_latest_month]

    points = []
    for row in gold_rows:
        month = row["Date"][:7]
        year = int(month[:4])
        # Before 1960 the file repeats one annual value for every month: keep January only.
        if year < MONTHLY_FROM and not month.endswith("-01"):
            continue
        value = float(row["Price"])
        # A month newer than the latest CPI uses the latest CPI (ratio of 1).
        index = cpi.get(month, cpi_latest if month > cpi_latest_month else None)
        real = round(value * cpi_latest / index, 2) if index else None
        points.append({"d": month, "v": round(value, 2), "r": real})

    points.sort(key=lambda p: p["d"])
    data = {
        "meta": {
            "unit": "USD per troy ounce",
            "monthlyFrom": MONTHLY_FROM,
            "realDollarsOf": cpi_latest_month,
            "sources": [
                {
                    "label": "World Bank Pink Sheet (1960 onward, monthly average)",
                    "url": "https://www.worldbank.org/en/research/commodity-markets",
                },
                {
                    "label": "Timothy Green historical gold prices (1833-1959, annual)",
                    "url": "https://github.com/datasets/gold-prices",
                },
                {
                    "label": "US CPI-U, Bureau of Labor Statistics (for today's dollars)",
                    "url": "https://github.com/datasets/cpi-us",
                },
            ],
            "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        },
        "points": points,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, separators=(",", ":")) + "\n")
    print(f"Wrote {len(points)} points ({points[0]['d']} to {points[-1]['d']}) to {OUT}")


if __name__ == "__main__":
    main()

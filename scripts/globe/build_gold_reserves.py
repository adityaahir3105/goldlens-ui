#!/usr/bin/env python3
"""Build src/data/globe/gold-reserves.json for the central-bank gold globe.

Source: World Gold Council, "Gold reserves by country" (IMF IFS data), downloaded as xlsx from
https://www.gold.org/goldhub/data/gold-reserves-by-country (free account needed). Each export is
one snapshot with a 'Data' sheet: Country, Region, Economic grouping, FX Reserves, Total Reserves,
Gold Reserves Tonnes, Gold Reserves Millions, Holdings (gold's % of total reserves). 'AWAITED'
means the country has not reported for that period yet.

The exports carry no date, so pass each one with the month it refers to. Do not commit the xlsx
files: the WGC terms do not allow redistributing them.

Usage (needs openpyxl):
  python scripts/globe/build_gold_reserves.py 2024-12=path/a.xlsx 2025-12=path/b.xlsx ...
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl

OUT = Path(__file__).resolve().parents[2] / "src" / "data" / "globe" / "gold-reserves.json"

# WGC country name -> (world-atlas 110m id, display name). Countries too small for the 110m map
# get a placeholder id and a lonLat for their spike.
RENAME = {
    "United States of America": "United States",
    "Russian Federation": "Russia",
    "Taiwan, China": "Taiwan",
    "Czech Republic": "Czechia",
    "Hong Kong SAR": "Hong Kong",
    "Lao PDR": "Laos",
    "Syrian Arab Republic": "Syria",
    "Congo": "Republic of the Congo",
}
ATLAS_NAME = {
    "United States of America": "United States of America",
    "Russian Federation": "Russia",
    "Taiwan, China": "Taiwan",
    "Czech Republic": "Czechia",
    "Lao PDR": "Laos",
    "Syrian Arab Republic": "Syria",
    "Dominican Republic": "Dominican Rep.",
    "Bosnia and Herzegovina": "Bosnia and Herz.",
    "North Macedonia": "Macedonia",
}
SMALL = {
    "Singapore": ("SGP", [103.82, 1.35]),
    "Bahrain": ("BHR", [50.56, 26.07]),
    "Mauritius": ("MUS", [57.55, -20.25]),
    "Aruba": ("ABW", [-69.97, 12.52]),
    "Hong Kong SAR": ("HKG", [114.17, 22.32]),
    "Malta": ("MLT", [14.45, 35.9]),
    "Comoros": ("COM", [43.33, -11.7]),
}
ATLAS = Path(__file__).resolve().parents[2] / "node_modules" / "world-atlas" / "countries-110m.json"


def read_snapshot(path: str) -> dict[str, tuple[float | None, float | None]]:
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True)["Data"]
    rows = list(ws.iter_rows(values_only=True))
    header = [str(c).strip() if c else "" for c in rows[0]]
    i_name, i_tonnes, i_share = header.index("Country"), header.index("Gold Reserves Tonnes"), header.index("Holdings")
    out = {}
    for r in rows[1:]:
        if not r[i_name]:
            continue
        tonnes, share = r[i_tonnes], r[i_share]
        out[r[i_name].strip()] = (
            float(tonnes) if isinstance(tonnes, (int, float)) else None,
            float(share) if isinstance(share, (int, float)) else None,
        )
    return out


def main() -> None:
    args = sys.argv[1:]
    if not args or any(not re.fullmatch(r"\d{4}-\d{2}=.+", a) for a in args):
        sys.exit(__doc__)
    snaps = sorted((a.split("=", 1) for a in args), key=lambda x: x[0])
    months = [m for m, _ in snaps]
    if len(set(months)) != len(months):
        sys.exit("Each month can only be given once.")
    data = {m: read_snapshot(p) for m, p in snaps}

    atlas = json.loads(ATLAS.read_text())
    atlas_ids = {g["properties"]["name"]: g["id"] for g in atlas["objects"]["countries"]["geometries"] if "id" in g}

    names = sorted(set().union(*data.values()))
    countries = []
    for name in names:
        tonnes = [data[m].get(name, (None, None))[0] for m in months]
        if all(t is None for t in tonnes):
            continue  # never reported in these snapshots
        entry: dict = {"name": RENAME.get(name, name)}
        if name in SMALL:
            entry["id"], entry["lonLat"] = SMALL[name]
        else:
            atlas_id = atlas_ids.get(ATLAS_NAME.get(name, name))
            if not atlas_id:
                sys.exit(f"No world-atlas match for {name!r}; add it to ATLAS_NAME or SMALL.")
            entry["id"] = atlas_id
        entry["tonnes"] = [None if t is None else round(t, 2) for t in tonnes]
        latest = next((data[m][name][1] for m in reversed(months) if data[m].get(name, (None,))[0] is not None), None)
        if latest is not None:
            entry["sharePct"] = round(latest, 1)
        countries.append(entry)

    ids = [c["id"] for c in countries]
    if len(set(ids)) != len(ids):
        sys.exit("Duplicate map ids.")
    # One country per line keeps refresh diffs readable.
    lines = ",\n".join("  " + json.dumps(c, ensure_ascii=False) for c in countries)
    OUT.write_text(f'{{\n "months": {json.dumps(months)},\n "countries": [\n{lines}\n ]\n}}\n')
    print(f"Wrote {len(countries)} countries x {len(months)} months to {OUT.relative_to(Path.cwd()) if OUT.is_relative_to(Path.cwd()) else OUT}")


if __name__ == "__main__":
    main()

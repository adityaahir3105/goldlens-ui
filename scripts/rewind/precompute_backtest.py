#!/usr/bin/env python3
"""Precompute a rolling-origin backtest for the Rewind Lab page.

For every past trading day ("cutoff") the model sees only the prices up to and
including that day, forecasts the next N days, and we store the 10th / 50th /
90th percentile paths. The UI then compares those forecasts with what actually
happened and with a naive "no change" baseline.

Only cutoffs whose full forecast window is already known are written, so the
page never shows a live forward-looking forecast.

Examples:
  # Real data from the GoldLens backend + TimesFM 2.5 (Apache-2.0 weights)
  python scripts/rewind/precompute_backtest.py --source api \
      --api-base "$NEXT_PUBLIC_API_BASE" --model timesfm-2.5

  # Years of daily history from gold-api.com (key in GOLD_API_COM_KEY; free tier: 10 req/hour)
  python scripts/rewind/precompute_backtest.py --source gold-api-com --years 5 \
      --save-csv gold-history.csv

  # Your own longer history (CSV with a header row: date,value)
  python scripts/rewind/precompute_backtest.py --source csv --csv gold.csv

  # Offline sample used by the prototype (no ML dependencies needed)
  python scripts/rewind/precompute_backtest.py --source synthetic --model toy-momentum
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import math
import os
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Callable

import numpy as np

DEFAULT_OUT = os.path.join(
    os.path.dirname(__file__), "..", "..", "src", "data", "rewind", "gold-backtest.json"
)

# z-scores for the 10th and 90th percentiles of a standard normal.
Z_10, Z_90 = -1.2815515655446004, 1.2815515655446004


@dataclass
class Series:
    dates: list[str]
    values: np.ndarray
    source: str


@dataclass
class ModelInfo:
    id: str
    label: str
    license: str


# (contexts, horizon) -> (p10, p50, p90), each shaped (len(contexts), horizon)
Forecaster = Callable[[list[np.ndarray], int], tuple[np.ndarray, np.ndarray, np.ndarray]]


# --------------------------------------------------------------------------- data


def clean(dates: list[str], values: list[float], source: str) -> Series:
    by_date: dict[str, float] = {}
    for d, v in zip(dates, values):
        if v is None or not math.isfinite(v) or v <= 0:
            continue
        by_date[d[:10]] = float(v)
    ordered = sorted(by_date.items())
    return Series([d for d, _ in ordered], np.array([v for _, v in ordered]), source)


def load_from_api(api_base: str, days: int) -> Series:
    url = f"{api_base.rstrip('/')}/api/gold/price/history?days={days}"
    with urllib.request.urlopen(url, timeout=60) as resp:
        payload = json.load(resp)
    points = payload.get("points") or []
    return clean(
        [p["date"] for p in points],
        [p.get("value") for p in points],
        f"GoldLens backend, last {days} days",
    )


GOLD_API_COM_URL = "https://api.gold-api.com/history"
DATE_FIELDS = ("day", "date", "period", "timestamp", "time")
PRICE_FIELDS = ("avg_price", "price", "close", "max_price", "min_price")


def _parse_day(value) -> str | None:
    """gold-api.com's docs don't pin the format: accept ISO strings or Unix seconds/millis."""
    if value is None:
        return None
    if isinstance(value, (int, float)) or (isinstance(value, str) and value.isdigit()):
        ts = float(value)
        if ts > 1e11:  # milliseconds
            ts /= 1000
        return dt.datetime.fromtimestamp(ts, dt.timezone.utc).date().isoformat()
    text = str(value)
    return text[:10] if len(text) >= 10 else None


def parse_gold_api_com(payload) -> tuple[list[str], list[float]]:
    rows = payload
    if isinstance(payload, dict):  # tolerate a wrapper object
        rows = next((v for v in payload.values() if isinstance(v, list)), [])
    dates, values = [], []
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        day = next((_parse_day(row[k]) for k in DATE_FIELDS if k in row), None)
        price = next((row[k] for k in PRICE_FIELDS if row.get(k) is not None), None)
        if day is None or price is None:
            continue
        try:
            values.append(float(price))
        except (TypeError, ValueError):
            continue
        dates.append(day)
    return dates, values


def load_from_gold_api_com(years: int, api_key: str) -> Series:
    """Daily average XAU prices, fetched one year per request, newest year first.

    Stops at the first year that returns no data, so it reports how far back the
    plan actually goes instead of assuming.
    """
    end = dt.datetime.now(dt.timezone.utc)
    all_dates: list[str] = []
    all_values: list[float] = []
    for i in range(years):
        chunk_end = end - dt.timedelta(days=365 * i)
        chunk_start = chunk_end - dt.timedelta(days=365)
        query = urllib.parse.urlencode({
            "symbol": "XAU",
            "groupBy": "day",
            "aggregation": "avg",
            "orderBy": "asc",
            "startTimestamp": int(chunk_start.timestamp()),
            "endTimestamp": int(chunk_end.timestamp()),
        })
        req = urllib.request.Request(
            f"{GOLD_API_COM_URL}?{query}",
            headers={"x-api-key": api_key, "User-Agent": "goldlens-rewind/1.0"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.load(resp)
        dates, values = parse_gold_api_com(payload)
        if not dates:
            sample = json.dumps(payload)[:300]
            print(f"  {chunk_start.date()}..{chunk_end.date()}: no rows (response: {sample})", file=sys.stderr)
            break
        print(f"  {chunk_start.date()}..{chunk_end.date()}: {len(dates)} days", file=sys.stderr)
        all_dates += dates
        all_values += values
    if not all_dates:
        raise SystemExit("gold-api.com returned no usable rows; see the response printed above.")
    return clean(all_dates, all_values, "gold-api.com daily average (XAU/USD)")


def save_csv(series: Series, path: str) -> None:
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "value"])
        writer.writerows(zip(series.dates, (round(float(v), 2) for v in series.values)))
    print(f"Saved {len(series.dates)} rows to {path}", file=sys.stderr)


def load_from_csv(path: str) -> Series:
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    return clean(
        [r["date"] for r in rows],
        [float(r["value"]) for r in rows],
        f"CSV ({os.path.basename(path)})",
    )


def make_synthetic(n_days: int, seed: int) -> Series:
    """Geometric random walk on business days - NOT real gold prices."""
    rng = np.random.default_rng(seed)
    end = dt.date(2026, 9, 25)
    dates: list[dt.date] = []
    d = end
    while len(dates) < n_days:
        if d.weekday() < 5:
            dates.append(d)
        d -= dt.timedelta(days=1)
    dates.reverse()

    # Slowly drifting volatility and trend so there are calm and stormy stretches.
    vol = 0.009 + 0.004 * np.sin(np.linspace(0, 3 * np.pi, n_days)) ** 2
    drift = 0.0006 * np.sin(np.linspace(0, 2 * np.pi, n_days) + 0.8)
    log_returns = drift + vol * rng.standard_normal(n_days)
    values = 2650.0 * np.exp(np.cumsum(log_returns))
    return Series(
        [x.isoformat() for x in dates],
        values,
        f"Synthetic random walk (seed {seed}) - not real prices",
    )


# --------------------------------------------------------------------------- models


def toy_momentum() -> tuple[Forecaster, ModelInfo]:
    """Extrapolates the last 20 days' average return with a volatility cone.

    A deliberately simple stand-in so the UI can be exercised without any ML
    dependencies. It is not TimesFM and should not be read as one.
    """

    def forecast(contexts: list[np.ndarray], horizon: int):
        steps = np.arange(1, horizon + 1)
        p10, p50, p90 = [], [], []
        for ctx in contexts:
            r = np.diff(np.log(ctx))
            mu = r[-20:].mean() if len(r) else 0.0
            sigma = r[-60:].std() if len(r) > 1 else 0.01
            base = np.log(ctx[-1]) + mu * steps
            spread = sigma * np.sqrt(steps)
            p10.append(np.exp(base + Z_10 * spread))
            p50.append(np.exp(base))
            p90.append(np.exp(base + Z_90 * spread))
        return np.array(p10), np.array(p50), np.array(p90)

    return forecast, ModelInfo(
        id="toy-momentum",
        label="Toy momentum model (stand-in, not TimesFM)",
        license="n/a",
    )


def timesfm_2p5(max_context: int, horizon: int, batch_size: int) -> tuple[Forecaster, ModelInfo]:
    import timesfm  # pip install "timesfm[torch]"

    model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
        "google/timesfm-2.5-200m-pytorch", torch_compile=False
    )
    model.compile(
        timesfm.ForecastConfig(
            max_context=max_context,
            max_horizon=horizon,
            normalize_inputs=True,
            use_continuous_quantile_head=True,
            force_flip_invariance=True,
            infer_is_positive=True,
            fix_quantile_crossing=True,
            per_core_batch_size=batch_size,
        )
    )

    def forecast(contexts: list[np.ndarray], h: int):
        # forecast() pads the list it is given, so hand it a copy.
        _, q = model.forecast(horizon=h, inputs=list(contexts))
        # q[..., 0] is the mean, q[..., 1:10] are the 0.1 ... 0.9 quantiles.
        return q[:, :, 1], q[:, :, 5], q[:, :, 9]

    return forecast, ModelInfo(
        id="timesfm-2.5-200m",
        label="TimesFM 2.5 (200M)",
        license="Apache-2.0",
    )


def timesfm_3(batch_size: int, device: str) -> tuple[Forecaster, ModelInfo]:
    from timesfm3 import ModelConfig, TimesFM3Evaluator  # pip install "timesfm[torch]>=3"

    evaluator = TimesFM3Evaluator(
        ModelConfig(
            checkpoint_path="google/timesfm-3.0-pytorch",
            per_core_batch_size=batch_size,
            device=device,
        )
    )

    def forecast(contexts: list[np.ndarray], h: int):
        outputs = list(
            evaluator.predict_batch(
                [c.astype(np.float32) for c in contexts],
                horizon=h,
                return_quantiles=True,
                use_symmetric_averaging=False,
            )
        )
        # quantiles are (h, 9) for levels 0.1 ... 0.9.
        q = np.stack([o.quantiles for o in outputs])
        return q[:, :, 0], q[:, :, 4], q[:, :, 8]

    return forecast, ModelInfo(
        id="timesfm-3.0",
        label="TimesFM 3.0",
        license="timesfm-non-commercial-license-v1.0 (non-commercial, non-production)",
    )


# --------------------------------------------------------------------------- backtest


def run_backtest(
    series: Series,
    forecaster: Forecaster,
    horizon: int,
    min_context: int,
    max_context: int,
    stride: int,
    chunk: int = 256,
) -> list[dict]:
    n = len(series.values)
    last_cutoff = n - 1 - horizon
    cutoffs = list(range(min_context - 1, last_cutoff + 1, stride))
    if not cutoffs:
        raise SystemExit(
            f"Not enough history: {n} points, need at least {min_context + horizon}."
        )

    results = []
    for start in range(0, len(cutoffs), chunk):
        batch = cutoffs[start : start + chunk]
        contexts = [series.values[max(0, i + 1 - max_context) : i + 1] for i in batch]
        p10, p50, p90 = forecaster(contexts, horizon)
        for j, i in enumerate(batch):
            results.append(
                {
                    "cutoffIndex": i,
                    "p10": [round(float(x), 2) for x in p10[j]],
                    "p50": [round(float(x), 2) for x in p50[j]],
                    "p90": [round(float(x), 2) for x in p90[j]],
                }
            )
        print(f"  forecast {min(start + chunk, len(cutoffs))}/{len(cutoffs)} cutoffs", file=sys.stderr)
    return results


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", choices=["api", "gold-api-com", "csv", "synthetic"], default="api")
    ap.add_argument("--api-base", default=os.environ.get("NEXT_PUBLIC_API_BASE"))
    ap.add_argument("--days", type=int, default=365, help="history to request from the API")
    ap.add_argument("--csv", help="CSV with a header row: date,value")
    ap.add_argument("--years", type=int, default=5, help="gold-api-com: years of history to request")
    ap.add_argument("--save-csv", help="also write the loaded history to this CSV (date,value)")
    ap.add_argument("--synthetic-days", type=int, default=320)
    ap.add_argument("--seed", type=int, default=29)
    ap.add_argument("--model", choices=["timesfm-2.5", "timesfm-3.0", "toy-momentum"], default="timesfm-2.5")
    ap.add_argument("--horizon", type=int, default=20, help="trading days ahead")
    ap.add_argument("--min-context", type=int, default=60)
    ap.add_argument("--max-context", type=int, default=512)
    ap.add_argument("--stride", type=int, default=1, help="days between cutoffs")
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--device", default="cpu", help="timesfm-3.0 only: cpu, cuda or mps")
    ap.add_argument("--out", default=DEFAULT_OUT)
    args = ap.parse_args()

    if args.source == "api":
        if not args.api_base:
            ap.error("--api-base (or NEXT_PUBLIC_API_BASE) is required for --source api")
        series = load_from_api(args.api_base, args.days)
    elif args.source == "gold-api-com":
        key = os.environ.get("GOLD_API_COM_KEY")
        if not key:
            ap.error("set GOLD_API_COM_KEY for --source gold-api-com")
        series = load_from_gold_api_com(args.years, key)
    elif args.source == "csv":
        if not args.csv:
            ap.error("--csv is required for --source csv")
        series = load_from_csv(args.csv)
    else:
        series = make_synthetic(args.synthetic_days, args.seed)
    print(f"Loaded {len(series.values)} points from {series.source}"
          f" ({series.dates[0]} to {series.dates[-1]})", file=sys.stderr)
    if args.save_csv:
        save_csv(series, args.save_csv)

    if args.model == "timesfm-2.5":
        forecaster, info = timesfm_2p5(args.max_context, args.horizon, args.batch_size)
    elif args.model == "timesfm-3.0":
        print(
            "Note: TimesFM 3.0 weights are licensed for non-commercial, non-production use only.",
            file=sys.stderr,
        )
        forecaster, info = timesfm_3(args.batch_size, args.device)
    else:
        forecaster, info = toy_momentum()

    forecasts = run_backtest(
        series, forecaster, args.horizon, args.min_context, args.max_context, args.stride
    )

    is_sample = args.source == "synthetic" or args.model == "toy-momentum"
    payload = {
        "meta": {
            "asset": "Gold spot (XAU/USD)",
            "unit": "USD/oz",
            "isSample": is_sample,
            "dataSource": series.source,
            "model": info.__dict__,
            "horizon": args.horizon,
            "minContext": args.min_context,
            "maxContext": args.max_context,
            "stride": args.stride,
            "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        },
        "series": [
            {"date": d, "value": round(float(v), 2)} for d, v in zip(series.dates, series.values)
        ],
        "forecasts": forecasts,
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
        f.write("\n")
    print(f"Wrote {len(forecasts)} forecasts to {os.path.relpath(args.out)}", file=sys.stderr)


if __name__ == "__main__":
    main()

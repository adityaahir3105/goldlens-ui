'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { RewindForecast, RewindPoint, formatUsd } from '@/lib/rewind';
import { REWIND_COLORS, longDate } from './RewindChart';

const W = 1000;
const H = 200;
const PAD_TOP = 12;
const PAD_BOTTOM = 8;

interface HistoryScrubberProps {
  series: RewindPoint[];
  forecasts: RewindForecast[];
  selected: number;
  onSelect: (index: number) => void;
  horizon: number;
  // Series index range shown in the detail chart, highlighted here.
  windowStart: number;
  windowEnd: number;
  // Challenge mode: don't draw prices after the selected day.
  concealFuture: boolean;
}

/** Index of the rewind whose cutoff is closest to a series index (cutoffs are ascending). */
function nearestRewind(forecasts: RewindForecast[], seriesIndex: number): number {
  let lo = 0;
  let hi = forecasts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (forecasts[mid].cutoffIndex < seriesIndex) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && seriesIndex - forecasts[lo - 1].cutoffIndex < forecasts[lo].cutoffIndex - seriesIndex) {
    return lo - 1;
  }
  return lo;
}

export function HistoryScrubber({
  series,
  forecasts,
  selected,
  onSelect,
  horizon,
  windowStart,
  windowEnd,
  concealFuture,
}: HistoryScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState<number | null>(null);

  const n = series.length;
  const cutoff = forecasts[selected].cutoffIndex;

  // low/high label the chart; min/max add 5% headroom for drawing.
  const { low, high, min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of series) {
      lo = Math.min(lo, p.value);
      hi = Math.max(hi, p.value);
    }
    const pad = (hi - lo) * 0.05;
    return { low: lo, high: hi, min: lo - pad, max: hi + pad };
  }, [series]);

  const x = useCallback((i: number) => (i / (n - 1)) * W, [n]);
  const y = useCallback(
    (v: number) => PAD_TOP + (1 - (v - min) / (max - min)) * (H - PAD_TOP - PAD_BOTTOM),
    [min, max]
  );

  const lastDrawn = concealFuture ? cutoff : n - 1;
  const { line, area } = useMemo(() => {
    let d = '';
    for (let i = 0; i <= lastDrawn; i++) {
      d += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(series[i].value).toFixed(1)}`;
    }
    return { line: d, area: `${d}L${x(lastDrawn).toFixed(1)},${H}L0,${H}Z` };
  }, [series, lastDrawn, x, y]);

  const band = useMemo(() => {
    const f = forecasts[selected];
    const top: string[] = [`${x(cutoff)},${y(series[cutoff].value)}`];
    const bottom: string[] = [];
    for (let k = 0; k < horizon; k++) {
      top.push(`${x(cutoff + k + 1)},${y(f.p90[k])}`);
      bottom.unshift(`${x(cutoff + k + 1)},${y(f.p10[k])}`);
    }
    return [...top, ...bottom].join(' ');
  }, [forecasts, selected, cutoff, horizon, series, x, y]);

  const yearTicks = useMemo(() => {
    const ticks: { index: number; label: string }[] = [];
    let lastYear = '';
    series.forEach((p, i) => {
      const year = p.date.slice(0, 4);
      if (year !== lastYear) {
        if (lastYear) ticks.push({ index: i, label: year });
        lastYear = year;
      }
    });
    return ticks;
  }, [series]);

  const seriesIndexAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return Math.round(ratio * (n - 1));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const i = seriesIndexAt(e.clientX);
    if (i !== null) onSelect(nearestRewind(forecasts, i));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const i = seriesIndexAt(e.clientX);
    setHover(i);
    if (dragging.current && i !== null) {
      const r = nearestRewind(forecasts, i);
      if (r !== selected) onSelect(r);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = forecasts.length - 1;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1, PageDown: -10, PageUp: 10 };
    let next: number | null = null;
    if (e.key in moves) next = selected + moves[e.key];
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next !== null) {
      e.preventDefault();
      onSelect(Math.min(Math.max(next, 0), last));
    }
  };

  const pct = (i: number) => `${(i / (n - 1)) * 100}%`;
  const hoverHidden = hover !== null && concealFuture && hover > cutoff;

  return (
    <div className="select-none">
      <div className="relative">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Rewind to date"
          aria-valuemin={0}
          aria-valuemax={forecasts.length - 1}
          aria-valuenow={selected}
          aria-valuetext={longDate(series[cutoff].date)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => setHover(null)}
          onKeyDown={handleKeyDown}
          className="relative h-36 cursor-crosshair touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold/60 sm:h-44"
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="history-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={REWIND_COLORS.price} stopOpacity="0.18" />
                <stop offset="100%" stopColor={REWIND_COLORS.price} stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x={x(windowStart)} width={x(windowEnd) - x(windowStart)} y="0" height={H} fill="#ffffff" fillOpacity="0.05" />
            <path d={area} fill="url(#history-fill)" />
            <path d={line} fill="none" stroke={REWIND_COLORS.price} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <polygon points={band} fill={REWIND_COLORS.model} fillOpacity="0.45" />
          </svg>

          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-gold shadow-[0_0_10px_rgba(255,215,0,0.6)]"
            style={{ left: pct(cutoff) }}
          >
            <div
              className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-gold"
              style={{ top: `${(y(series[cutoff].value) / H) * 100}%` }}
            />
          </div>

          <div className="pointer-events-none absolute left-1 top-0 text-[10px] text-zinc-500">High {formatUsd(high)}</div>
          <div className="pointer-events-none absolute bottom-0 left-1 text-[10px] text-zinc-500">Low {formatUsd(low)}</div>
        </div>

        {hover !== null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900/95 px-2.5 py-1.5 text-xs shadow-xl"
            style={{ left: `clamp(60px, ${pct(hover)}, calc(100% - 60px))` }}
          >
            <div className="text-zinc-400">{longDate(series[hover].date)}</div>
            <div className="font-semibold tabular-nums text-zinc-100">
              {hoverHidden ? 'Hidden until you guess' : formatUsd(series[hover].value, 2)}
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-1 h-4 text-[11px] text-zinc-500">
        {yearTicks.map((t) => (
          <span key={t.label} className="absolute -translate-x-1/2" style={{ left: pct(t.index) }}>
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

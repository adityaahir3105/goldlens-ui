'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_META, HistoryEvent, HistoryPoint, monthLabel } from '@/lib/history';
import { formatUsd } from '@/lib/rewind';

export type Scale = 'log' | 'linear';

interface GoldHistoryChartProps {
  points: HistoryPoint[];
  monthlyFrom: number;
  events: HistoryEvent[];
  // Which price to plot for each point.
  real: boolean;
  scale: Scale;
  fromYear: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const M = { top: 16, right: 16, bottom: 28, left: 60 };

function decimalYear(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  return y + ((m ?? 1) - 1) / 12 + ((day ?? 1) - 1) / 365;
}

function logTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  for (let p = Math.floor(Math.log10(min)); p <= Math.ceil(Math.log10(max)); p++) {
    for (const k of [1, 2, 5]) {
      const v = k * 10 ** p;
      if (v >= min && v <= max) ticks.push(v);
    }
  }
  return ticks;
}

function linearTicks(min: number, max: number, count = 5): number[] {
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return ticks;
}

function yearTicks(from: number, to: number, width: number): number[] {
  const span = to - from;
  const maxTicks = Math.max(3, Math.floor(width / 70));
  const step = [1, 2, 5, 10, 20, 25, 50].find((s) => span / s <= maxTicks) ?? 50;
  const ticks: number[] = [];
  for (let y = Math.ceil(from / step) * step; y <= to; y += step) ticks.push(y);
  return ticks;
}

export function GoldHistoryChart({
  points,
  monthlyFrom,
  events,
  real,
  scale,
  fromYear,
  selectedId,
  onSelect,
}: GoldHistoryChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [hover, setHover] = useState<number | null>(null);
  const height = width < 640 ? 300 : 400;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const visible = useMemo(
    () =>
      points
        .map((p) => ({ x: decimalYear(p.d), y: real ? p.r : p.v, p }))
        .filter((q): q is { x: number; y: number; p: HistoryPoint } => q.y !== null && q.x >= fromYear),
    [points, real, fromYear]
  );

  const geometry = useMemo(() => {
    if (visible.length < 2) return null;
    const x0 = visible[0].x;
    const x1 = visible[visible.length - 1].x;
    let lo = Infinity;
    let hi = -Infinity;
    for (const q of visible) {
      lo = Math.min(lo, q.y);
      hi = Math.max(hi, q.y);
    }
    const yMin = scale === 'log' ? lo / 1.25 : Math.max(0, lo - (hi - lo) * 0.05);
    const yMax = scale === 'log' ? hi * 1.2 : hi + (hi - lo) * 0.08;
    const innerW = width - M.left - M.right;
    const innerH = height - M.top - M.bottom;
    const sx = (x: number) => M.left + ((x - x0) / (x1 - x0 || 1)) * innerW;
    const sy = (v: number) =>
      scale === 'log'
        ? M.top + (1 - (Math.log(v) - Math.log(yMin)) / (Math.log(yMax) - Math.log(yMin))) * innerH
        : M.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;

    let line = '';
    visible.forEach((q, i) => {
      line += `${i ? 'L' : 'M'}${sx(q.x).toFixed(1)},${sy(q.y).toFixed(1)}`;
    });
    const area = `${line}L${sx(x1).toFixed(1)},${M.top + innerH}L${sx(x0).toFixed(1)},${M.top + innerH}Z`;
    const yTicks = scale === 'log' ? logTicks(yMin, yMax) : linearTicks(yMin, yMax);
    return { x0, x1, sx, sy, line, area, yTicks, innerH, innerW };
  }, [visible, scale, width, height]);

  // Each event sits on the line at the month (or year) it happened.
  const markers = useMemo(() => {
    if (!geometry) return [];
    return events
      .map((e) => {
        const x = decimalYear(e.date);
        if (x < geometry.x0 || x > geometry.x1 + 1 / 12) return null;
        let q = visible[0];
        for (const v of visible) {
          if (v.x <= x + 1e-9) q = v;
          else break;
        }
        return { e, cx: geometry.sx(Math.min(x, geometry.x1)), cy: geometry.sy(q.y) };
      })
      .filter((m): m is { e: HistoryEvent; cx: number; cy: number } => m !== null);
  }, [events, geometry, visible]);

  if (!geometry) return <div ref={wrapRef} className="h-[300px]" />;

  const handleMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = geometry.x0 + ((e.clientX - rect.left) / rect.width) * (geometry.x1 - geometry.x0);
    let lo = 0;
    let hi = visible.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (visible[mid].x < x) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0 && x - visible[lo - 1].x < visible[lo].x - x) lo -= 1;
    setHover(lo);
  };

  const hovered = hover !== null ? visible[hover] : null;

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <svg width={width} height={height} className="block" role="img" aria-label="Gold price history with key events">
        <defs>
          <linearGradient id="history-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </linearGradient>
        </defs>

        {geometry.yTicks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={width - M.right} y1={geometry.sy(t)} y2={geometry.sy(t)} stroke="#27272a" />
            <text x={M.left - 8} y={geometry.sy(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="#71717a">
              {formatUsd(t)}
            </text>
          </g>
        ))}
        {yearTicks(geometry.x0, geometry.x1, geometry.innerW).map((y) => (
          <text key={y} x={geometry.sx(y)} y={height - 8} textAnchor="middle" fontSize="11" fill="#71717a">
            {y}
          </text>
        ))}

        <path d={geometry.area} fill="url(#history-area)" />
        <path d={geometry.line} fill="none" stroke="#FFD700" strokeWidth="1.75" strokeLinejoin="round" />

        {hovered && (
          <g pointerEvents="none">
            <line
              x1={geometry.sx(hovered.x)}
              x2={geometry.sx(hovered.x)}
              y1={M.top}
              y2={M.top + geometry.innerH}
              stroke="#52525b"
              strokeDasharray="3 3"
            />
            <circle cx={geometry.sx(hovered.x)} cy={geometry.sy(hovered.y)} r="4" fill="#FFD700" stroke="#18181b" strokeWidth="2" />
          </g>
        )}

        <rect
          x={M.left}
          y={M.top}
          width={geometry.innerW}
          height={geometry.innerH}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
        />

        {markers.map(({ e, cx, cy }) => {
          const active = e.id === selectedId;
          const color = CATEGORY_META[e.category].color;
          return (
            <g
              key={e.id}
              role="button"
              tabIndex={0}
              aria-label={`${e.title}, ${e.date.slice(0, 4)}`}
              aria-pressed={active}
              onClick={() => onSelect(e.id)}
              onKeyDown={(k) => {
                if (k.key === 'Enter' || k.key === ' ') {
                  k.preventDefault();
                  onSelect(e.id);
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-white"
            >
              {active && (
                <line x1={cx} x2={cx} y1={M.top} y2={M.top + geometry.innerH} stroke={color} strokeOpacity="0.5" />
              )}
              <circle cx={cx} cy={cy} r="12" fill="transparent" />
              {active && <circle cx={cx} cy={cy} r="11" fill={color} fillOpacity="0.2" />}
              <circle cx={cx} cy={cy} r={active ? 6.5 : 5} fill={color} stroke="#09090b" strokeWidth="2" />
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900/95 px-2.5 py-1.5 text-xs shadow-xl"
          style={{ left: `clamp(70px, ${geometry.sx(hovered.x)}px, calc(100% - 70px))` }}
        >
          <div className="text-zinc-400">
            {monthLabel(hovered.p.d, Number(hovered.p.d.slice(0, 4)) < monthlyFrom)}
            {Number(hovered.p.d.slice(0, 4)) < monthlyFrom ? ' (annual)' : ''}
          </div>
          <div className="font-semibold tabular-nums text-zinc-100">{formatUsd(hovered.y, hovered.y < 100 ? 2 : 0)}</div>
        </div>
      )}
    </div>
  );
}

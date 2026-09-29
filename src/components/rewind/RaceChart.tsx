'use client';

import { useRef } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RacePoint, formatUsd } from '@/lib/rewind';
import { REWIND_COLORS, longDate } from './RewindChart';

const MARGIN = { top: 8, right: 12, bottom: 0, left: 0 };
const Y_AXIS_WIDTH = 72;

const AHEAD = '#3B82F6';
const BEHIND = '#EA580C';

function yearTick(date: string): string {
  return date.slice(0, 4);
}

function signedUsd(v: number): string {
  if (Math.round(v) === 0) return formatUsd(0);
  return `${v > 0 ? '+' : '−'}${formatUsd(Math.abs(v))}`;
}

interface RaceChartProps {
  race: RacePoint[];
  selected: number;
  onSelect: (index: number) => void;
  modelLabel: string;
}

export function RaceChart({ race, selected, onSelect, modelLabel }: RaceChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const final = race[race.length - 1]?.lead ?? 0;

  // Map the click's x position to a rewind directly. Recharts' own click state depends on its
  // hover tracking, which updates on the next animation frame and can be stale for a quick click.
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || race.length < 2) return;
    const left = rect.left + MARGIN.left + Y_AXIS_WIDTH;
    const width = rect.width - MARGIN.left - Y_AXIS_WIDTH - MARGIN.right;
    if (width <= 0) return;
    const ratio = (e.clientX - left) / width;
    if (ratio < 0 || ratio > 1) return;
    onSelect(Math.round(ratio * (race.length - 1)));
  };
  // One tick per calendar year, at the first rewind of the year.
  const ticks = race.filter((p, i) => i > 0 && p.date.slice(0, 4) !== race[i - 1].date.slice(0, 4)).map((p) => p.date);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">The race</h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Running total of dollars the model&rsquo;s median was closer than &ldquo;no change&rdquo;, rewind by rewind.
            Above zero the model is ahead.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500">Final tally</div>
          <div className="text-lg font-semibold text-zinc-100">{signedUsd(final)}</div>
        </div>
      </div>

      <div ref={plotRef} onClick={handleClick} className="h-[200px] w-full cursor-pointer">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 200 }}>
          <AreaChart data={race} margin={MARGIN}>
            <CartesianGrid stroke={REWIND_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={yearTick}
              tick={{ fill: REWIND_COLORS.axis, fontSize: 11 }}
              axisLine={{ stroke: REWIND_COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => signedUsd(v)}
              tick={{ fill: REWIND_COLORS.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={Y_AXIS_WIDTH}
            />
            <ReferenceLine y={0} stroke="#52525b" />
            <ReferenceLine x={race[selected]?.date} stroke={REWIND_COLORS.price} strokeWidth={1.5} />
            <Tooltip
              cursor={{ stroke: '#52525b', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as RacePoint;
                return (
                  <div className="rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl">
                    <div className="text-zinc-500">{longDate(p.date)}</div>
                    <div className="font-semibold tabular-nums text-zinc-100">{signedUsd(p.lead)}</div>
                    <div className="text-zinc-400">
                      {p.lead >= 0 ? `${modelLabel} ahead` : '"No change" ahead'}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              dataKey="ahead"
              stroke={AHEAD}
              strokeWidth={1.5}
              fill={AHEAD}
              fillOpacity={0.15}
              isAnimationActive={false}
              activeDot={false}
            />
            <Area
              dataKey="behind"
              stroke={BEHIND}
              strokeWidth={1.5}
              fill={BEHIND}
              fillOpacity={0.15}
              isAnimationActive={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: AHEAD }} />
          Model ahead
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BEHIND }} />
          &ldquo;No change&rdquo; ahead
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-gold" />
          Selected day
        </span>
      </div>
    </div>
  );
}

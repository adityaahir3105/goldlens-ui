'use client';

import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RewindData, RewindForecast, formatUsd } from '@/lib/rewind';

export const REWIND_COLORS = {
  price: '#FFD700',
  model: '#3B82F6',
  naive: '#A1A1AA',
  grid: '#27272a',
  axis: '#71717a',
  surface: '#18181b',
};

export interface RewindChartRow {
  date: string;
  past: number | null;
  actual: number | null;
  median: number | null;
  band: [number, number] | null;
  naive: number | null;
}

export function buildRows(
  data: RewindData,
  forecast: RewindForecast,
  horizon: number,
  showFuture: boolean
): RewindChartRow[] {
  const c = forecast.cutoffIndex;
  const lookback = horizon * 3 + 20;
  const start = Math.max(0, c - lookback);
  const end = c + horizon;
  const cutoffPrice = data.series[c].value;

  const rows: RewindChartRow[] = [];
  for (let i = start; i <= end; i++) {
    const { date, value } = data.series[i];
    const step = i - c - 1;
    const inFuture = i > c;
    rows.push({
      date,
      past: i <= c ? value : null,
      actual: showFuture && i >= c ? value : null,
      median: i === c ? cutoffPrice : inFuture ? forecast.p50[step] : null,
      band: i === c ? [cutoffPrice, cutoffPrice] : inFuture ? [forecast.p10[step], forecast.p90[step]] : null,
      naive: i >= c ? cutoffPrice : null,
    });
  }
  return rows;
}

function shortDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function longDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

interface TooltipRowProps {
  color: string;
  dash?: string;
  label: string;
  value: string;
}

function TooltipRow({ color, dash, label, value }: TooltipRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-zinc-400">
        <svg width="14" height="4" aria-hidden="true">
          <line x1="0" y1="2" x2="14" y2="2" stroke={color} strokeWidth="2" strokeDasharray={dash} />
        </svg>
        {label}
      </span>
      <span className="font-semibold tabular-nums text-zinc-100">{value}</span>
    </div>
  );
}

interface RewindChartProps {
  data: RewindData;
  forecast: RewindForecast;
  horizon: number;
  showFuture: boolean;
  animateReveal: boolean;
}

export function RewindChart({ data, forecast, horizon, showFuture, animateReveal }: RewindChartProps) {
  const rows = useMemo(
    () => buildRows(data, forecast, horizon, showFuture),
    [data, forecast, horizon, showFuture]
  );

  const cutoffDate = data.series[forecast.cutoffIndex].date;
  const cutoffPrice = data.series[forecast.cutoffIndex].value;
  const target = data.series[forecast.cutoffIndex + horizon];
  const lastDate = rows[rows.length - 1].date;

  return (
    <div className="h-[300px] sm:h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 380 }}>
        <ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={REWIND_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: REWIND_COLORS.axis, fontSize: 11 }}
            axisLine={{ stroke: REWIND_COLORS.grid }}
            tickLine={false}
            minTickGap={36}
          />
          {/* 'auto' only spans rendered values, so a hidden future can't leak via the axis. */}
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatUsd(v)}
            tick={{ fill: REWIND_COLORS.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />

          <ReferenceArea
            x1={cutoffDate}
            x2={lastDate}
            fill="#ffffff"
            fillOpacity={showFuture ? 0.025 : 0.05}
            label={showFuture ? undefined : { value: '?', position: 'center', fill: '#a1a1aa', fontSize: 28 }}
          />
          {/* Right-aligned to the line so the label sits over the past and never clips on narrow screens. */}
          <ReferenceLine
            x={cutoffDate}
            stroke="#52525b"
            label={{
              value: "Model's knowledge ends",
              position: 'insideTopRight',
              textAnchor: 'end',
              offset: 6,
              fill: '#a1a1aa',
              fontSize: 11,
            }}
          />

          <Tooltip
            cursor={{ stroke: '#52525b', strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as RewindChartRow;
              const price = row.actual ?? row.past;
              return (
                <div className="min-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl space-y-1">
                  <div className="mb-1 text-zinc-500">{longDate(row.date)}</div>
                  {price !== null && (
                    <TooltipRow color={REWIND_COLORS.price} label="Gold price" value={formatUsd(price, 2)} />
                  )}
                  {row.median !== null && row.date !== cutoffDate && (
                    <TooltipRow color={REWIND_COLORS.model} dash="4 3" label="Model median" value={formatUsd(row.median, 2)} />
                  )}
                  {row.band && row.date !== cutoffDate && (
                    <TooltipRow
                      color={REWIND_COLORS.model}
                      label="80% range"
                      value={`${formatUsd(row.band[0])} – ${formatUsd(row.band[1])}`}
                    />
                  )}
                  {row.naive !== null && row.date !== cutoffDate && (
                    <TooltipRow color={REWIND_COLORS.naive} dash="1 3" label="No-change guess" value={formatUsd(row.naive, 2)} />
                  )}
                </div>
              );
            }}
          />

          <Area
            dataKey="band"
            stroke="none"
            fill={REWIND_COLORS.model}
            fillOpacity={0.14}
            isAnimationActive={false}
            connectNulls={false}
            activeDot={false}
          />
          <Line
            dataKey="naive"
            stroke={REWIND_COLORS.naive}
            strokeWidth={1.5}
            strokeDasharray="1 4"
            strokeLinecap="round"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="past"
            stroke={REWIND_COLORS.price}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: REWIND_COLORS.price, stroke: REWIND_COLORS.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            dataKey="median"
            stroke={REWIND_COLORS.model}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          {showFuture && (
            <Line
              key={`actual-${forecast.cutoffIndex}-${horizon}`}
              dataKey="actual"
              stroke={REWIND_COLORS.price}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: REWIND_COLORS.price, stroke: REWIND_COLORS.surface, strokeWidth: 2 }}
              isAnimationActive={animateReveal}
              animationDuration={900}
              animationEasing="ease-out"
            />
          )}

          <ReferenceDot
            x={cutoffDate}
            y={cutoffPrice}
            r={5}
            fill={REWIND_COLORS.price}
            stroke={REWIND_COLORS.surface}
            strokeWidth={2}
          />
          <ReferenceDot
            x={target.date}
            y={forecast.p50[horizon - 1]}
            r={5}
            fill={REWIND_COLORS.model}
            stroke={REWIND_COLORS.surface}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { DuelData, DuelForecast, LOOKBACK } from '@/lib/duel';
import { REWIND_COLORS } from '@/components/rewind/RewindChart';

interface Row {
  x: number;
  before: number | null;
  game: number | null;
  band: [number, number] | null;
  median: number | null;
}

interface DuelChartProps {
  data: DuelData;
  // Series index of the first round's price: the chart is indexed to 100 there.
  startIndex: number;
  // Last series index the player may see.
  visibleEnd: number;
  // Rounds' decision points so far (series indices).
  roundIndices: number[];
  // The AI's forecast for the current round, drawn once the round is revealed.
  forecast: DuelForecast | null;
}

export function DuelChart({ data, startIndex, visibleEnd, roundIndices, forecast }: DuelChartProps) {
  const base = data.series[startIndex].value;
  const index = (v: number) => (v / base) * 100;

  const rows = useMemo(() => {
    const index = (v: number) => (v / data.series[startIndex].value) * 100;
    const from = Math.max(0, startIndex - LOOKBACK);
    const out: Row[] = [];
    const bandTo = forecast?.targetIndex ?? -1;
    for (let i = from; i <= Math.max(visibleEnd, bandTo); i++) {
      const v = data.series[i].value;
      const visible = i <= visibleEnd;
      let band: [number, number] | null = null;
      let median: number | null = null;
      if (forecast && i >= forecast.cutoffIndex && i <= forecast.targetIndex) {
        // A funnel from today's price to the forecast range at the next round.
        const t = (i - forecast.cutoffIndex) / (forecast.targetIndex - forecast.cutoffIndex || 1);
        const p0 = data.series[forecast.cutoffIndex].value;
        band = [index(p0 + (forecast.low - p0) * t), index(p0 + (forecast.high - p0) * t)];
        median = index(p0 + (forecast.median - p0) * t);
      }
      out.push({
        x: i - startIndex,
        before: visible && i <= startIndex ? index(v) : null,
        game: visible && i >= startIndex ? index(v) : null,
        band,
        median,
      });
    }
    return out;
  }, [data, startIndex, visibleEnd, forecast]);

  const now = roundIndices[roundIndices.length - 1] - startIndex;

  return (
    <div className="h-[260px] w-full sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 700, height: 320 }}>
        <ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={REWIND_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v: number) => (v === 0 ? 'Start' : v > 0 ? `+${v}` : `${v}`)}
            tick={{ fill: REWIND_COLORS.axis, fontSize: 11 }}
            axisLine={{ stroke: REWIND_COLORS.grid }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => v.toFixed(0)}
            tick={{ fill: REWIND_COLORS.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <ReferenceLine y={100} stroke="#3f3f46" strokeDasharray="3 3" />
          <ReferenceLine
            x={now}
            stroke="#52525b"
            label={{ value: 'Now', position: 'insideTopRight', textAnchor: 'end', offset: 6, fill: '#a1a1aa', fontSize: 11 }}
          />
          <Area dataKey="band" stroke="none" fill={REWIND_COLORS.model} fillOpacity={0.2} activeDot={false} isAnimationActive={false} connectNulls={false} />
          <Line dataKey="median" stroke={REWIND_COLORS.model} strokeDasharray="5 3" strokeWidth={1.5} dot={false} activeDot={false} isAnimationActive={false} connectNulls={false} />
          <Line dataKey="before" stroke="#71717a" strokeWidth={1.5} dot={false} activeDot={false} isAnimationActive={false} connectNulls={false} />
          <Line dataKey="game" stroke={REWIND_COLORS.price} strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} connectNulls={false} />
          {roundIndices.map((i) =>
            i <= visibleEnd ? (
              <ReferenceDot
                key={i}
                x={i - startIndex}
                y={index(data.series[i].value)}
                r={3.5}
                fill={REWIND_COLORS.price}
                stroke="#09090b"
                strokeWidth={1.5}
              />
            ) : null
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

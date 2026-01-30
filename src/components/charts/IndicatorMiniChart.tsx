'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

interface IndicatorMiniChartProps {
  data: DataPoint[];
  color?: string;
  unit?: string;
}

export function IndicatorMiniChart({
  data,
  color = '#FFD700',
  unit = '',
}: IndicatorMiniChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-600">
        No historical data yet
      </div>
    );
  }

  const formatTooltipValue = (value: number) => {
    if (unit === '%') return `${value.toFixed(2)}%`;
    if (unit === 'USD' || unit === '$') return `$${value.toLocaleString()}`;
    return `${value.toLocaleString()} ${unit}`;
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: color }}
            formatter={(value) => [formatTooltipValue(value as number), 'Value']}
            labelFormatter={(label) => formatXAxis(label)}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: color,
              stroke: '#18181b',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

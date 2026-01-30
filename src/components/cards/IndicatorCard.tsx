'use client';

import { motion } from 'framer-motion';
import { IndicatorWithData, SignalColor, IndicatorHistoryPoint } from '@/lib/types';
import { getSignalColor, formatValue, formatShortDate, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IndicatorMiniChart } from '@/components/charts/IndicatorMiniChart';

interface IndicatorCardProps {
  data: IndicatorWithData;
  index?: number;
}

function getSignalHelperText(signal: SignalColor): string {
  switch (signal) {
    case 'GREEN':
      return 'Conditions supportive for gold';
    case 'YELLOW':
      return 'Trend is mixed — monitor for confirmation';
    case 'RED':
      return 'Headwinds present for gold';
  }
}

function getSignalChartColor(signal: SignalColor): string {
  switch (signal) {
    case 'GREEN':
      return '#34d399';
    case 'YELLOW':
      return '#fbbf24';
    case 'RED':
      return '#f87171';
  }
}

function getSignalIcon(signal: SignalColor): string {
  switch (signal) {
    case 'GREEN':
      return '▲';
    case 'YELLOW':
      return '●';
    case 'RED':
      return '▼';
  }
}

function calculateTrendDelta(history: IndicatorHistoryPoint[]): { delta: number; direction: 'up' | 'down' | 'flat' } | null {
  if (history.length < 2) return null;
  
  const latest = history[history.length - 1];
  const targetDate = new Date(latest.date);
  targetDate.setDate(targetDate.getDate() - 7);
  
  let comparePoint: IndicatorHistoryPoint | null = null;
  for (const point of history) {
    const pointDate = new Date(point.date);
    if (pointDate <= targetDate) {
      comparePoint = point;
    } else {
      break;
    }
  }
  
  if (!comparePoint) {
    comparePoint = history[0];
  }
  
  const delta = latest.value - comparePoint.value;
  const direction = delta > 0.001 ? 'up' : delta < -0.001 ? 'down' : 'flat';
  
  return { delta, direction };
}

export function IndicatorCard({ data, index = 0 }: IndicatorCardProps) {
  const { indicator, latestSignal, history } = data;

  const signalColors = latestSignal ? getSignalColor(latestSignal.signal) : null;

  const badgeVariant = latestSignal
    ? ({
        GREEN: 'success',
        YELLOW: 'warning',
        RED: 'danger',
      }[latestSignal.signal] as 'success' | 'warning' | 'danger')
    : 'default';

  const chartColor = latestSignal 
    ? getSignalChartColor(latestSignal.signal) 
    : '#FFD700';

  const chartData = history.map((point) => ({
    date: point.date,
    value: point.value,
  }));

  const cardBorderClass = latestSignal
    ? {
        GREEN: 'border-emerald-500/20',
        YELLOW: 'border-amber-500/20',
        RED: 'border-rose-500/20',
      }[latestSignal.signal]
    : 'border-zinc-800';

  const latestPoint = history.length > 0 ? history[history.length - 1] : null;
  const trendDelta = calculateTrendDelta(history);
  
  const deltaColorClass = trendDelta
    ? {
        up: 'text-emerald-400',
        down: 'text-rose-400',
        flat: 'text-amber-400',
      }[trendDelta.direction]
    : 'text-zinc-500';
  
  const deltaIcon = trendDelta
    ? {
        up: '▲',
        down: '▼',
        flat: '●',
      }[trendDelta.direction]
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Card className={cn('h-full transition-colors hover:border-zinc-700', cardBorderClass)}>
        <CardContent>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'truncate text-sm font-semibold',
                latestSignal ? signalColors?.text : 'text-zinc-100'
              )}>
                {indicator.name}
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500">{indicator.code}</p>
            </div>
            {latestSignal && (
              <Badge variant={badgeVariant}>
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', signalColors?.dot)}
                />
                {latestSignal.signal}
              </Badge>
            )}
          </div>

          {latestPoint ? (
            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gold">
                  {formatValue(latestPoint.value, indicator.unit)}
                </span>
                {trendDelta && (
                  <span className={cn('text-sm font-medium', deltaColorClass)}>
                    {deltaIcon} {trendDelta.delta >= 0 ? '+' : ''}{trendDelta.delta.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                As of {formatShortDate(latestPoint.date)}
              </p>
            </div>
          ) : (
            <div className="mb-3">
              <p className="text-sm text-zinc-500">
                Macro signals are stabilizing — analysis will update as new data arrives
              </p>
            </div>
          )}

          <div className="mb-3">
            <IndicatorMiniChart 
              data={chartData} 
              color={chartColor}
              unit={indicator.unit}
            />
          </div>

          {latestSignal && (
            <div className="rounded-lg bg-zinc-800/50 p-2.5">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs flex-shrink-0', signalColors?.text)}>
                  {getSignalIcon(latestSignal.signal)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-medium mb-1.5', signalColors?.text)}>
                    {getSignalHelperText(latestSignal.signal)}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-500">
                      Confidence
                    </span>
                    <span className={cn('text-xs font-semibold', signalColors?.text)}>
                      {(latestSignal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${latestSignal.confidence * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                      className={cn('h-full rounded-full', signalColors?.dot)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            {indicator.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

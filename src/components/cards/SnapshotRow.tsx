'use client';

import { IndicatorHistoryPoint, SignalColor, GoldPriceHistoryPoint } from '@/lib/types';
import { cn, safePercentChange, formatPercentChange, formatAbsoluteChange } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';

interface SnapshotRowProps {
  goldPriceHistory: GoldPriceHistoryPoint[];
  realYieldSignal: SignalColor | null;
  dxySignal: SignalColor | null;
  realYieldHistory: IndicatorHistoryPoint[];
  dxyHistory: IndicatorHistoryPoint[];
}

function getDirectionAndChange(history: IndicatorHistoryPoint[]): { direction: 'up' | 'down' | 'flat'; change: number | null } {
  if (history.length < 2) return { direction: 'flat', change: null };
  const latest = history[history.length - 1]?.value;
  const first = history[0]?.value;
  if (latest === undefined || first === undefined || !isFinite(latest) || !isFinite(first)) {
    return { direction: 'flat', change: null };
  }
  const diff = latest - first;
  if (!isFinite(diff)) return { direction: 'flat', change: null };
  const direction = diff > 0.01 ? 'up' : diff < -0.01 ? 'down' : 'flat';
  return { direction, change: diff };
}

function getGoldPriceData(history: GoldPriceHistoryPoint[]): { change: number | null; changePercent: number | null; direction: 'up' | 'down' | 'flat' } {
  if (history.length < 2) return { change: null, changePercent: null, direction: 'flat' };
  const latest = history[history.length - 1]?.value;
  const first = history[0]?.value;
  if (latest === undefined || first === undefined || !isFinite(latest) || !isFinite(first) || first === 0) {
    return { change: null, changePercent: null, direction: 'flat' };
  }
  const change = latest - first;
  const changePercent = safePercentChange(latest, first);
  if (!isFinite(change)) return { change: null, changePercent: null, direction: 'flat' };
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  return { change, changePercent, direction };
}

function IndicatorChange({ label, direction, change, unit }: { label: string; direction: 'up' | 'down' | 'flat'; change: number | null; unit?: string }) {
  const icon = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●';
  const colorClass = direction === 'up' 
    ? 'text-emerald-400' 
    : direction === 'down' 
    ? 'text-rose-400' 
    : 'text-amber-400';

  const formattedChange = change !== null ? formatAbsoluteChange(change, 2) : '—';

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-zinc-500 mb-0.5">{label}</span>
      <span className={cn('text-sm font-semibold', colorClass)}>
        {icon} {formattedChange}{unit && change !== null ? unit : ''}
      </span>
    </div>
  );
}

export function SnapshotRow({ 
  goldPriceHistory, 
  realYieldHistory, 
  dxyHistory 
}: SnapshotRowProps) {
  const realYieldData = getDirectionAndChange(realYieldHistory);
  const dxyData = getDirectionAndChange(dxyHistory);
  const goldData = getGoldPriceData(goldPriceHistory);

  const goldIcon = goldData.direction === 'up' ? '▲' : goldData.direction === 'down' ? '▼' : '●';
  const goldColorClass = goldData.direction === 'up'
    ? 'text-emerald-400'
    : goldData.direction === 'down'
    ? 'text-rose-400'
    : 'text-zinc-500';

  return (
    <Card className="border-zinc-800">
      <CardContent className="py-3">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
          Market Snapshot (30D)
        </div>
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 mb-0.5">Gold</span>
            <span className={cn('text-sm font-semibold', goldColorClass)}>
              {goldIcon} {formatPercentChange(goldData.changePercent)}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <IndicatorChange 
            label="Real Yield" 
            direction={realYieldData.direction} 
            change={realYieldData.change}
            unit="%"
          />
          <div className="h-6 w-px bg-zinc-800" />
          <IndicatorChange 
            label="Dollar Index" 
            direction={dxyData.direction} 
            change={dxyData.change}
          />
        </div>
      </CardContent>
    </Card>
  );
}

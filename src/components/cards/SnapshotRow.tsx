'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { MarketSnapshot, MetricSnapshot } from '@/lib/types';
import { cn, formatPercentChange, formatAbsoluteChange } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';

interface SnapshotRowProps {
  snapshot: MarketSnapshot | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDirection(changePercent: number | null): 'up' | 'down' | 'flat' {
  if (changePercent === null) return 'flat';
  if (changePercent > 0.01) return 'up';
  if (changePercent < -0.01) return 'down';
  return 'flat';
}

interface MetricDisplayProps {
  label: string;
  metric: MetricSnapshot;
  displayType: 'percent' | 'absolute';
  unit?: string;
}

function MetricDisplay({ label, metric, displayType, unit }: MetricDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isMissing = metric.status === 'missing';
  const isStale = metric.status === 'stale';
  const direction = getDirection(metric.changePercent);
  
  const icon = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●';
  const colorClass = direction === 'up' 
    ? 'text-emerald-400' 
    : direction === 'down' 
    ? 'text-rose-400' 
    : 'text-amber-400';

  const formattedValue = isMissing 
    ? '—' 
    : displayType === 'percent' 
      ? formatPercentChange(metric.changePercent)
      : `${formatAbsoluteChange(metric.change ?? 0, 2)}${unit || ''}`;

  const handleMouseEnter = () => {
    if (triggerRef.current && (isStale || isMissing)) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const tooltipContent = showTooltip && (isStale || isMissing) && mounted && (
    createPortal(
      <div 
        className="fixed z-[1000] px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
        style={{ 
          top: tooltipPos.top, 
          left: tooltipPos.left,
          transform: 'translateX(-50%)',
        }}
      >
        <div className="text-xs text-zinc-300">
          {isMissing ? (
            'Data unavailable'
          ) : (
            <>
              <span className="text-amber-400">⚠ Stale data</span>
              <br />
              Last updated: {formatDate(metric.asOfDate)}
            </>
          )}
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-l border-t border-zinc-700 rotate-45" />
      </div>,
      document.body
    )
  );

  return (
    <div 
      ref={triggerRef}
      className="flex flex-col items-center min-w-[80px] relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs text-zinc-500">{label}</span>
        {isStale && (
          <AlertTriangle className="h-3 w-3 text-amber-500" />
        )}
      </div>
      <span className={cn(
        'text-sm font-semibold',
        isMissing ? 'text-zinc-600' : colorClass,
        isStale && 'opacity-70'
      )}>
        {!isMissing && icon} {formattedValue}
      </span>
      {!isMissing && (
        <span className={cn(
          'text-[10px] mt-0.5',
          isStale ? 'text-amber-500/70' : 'text-zinc-600'
        )}>
          {formatDate(metric.asOfDate)}
        </span>
      )}
      {tooltipContent}
    </div>
  );
}

export function SnapshotRow({ snapshot }: SnapshotRowProps) {
  const emptyMetric: MetricSnapshot = {
    value: null,
    change: null,
    changePercent: null,
    asOfDate: null,
    source: null,
    fresh: false,
    status: 'missing',
  };

  const gold = snapshot?.gold ?? emptyMetric;
  const realYield = snapshot?.realYield ?? emptyMetric;
  const dxy = snapshot?.dxy ?? emptyMetric;

  return (
    <Card className="w-full border-zinc-800">
      <CardContent className="py-4">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
          Market Snapshot (30D)
        </div>
        <div className="flex items-center justify-around">
          <MetricDisplay 
            label="Gold" 
            metric={gold} 
            displayType="percent"
          />
          <div className="h-8 w-px bg-zinc-800" />
          <MetricDisplay 
            label="Real Yield" 
            metric={realYield} 
            displayType="absolute"
            unit="%"
          />
          <div className="h-8 w-px bg-zinc-800" />
          <MetricDisplay 
            label="Dollar Index" 
            metric={dxy} 
            displayType="absolute"
          />
        </div>
      </CardContent>
    </Card>
  );
}

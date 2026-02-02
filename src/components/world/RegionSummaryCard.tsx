'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RegionSummaryCardProps {
  region: string;
  holdingsTonnes: number | null;
  netFlowTonnes: number | null;
}

export function RegionSummaryCard({ region, holdingsTonnes, netFlowTonnes }: RegionSummaryCardProps) {
  const isPositive = netFlowTonnes !== null && netFlowTonnes > 0;
  const isNegative = netFlowTonnes !== null && netFlowTonnes < 0;

  const flowColor = isPositive 
    ? 'text-emerald-400' 
    : isNegative 
      ? 'text-rose-400' 
      : 'text-zinc-400';

  const FlowIcon = isPositive 
    ? TrendingUp 
    : isNegative 
      ? TrendingDown 
      : Minus;

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatFlow = (num: number | null) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <div className="rounded-lg border border-white/5 bg-zinc-900/50 p-4 backdrop-blur-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
        {region}
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="text-xs text-zinc-500">Holdings</div>
          <div className="text-sm font-medium text-zinc-200">
            {formatNumber(holdingsTonnes)} <span className="text-zinc-500 text-xs">tonnes</span>
          </div>
        </div>
        
        <div>
          <div className="text-xs text-zinc-500">Net Flow</div>
          <div className={`flex items-center gap-1 text-sm font-medium ${flowColor}`}>
            <FlowIcon className="h-3.5 w-3.5" />
            <span>{formatFlow(netFlowTonnes)} <span className="text-zinc-500 text-xs">tonnes</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

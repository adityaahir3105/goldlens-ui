'use client';

import { useState, useMemo } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { GoldETFWorldMap } from './GoldETFWorldMap';
import { RegionSummaryCard } from './RegionSummaryCard';
import { EtfFlowPoint, DisplayFlowPoint, DisplayRegion } from '@/lib/types';
import { transformEtfData, DISPLAY_REGIONS } from '@/lib/etfDataTransform';

interface GoldETFWorldSectionProps {
  data: EtfFlowPoint[];
  source: string;
}

interface TooltipData {
  region: DisplayRegion;
  holdingsTonnes: number | null;
  netFlowTonnes: number | null;
}

export function GoldETFWorldSection({ data, source }: GoldETFWorldSectionProps) {
  // Transform backend data to split Asia into China, India, Russia, Rest of Asia
  const transformedData = useMemo(() => transformEtfData(data), [data]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transformedData.forEach((point) => {
      if (point.date) months.add(point.date);
    });
    return Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [transformedData]);

  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || '');
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const monthlyData = useMemo(() => {
    const map = new Map<DisplayRegion, DisplayFlowPoint>();
    transformedData
      .filter((point) => point.date === selectedMonth)
      .forEach((point) => {
        map.set(point.region, point);
      });
    return map;
  }, [transformedData, selectedMonth]);

  const formatMonthLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleRegionHover = (region: DisplayRegion | null, regionData: DisplayFlowPoint | null) => {
    if (region && regionData) {
      setTooltipData({
        region,
        holdingsTonnes: regionData.holdingsTonnes,
        netFlowTonnes: regionData.netFlowTonnes,
      });
    } else {
      setTooltipData(null);
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatFlow = (num: number | null) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (!data || data.length === 0) {
    return (
      <section className="mt-20 mb-24">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-6 text-center">
            <Globe className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              ETF flow data is currently unavailable.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-20 mb-24">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-2">
          Global Gold ETF Flows ({source})
        </p>
        <p className="text-sm text-zinc-400">
          Regional gold ETF holdings and monthly net flows
        </p>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-xs text-zinc-500">Month:</span>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-zinc-900/50 text-sm text-zinc-200 hover:border-white/20 transition-colors"
          >
            {formatMonthLabel(selectedMonth)}
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-zinc-900 shadow-xl z-50">
              {availableMonths.map((month) => (
                <button
                  key={month}
                  onClick={() => {
                    setSelectedMonth(month);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors ${
                    month === selectedMonth ? 'text-amber-400 bg-zinc-800/50' : 'text-zinc-300'
                  }`}
                >
                  {formatMonthLabel(month)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[70%] relative">
          <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-4 backdrop-blur-sm overflow-hidden">
            <GoldETFWorldMap regionData={monthlyData} onRegionHover={handleRegionHover} />

            {tooltipData && (
              <div className="absolute top-6 left-6 rounded-lg border border-white/10 bg-zinc-900/95 p-3 shadow-xl backdrop-blur-sm z-10">
                <div className="text-xs font-medium text-zinc-300 mb-2">
                  {tooltipData.region}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Holdings:</span>
                    <span className="text-zinc-200 font-medium">
                      {formatNumber(tooltipData.holdingsTonnes)} tonnes
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Net Flow ({formatMonthLabel(selectedMonth)}):</span>
                    <span
                      className={`font-medium ${
                        tooltipData.netFlowTonnes !== null && tooltipData.netFlowTonnes > 0
                          ? 'text-emerald-400'
                          : tooltipData.netFlowTonnes !== null && tooltipData.netFlowTonnes < 0
                          ? 'text-rose-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {formatFlow(tooltipData.netFlowTonnes)} tonnes
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
              <span>Net Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-rose-600"></div>
              <span>Net Outflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-zinc-600"></div>
              <span>Neutral / No Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border border-white/20 bg-zinc-700"></div>
              <span>Country Highlight (CN, IN, RU)</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-500 text-center italic max-w-xl mx-auto">
            China, India, and Russia are shown separately due to their outsized influence on global gold demand. 
            Remaining countries are grouped regionally.
          </p>
        </div>

        <div className="lg:w-[30%]">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {DISPLAY_REGIONS.map((region) => {
              const regionPoint = monthlyData.get(region);
              return (
                <RegionSummaryCard
                  key={region}
                  region={region}
                  holdingsTonnes={regionPoint?.holdingsTonnes ?? null}
                  netFlowTonnes={regionPoint?.netFlowTonnes ?? null}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

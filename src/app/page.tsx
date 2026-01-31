export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { TrendingUp } from 'lucide-react';
import {
  getLatestGoldRisk,
  getLatestGoldPrice,
  getGoldPriceHistory,
  getIndicators,
  getLatestIndicatorValue,
  getLatestSignal,
  getIndicatorHistory,
} from '@/lib/api';
import { IndicatorWithData, SignalColor } from '@/lib/types';
import { getRelativeTime } from '@/lib/utils';
import { GoldPriceCard } from '@/components/cards/GoldPriceCard';
import { GoldRiskCard } from '@/components/cards/GoldRiskCard';
import { GoldDriversCard } from '@/components/cards/GoldDriversCard';
import { SnapshotRow } from '@/components/cards/SnapshotRow';
import { IndicatorCard } from '@/components/cards/IndicatorCard';
import { DashboardClient } from '@/components/DashboardClient';

async function fetchDashboardData() {
  const [goldPrice, goldPriceHistory, goldRisk, indicators] = await Promise.all([
    getLatestGoldPrice(),
    getGoldPriceHistory(30),
    getLatestGoldRisk(),
    getIndicators(),
  ]);

  const indicatorsWithData: IndicatorWithData[] = await Promise.all(
    indicators.map(async (indicator) => {
      const [latestValue, latestSignal, history] = await Promise.all([
        getLatestIndicatorValue(indicator.code),
        getLatestSignal(indicator.code),
        getIndicatorHistory(indicator.code, 30),
      ]);
      return {
        indicator,
        latestValue,
        latestSignal,
        history,
      };
    })
  );

  const realYieldData = indicatorsWithData.find(d => d.indicator.code === 'REAL_YIELD');
  const dxyData = indicatorsWithData.find(d => d.indicator.code === 'DXY');

  const realYieldSignal: SignalColor | null = realYieldData?.latestSignal?.signal || null;
  const dxySignal: SignalColor | null = dxyData?.latestSignal?.signal || null;
  const realYieldHistory = realYieldData?.history || [];
  const dxyHistory = dxyData?.history || [];

  return { 
    goldPrice, 
    goldPriceHistory,
    goldRisk, 
    indicatorsWithData, 
    realYieldSignal,
    dxySignal,
    realYieldHistory,
    dxyHistory,
  };
}

export default async function DashboardPage() {
  const { 
    goldPrice, 
    goldPriceHistory,
    goldRisk, 
    indicatorsWithData, 
    realYieldSignal,
    dxySignal,
    realYieldHistory,
    dxyHistory,
  } = await fetchDashboardData();

  return (
    <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section - Gold Price */}
      <section className="mb-16">
        {goldPrice && (
          <div className="flex items-center justify-end mb-4">
            <div className="text-xs text-zinc-500">
              Last updated: {getRelativeTime(goldPrice.updatedAt)}
            </div>
          </div>
        )}
        <GoldPriceCard data={goldPrice} history={goldPriceHistory} />
      </section>

      {/* Market Snapshot Section */}
      {(goldPriceHistory.length >= 2 || realYieldHistory.length >= 2 || dxyHistory.length >= 2) && (
        <section className="mb-16">
          <SnapshotRow 
            goldPriceHistory={goldPriceHistory}
            realYieldSignal={realYieldSignal}
            dxySignal={dxySignal}
            realYieldHistory={realYieldHistory}
            dxyHistory={dxyHistory}
          />
        </section>
      )}

      {/* Risk Overview & Drivers Section */}
      <section className="mb-16">
        <div className="space-y-4 mb-10">
          <GoldRiskCard data={goldRisk} />

          {goldRisk && (
            <DashboardClient goldRisk={goldRisk} />
          )}

          <GoldDriversCard 
            riskLevel={goldRisk?.riskLevel || null}
            realYieldSignal={realYieldSignal}
            dxySignal={dxySignal}
          />
        </div>
      </section>

      {/* Macro Indicators Section */}
      <section className="mt-12">
        {indicatorsWithData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {indicatorsWithData.map((data, index) => (
              <IndicatorCard key={data.indicator.code} data={data} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-7 text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              Macro signals are stabilizing — analysis will update as new data arrives
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

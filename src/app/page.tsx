export const dynamic = "force-dynamic";

import { Activity, BarChart3, TrendingUp } from 'lucide-react';
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

  let mostRecentDate: string | null = null;
  for (const ind of indicatorsWithData) {
    if (ind.history.length > 0) {
      const latestPoint = ind.history[ind.history.length - 1];
      if (!mostRecentDate || latestPoint.date > mostRecentDate) {
        mostRecentDate = latestPoint.date;
      }
    }
  }

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
    mostRecentDate,
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
    mostRecentDate,
    realYieldSignal,
    dxySignal,
    realYieldHistory,
    dxyHistory,
  } = await fetchDashboardData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-end">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Last updated: {getRelativeTime(mostRecentDate)}</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <section className="mb-6">
        <GoldPriceCard data={goldPrice} history={goldPriceHistory} />
      </section>

      <section className="mb-6">
        <SnapshotRow 
          goldPriceHistory={goldPriceHistory}
          realYieldSignal={realYieldSignal}
          dxySignal={dxySignal}
          realYieldHistory={realYieldHistory}
          dxyHistory={dxyHistory}
        />
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10">
            <Activity className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Risk Overview
            </h2>
            <p className="text-xs text-zinc-500">
              Current macro risk assessment for gold exposure
            </p>
          </div>
        </div>

        <GoldRiskCard data={goldRisk} />

        {goldRisk && (
          <div className="mt-3">
            <DashboardClient goldRisk={goldRisk} />
          </div>
        )}
      </section>

      <section className="mb-6">
        <GoldDriversCard 
          riskLevel={goldRisk?.riskLevel || null}
          realYieldSignal={realYieldSignal}
          dxySignal={dxySignal}
        />
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10">
            <BarChart3 className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Macro Indicators
            </h2>
            <p className="text-xs text-zinc-500">
              Key economic indicators and their current signals
            </p>
          </div>
        </div>

        {indicatorsWithData.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {indicatorsWithData.map((data, index) => (
              <IndicatorCard key={data.indicator.code} data={data} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
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

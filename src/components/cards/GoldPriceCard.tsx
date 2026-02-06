'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { GoldPrice, GoldPriceHistoryPoint } from '@/lib/types';
import { safePercentChange, formatPercentChange, formatAbsoluteChange, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { useLiveGoldPrice } from '@/hooks/useLiveGoldPrice';

function formatSecondsAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
}

function AnimatedLastDot({ cx, cy, index, dataLength }: CustomDotProps) {
  if (cx === undefined || cy === undefined || index === undefined) return null;
  if (index !== dataLength - 1) return null;
  
  return (
    <g>
      <motion.circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#FFD700"
        opacity={0.3}
        animate={{
          r: [6, 10, 6],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="#FFD700"
        stroke="#18181b"
        strokeWidth={1.5}
      />
    </g>
  );
}

interface GoldPriceCardProps {
  data: GoldPrice | null;
  history?: GoldPriceHistoryPoint[];
}

function getTrendInfo(changePercent: number | null): { label: string; color: string; icon: typeof TrendingUp } {
  if (changePercent === null) return { label: 'Flat', color: 'text-amber-400', icon: Minus };
  if (changePercent > 0.5) return { label: 'Rising', color: 'text-emerald-400', icon: TrendingUp };
  if (changePercent < -0.5) return { label: 'Falling', color: 'text-rose-400', icon: TrendingDown };
  return { label: 'Flat', color: 'text-amber-400', icon: Minus };
}

export function GoldPriceCard({ data, history = [] }: GoldPriceCardProps) {
  const { displayPrice, secondsAgo, isAnimating } = useLiveGoldPrice({
    price: data?.price ?? 0,
    updatedAt: data?.updatedAt ?? new Date().toISOString(),
    interpolationDurationMs: 120000,
  });

  const formattedPrice = useMemo(() => {
    return displayPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [displayPrice]);

  if (!data) {
    return (
      <Card className="w-full border-zinc-700/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-zinc-500">
            <Coins className="h-5 w-5" />
            <p className="text-sm">Gold price unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasChange = data.change !== undefined && data.change !== null && isFinite(data.change);
  const isPositive = hasChange && data.change! > 0;
  const isNegative = hasChange && data.change! < 0;

  const deltaColorClass = isPositive
    ? 'text-emerald-400'
    : isNegative
    ? 'text-rose-400'
    : 'text-zinc-400';

  const deltaIcon = isPositive ? '▲' : isNegative ? '▼' : '●';

  const formattedDailyChange = hasChange ? formatAbsoluteChange(data.change!) : null;
  const formattedDailyPercent = data.changePercent !== undefined && isFinite(data.changePercent)
    ? formatPercentChange(data.changePercent)
    : null;

  const chartData = history.filter(p => p.value !== null && p.value !== undefined && isFinite(p.value)).map((point) => ({
    date: point.date,
    value: point.value,
  }));

  const hasHistory = chartData.length >= 2;
  const latestHistoryDate = hasHistory ? chartData[chartData.length - 1].date : null;

  const thirtyDayChangePercent = hasHistory
    ? safePercentChange(chartData[chartData.length - 1].value, chartData[0].value)
    : null;

  const thirtyDayChange = hasHistory
    ? chartData[chartData.length - 1].value - chartData[0].value
    : null;

  const trendInfo = getTrendInfo(thirtyDayChangePercent);
  const TrendIcon = trendInfo.icon;

  const delta30DayIcon = thirtyDayChange !== null
    ? thirtyDayChange > 0 ? '▲' : thirtyDayChange < 0 ? '▼' : '●'
    : null;

  const delta30DayColorClass = thirtyDayChange !== null
    ? thirtyDayChange > 0 ? 'text-emerald-400' : thirtyDayChange < 0 ? 'text-rose-400' : 'text-amber-400'
    : 'text-zinc-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="w-full border-gold/20 bg-gradient-to-r from-zinc-900 to-zinc-900/80">
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10"
                >
                  <Coins className="h-6 w-6 text-gold" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Gold Spot Price
                    </span>
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.7, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                        Live
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <motion.span
                      className={cn(
                        'text-3xl font-bold text-gold transition-all duration-300',
                        isAnimating && 'drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]'
                      )}
                    >
                      ${formattedPrice}
                    </motion.span>
                    <span className="text-sm text-zinc-500">
                      {data.currency} / {data.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {(formattedDailyChange || formattedDailyPercent) && (
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">Daily</div>
                    <div className={cn('text-sm font-semibold', deltaColorClass)}>
                      {deltaIcon} {formattedDailyChange || '—'}
                      {formattedDailyPercent && (
                        <span className="ml-1 text-xs">({formattedDailyPercent})</span>
                      )}
                    </div>
                  </div>
                )}

                {hasHistory && (
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">30D Trend</div>
                    <div className={cn('text-sm font-semibold flex items-center gap-1', trendInfo.color)}>
                      <TrendIcon className="h-3.5 w-3.5" />
                      {trendInfo.label}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    Last updated:
                  </span>
                  <span className="text-xs text-gold font-medium">
                    {formatSecondsAgo(secondsAgo)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {hasHistory ? (
                <div>
                  <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="date" hide />
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: '#a1a1aa' }}
                          itemStyle={{ color: '#FFD700' }}
                          formatter={(value) => {
                            if (typeof value === 'number') {
                              return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Gold Price'];
                            }
                            return [value, 'Gold Price'];
                          }}
                          labelFormatter={(label) => {
                            const date = new Date(String(label));
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#FFD700"
                          strokeWidth={2}
                          dot={(props) => (
                            <AnimatedLastDot
                              {...props}
                              dataLength={chartData.length}
                            />
                          )}
                          activeDot={{
                            r: 4,
                            fill: '#FFD700',
                            stroke: '#18181b',
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-zinc-500">
                      30-day trend
                    </p>
                    <p className={cn('text-xs font-medium', delta30DayColorClass)}>
                      {delta30DayIcon} {formatPercentChange(thirtyDayChangePercent)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-20 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30">
                  <p className="text-xs text-zinc-500 text-center px-4">
                    Historical data unavailable from current provider
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

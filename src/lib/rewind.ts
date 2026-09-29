// Types and scoring for the Rewind Lab backtest.
// The JSON is produced by scripts/rewind/precompute_backtest.py.

export interface RewindModelInfo {
  id: string;
  label: string;
  license: string;
}

export interface RewindMeta {
  asset: string;
  unit: string;
  isSample: boolean;
  dataSource: string;
  model: RewindModelInfo;
  horizon: number;
  minContext: number;
  maxContext: number;
  stride: number;
  generatedAt: string;
}

export interface RewindPoint {
  date: string;
  value: number;
}

// Forecast step k (0-based) targets series[cutoffIndex + k + 1].
export interface RewindForecast {
  cutoffIndex: number;
  p10: number[];
  p50: number[];
  p90: number[];
}

export interface RewindData {
  meta: RewindMeta;
  series: RewindPoint[];
  forecasts: RewindForecast[];
}

export interface RewindOutcome {
  cutoffDate: string;
  cutoffPrice: number;
  targetDate: string;
  actual: number;
  median: number;
  low: number;
  high: number;
  modelError: number;
  naiveError: number;
  // Positive when the model was closer than "no change".
  edge: number;
  inRange: boolean;
  modelDirection: -1 | 0 | 1;
  actualDirection: -1 | 0 | 1;
}

export interface RewindScore {
  count: number;
  modelMae: number;
  naiveMae: number;
  // 1 - modelMae / naiveMae. Above 0 means the model beat "no change".
  skill: number;
  coverage: number;
  directionHitRate: number;
  modelCloserRate: number;
}

function direction(delta: number): -1 | 0 | 1 {
  return delta > 0 ? 1 : delta < 0 ? -1 : 0;
}

export function getOutcome(
  data: RewindData,
  forecast: RewindForecast,
  horizon: number
): RewindOutcome {
  const step = horizon - 1;
  const cutoff = data.series[forecast.cutoffIndex];
  const target = data.series[forecast.cutoffIndex + horizon];
  const median = forecast.p50[step];
  const modelError = Math.abs(median - target.value);
  const naiveError = Math.abs(cutoff.value - target.value);

  return {
    cutoffDate: cutoff.date,
    cutoffPrice: cutoff.value,
    targetDate: target.date,
    actual: target.value,
    median,
    low: forecast.p10[step],
    high: forecast.p90[step],
    modelError,
    naiveError,
    edge: naiveError - modelError,
    inRange: target.value >= forecast.p10[step] && target.value <= forecast.p90[step],
    modelDirection: direction(median - cutoff.value),
    actualDirection: direction(target.value - cutoff.value),
  };
}

export function scoreOutcomes(outcomes: RewindOutcome[]): RewindScore {
  const count = outcomes.length;
  if (count === 0) {
    return {
      count: 0,
      modelMae: 0,
      naiveMae: 0,
      skill: 0,
      coverage: 0,
      directionHitRate: 0,
      modelCloserRate: 0,
    };
  }

  let modelSum = 0;
  let naiveSum = 0;
  let inRange = 0;
  let hits = 0;
  let closer = 0;
  for (const o of outcomes) {
    modelSum += o.modelError;
    naiveSum += o.naiveError;
    if (o.inRange) inRange++;
    if (o.modelDirection === o.actualDirection) hits++;
    if (o.edge > 0) closer++;
  }

  const modelMae = modelSum / count;
  const naiveMae = naiveSum / count;
  return {
    count,
    modelMae,
    naiveMae,
    skill: naiveMae === 0 ? 0 : 1 - modelMae / naiveMae,
    coverage: inRange / count,
    directionHitRate: hits / count,
    modelCloserRate: closer / count,
  };
}

export function formatUsd(value: number, decimals = 0): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatPct(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

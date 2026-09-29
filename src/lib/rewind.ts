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

// Within this band the two are called a tie: the rewinds overlap heavily, so a 1-2% gap in
// average error is not a result.
const TIE_BAND = 0.02;

export type VerdictKind = 'tie' | 'model' | 'naive';

export interface Verdict {
  kind: VerdictKind;
  headline: string;
  margin: number;
}

export function getVerdict(score: RewindScore): Verdict {
  const margin = Math.abs(score.skill);
  if (margin < TIE_BAND) return { kind: 'tie', headline: 'A tie.', margin };
  return score.skill > 0
    ? { kind: 'model', headline: `The model wins by ${formatPct(margin)}.`, margin }
    : { kind: 'naive', headline: `"No change" wins by ${formatPct(margin)}.`, margin };
}

/**
 * Number of non-overlapping forecast windows the rewinds span. Neighbouring rewinds share most
 * of their future, so this - not the rewind count - is the sample size for significance.
 */
export function independentWindows(data: RewindData, horizon: number): number {
  const first = data.forecasts[0]?.cutoffIndex ?? 0;
  const last = data.forecasts[data.forecasts.length - 1]?.cutoffIndex ?? 0;
  return Math.max(1, Math.floor((last - first) / horizon) + 1);
}

/** True when a hit rate is within two standard errors of a coin flip. */
export function withinCoinFlipNoise(hitRate: number, windows: number): boolean {
  const standardError = Math.sqrt(0.25 / windows);
  return Math.abs(hitRate - 0.5) < 2 * standardError;
}

export interface RacePoint {
  date: string;
  // Running total of dollars by which the model's median was closer than "no change".
  lead: number;
  // lead split at zero, so each side can be filled in its own colour
  ahead: number;
  behind: number;
}

export function buildRace(outcomes: RewindOutcome[]): RacePoint[] {
  let lead = 0;
  return outcomes.map((o) => {
    lead += o.edge;
    return {
      date: o.cutoffDate,
      lead,
      ahead: Math.max(lead, 0),
      behind: Math.min(lead, 0),
    };
  });
}

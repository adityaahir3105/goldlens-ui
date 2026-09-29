// Gold Duel: you and a TimesFM-driven player split credits between gold and cash over a hidden
// stretch of real prices. The AI only ever sees the forecast made with data up to that day.

import { RewindData, RewindPoint } from './rewind';

export const START_CREDITS = 10_000;
export const ROUNDS = 10;
// Price history shown before the first round.
export const LOOKBACK = 60;
// How strongly the AI leans into its forecast: 0.5 + (P(up) - 0.5) * gain, clamped to 0..1.
export const AI_GAIN = 4;

/** One round's forecast, at the step that lands on the next round's price. */
export interface DuelForecast {
  cutoffIndex: number;
  // Series index of the next round's price, the day this forecast is scored on.
  targetIndex: number;
  low: number;
  median: number;
  high: number;
}

export interface DuelData {
  series: RewindPoint[];
  forecasts: DuelForecast[];
  modelLabel: string;
}

/** Keep only what the game needs from the backtest: one forecast step per rewind. */
export function toDuelData(data: RewindData): DuelData {
  const { forecasts } = data;
  const out: DuelForecast[] = [];
  for (let i = 0; i < forecasts.length - 1; i++) {
    const f = forecasts[i];
    const step = forecasts[i + 1].cutoffIndex - f.cutoffIndex - 1;
    if (step < 0 || step >= f.p50.length) continue;
    out.push({ cutoffIndex: f.cutoffIndex, targetIndex: f.cutoffIndex + step + 1, low: f.p10[step], median: f.p50[step], high: f.p90[step] });
  }
  return { series: data.series, forecasts: out, modelLabel: data.meta.model.label };
}

/**
 * Chance the price is higher at the next round, read off the forecast's 10th, 50th and 90th
 * percentiles with straight lines between them (and beyond, clamped to 2%..98%).
 */
export function chanceUp(f: DuelForecast, price: number): number {
  let cdf: number;
  if (price <= f.median) {
    cdf = f.median > f.low ? 0.1 + ((price - f.low) / (f.median - f.low)) * 0.4 : 0.5;
  } else {
    cdf = f.high > f.median ? 0.5 + ((price - f.median) / (f.high - f.median)) * 0.4 : 0.5;
  }
  return 1 - Math.min(Math.max(cdf, 0.02), 0.98);
}

/** Share of credits the AI keeps in gold, in steps of 10%. */
export function aiAllocation(pUp: number): number {
  const raw = 0.5 + (pUp - 0.5) * AI_GAIN;
  return Math.min(Math.max(Math.round(raw * 10) / 10, 0), 1);
}

export interface Portfolio {
  cash: number;
  // Value in credits of the gold held, at the current price.
  gold: number;
}

export const total = (p: Portfolio) => p.cash + p.gold;

/** Rebalance to a target gold share at the current price. */
export function rebalance(p: Portfolio, share: number): Portfolio {
  const t = total(p);
  return { cash: t * (1 - share), gold: t * share };
}

/** Let the price move: gold value scales, cash stays. */
export function applyMove(p: Portfolio, priceFrom: number, priceTo: number): Portfolio {
  return { cash: p.cash, gold: p.gold * (priceTo / priceFrom) };
}

/** A random first round that leaves room for the lookback and every round after it. */
export function randomStart(data: DuelData, rng: () => number = Math.random): number {
  const first = data.forecasts.findIndex((f) => f.cutoffIndex >= LOOKBACK);
  const last = data.forecasts.length - ROUNDS - 1;
  if (first < 0 || last < first) return 0;
  return first + Math.floor(rng() * (last - first + 1));
}

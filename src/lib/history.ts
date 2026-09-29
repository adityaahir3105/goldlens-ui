// Types and helpers for the History page.
// Prices come from src/data/history/gold-history.json (scripts/history/build_gold_history.py).

export interface HistoryPoint {
  // YYYY-MM. Before meta.monthlyFrom there is one point per year (January).
  d: string;
  // Nominal USD per troy ounce.
  v: number;
  // The same price in dollars of meta.realDollarsOf (CPI-U). Null before 1913.
  r: number | null;
}

export interface HistorySource {
  label: string;
  url: string;
}

export interface HistoryData {
  meta: {
    unit: string;
    monthlyFrom: number;
    realDollarsOf: string;
    sources: HistorySource[];
    generatedAt: string;
  };
  points: HistoryPoint[];
}

export type EventCategory = 'money' | 'conflict' | 'crisis' | 'market';

export const CATEGORY_META: Record<EventCategory, { label: string; color: string }> = {
  money: { label: 'Monetary policy', color: '#FFD700' },
  conflict: { label: 'War & geopolitics', color: '#F87171' },
  crisis: { label: 'Financial crisis', color: '#60A5FA' },
  market: { label: 'Market milestone', color: '#34D399' },
};

export interface HistoryEvent {
  id: string;
  // ISO date of the event.
  date: string;
  title: string;
  category: EventCategory;
  summary: string;
}

export interface UpcomingEvent {
  id: string;
  // ISO date the event starts, and optionally ends.
  start: string;
  end?: string;
  title: string;
  category: EventCategory;
  whyItMatters: string;
  source: HistorySource;
}

export interface OngoingSituation {
  id: string;
  since: string;
  title: string;
  category: EventCategory;
  status: string;
  source: HistorySource;
}

/** Index of the point an event falls in: its month, or its year before monthly data starts. */
export function pointIndexForDate(points: HistoryPoint[], date: string): number {
  const month = date.slice(0, 7);
  let best = 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i].d <= month) best = i;
    else break;
  }
  return best;
}

/** Point about 12 months after index i, or null if the data does not reach that far. */
export function pointAYearLater(points: HistoryPoint[], i: number): HistoryPoint | null {
  const [y, m] = points[i].d.split('-').map(Number);
  const target = `${y + 1}-${String(m).padStart(2, '0')}`;
  for (let j = i + 1; j < points.length; j++) {
    if (points[j].d >= target) return points[j];
  }
  return null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(d: string, annual: boolean): string {
  const [y, m] = d.split('-');
  return annual ? y : `${MONTHS[Number(m) - 1]} ${y}`;
}

export function eventDateLabel(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS[m - 1]} ${y}`;
}

/** Whole days from `from` to `to` (ISO dates), counted in UTC. */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

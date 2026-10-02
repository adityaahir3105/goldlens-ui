// Types and colours for the central-bank gold globe.

export interface GlobeEntry {
  // ISO 3166 numeric code as used by world-atlas, or a placeholder for countries too small for
  // the 110m map (these need lonLat).
  id: string;
  name: string;
  // Net change in official gold reserves, tonnes (negative means net selling), or total holdings
  // when the period's kind is 'holdings'.
  tonnes: number;
  note?: string;
  // Last month the figure covers (YYYY-MM); countries report at different times.
  asOf?: string;
  // Gold's share of the country's total reserves, percent (holdings only).
  sharePct?: number;
  // [longitude, latitude] for the spike; defaults to the country's centroid.
  lonLat?: [number, number];
}

export interface GlobePeriod {
  id: string;
  // 'change' (default): net buying or selling over the range. 'holdings': total tonnes held.
  kind?: 'change' | 'holdings';
  label: string;
  range: string;
  source: { label: string; url: string };
  // Where the hand-written country notes come from, when that differs from the data source.
  notesSource?: { label: string; url: string };
  entries: GlobeEntry[];
}

export const GLOBE_COLORS = {
  ocean: '#0b0b0f',
  land: '#27272a',
  border: '#3f3f46',
  graticule: 'rgba(255,255,255,0.05)',
  buy: '#FFD700',
  sell: '#F87171',
  rim: 'rgba(255,215,0,0.25)',
};

/** Fill for a country: gold for buyers, red for sellers, stronger with size (sqrt scale). */
export function entryFill(tonnes: number, maxAbs: number): string {
  if (tonnes === 0) return 'rgba(255,215,0,0.08)';
  const strength = maxAbs > 0 ? Math.sqrt(Math.abs(tonnes) / maxAbs) : 0;
  const alpha = 0.25 + 0.65 * strength;
  return tonnes >= 0 ? `rgba(255,215,0,${alpha.toFixed(3)})` : `rgba(248,113,113,${alpha.toFixed(3)})`;
}

export function formatTonnes(tonnes: number, signed = true): string {
  const sign = !signed ? '' : tonnes > 0 ? '+' : tonnes < 0 ? '−' : '';
  const abs = Math.abs(tonnes);
  // Whole tonnes for big holders, two decimals for small ones so they do not all read as 0t.
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: digits })}t`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-06' -> 'Jun 2026'. */
export function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

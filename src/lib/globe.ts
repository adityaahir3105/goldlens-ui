// Types and colours for the central-bank gold globe.

export interface GlobeEntry {
  // ISO 3166 numeric code as used by world-atlas, or a placeholder for countries too small for
  // the 110m map (these need lonLat).
  id: string;
  name: string;
  // Net change in official gold reserves, tonnes. Negative means net selling.
  tonnes: number;
  note?: string;
  // [longitude, latitude] for the spike; defaults to the country's centroid.
  lonLat?: [number, number];
}

export interface GlobePeriod {
  id: string;
  label: string;
  range: string;
  source: { label: string; url: string };
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
  const strength = maxAbs > 0 ? Math.sqrt(Math.abs(tonnes) / maxAbs) : 0;
  const alpha = 0.25 + 0.65 * strength;
  return tonnes >= 0 ? `rgba(255,215,0,${alpha.toFixed(3)})` : `rgba(248,113,113,${alpha.toFixed(3)})`;
}

export function formatTonnes(tonnes: number): string {
  const sign = tonnes > 0 ? '+' : tonnes < 0 ? '−' : '';
  return `${sign}${Math.abs(tonnes).toLocaleString('en-US')}t`;
}

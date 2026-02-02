import { EtfFlowPoint, DisplayFlowPoint, DisplayRegion } from './types';

/**
 * Transforms backend ETF flow data to split Asia into:
 * - China
 * - India  
 * - Russia
 * - Rest of Asia
 * 
 * This allows for country-level visualization of key gold demand drivers.
 */

// TODO: Replace with official country-level WGC data when available from backend
// These are placeholder allocation percentages based on approximate market share
// Source: World Gold Council ETF data suggests these rough proportions within Asia
const ASIA_ALLOCATION = {
  China: 0.45,      // ~45% of Asia ETF holdings (largest Asian market)
  India: 0.25,      // ~25% of Asia ETF holdings (growing market)
  Russia: 0.05,     // ~5% of Asia ETF holdings (smaller but significant)
  RestOfAsia: 0.25, // ~25% remainder (Japan, South Korea, etc.)
} as const;

export const DISPLAY_REGIONS: DisplayRegion[] = [
  'China',
  'India',
  'Russia',
  'Rest of Asia',
  'Europe',
  'North America',
  'Other',
];

function allocateValue(total: number | null, percentage: number): number | null {
  if (total === null || total === undefined || isNaN(total)) {
    return null;
  }
  return Math.round(total * percentage * 100) / 100;
}

export function transformEtfData(points: EtfFlowPoint[]): DisplayFlowPoint[] {
  const result: DisplayFlowPoint[] = [];

  for (const point of points) {
    if (point.region === 'Asia') {
      // TODO: Replace with official country-level WGC data
      // Split Asia into China, India, Russia, and Rest of Asia
      result.push({
        date: point.date,
        region: 'China',
        holdingsTonnes: allocateValue(point.holdingsTonnes, ASIA_ALLOCATION.China),
        netFlowTonnes: allocateValue(point.netFlowTonnes, ASIA_ALLOCATION.China),
      });

      result.push({
        date: point.date,
        region: 'India',
        holdingsTonnes: allocateValue(point.holdingsTonnes, ASIA_ALLOCATION.India),
        netFlowTonnes: allocateValue(point.netFlowTonnes, ASIA_ALLOCATION.India),
      });

      result.push({
        date: point.date,
        region: 'Russia',
        holdingsTonnes: allocateValue(point.holdingsTonnes, ASIA_ALLOCATION.Russia),
        netFlowTonnes: allocateValue(point.netFlowTonnes, ASIA_ALLOCATION.Russia),
      });

      result.push({
        date: point.date,
        region: 'Rest of Asia',
        holdingsTonnes: allocateValue(point.holdingsTonnes, ASIA_ALLOCATION.RestOfAsia),
        netFlowTonnes: allocateValue(point.netFlowTonnes, ASIA_ALLOCATION.RestOfAsia),
      });
    } else {
      // Pass through Europe, North America, Other unchanged
      result.push({
        date: point.date,
        region: point.region as DisplayRegion,
        holdingsTonnes: point.holdingsTonnes,
        netFlowTonnes: point.netFlowTonnes,
      });
    }
  }

  return result;
}

// Map country names to display regions for map rendering
export function getDisplayRegionForCountry(countryName: string): DisplayRegion {
  // Priority countries - shown separately
  if (countryName === 'China') return 'China';
  if (countryName === 'India') return 'India';
  if (countryName === 'Russia' || countryName === 'Russian Federation') return 'Russia';

  // North America
  const northAmerica = ['United States of America', 'Canada', 'Mexico'];
  if (northAmerica.includes(countryName)) return 'North America';

  // Europe
  const europe = [
    'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Portugal',
    'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Ireland', 'Poland', 'Czech Republic', 'Greece',
    'Hungary', 'Romania', 'Bulgaria', 'Slovakia', 'Croatia', 'Slovenia',
    'Lithuania', 'Latvia', 'Estonia', 'Luxembourg', 'Iceland', 'Ukraine',
    'Belarus', 'Serbia', 'Albania', 'North Macedonia', 'Montenegro', 'Kosovo',
    'Bosnia and Herzegovina', 'Moldova',
  ];
  if (europe.includes(countryName)) return 'Europe';

  // Rest of Asia (excluding China, India, Russia)
  const restOfAsia = [
    'Japan', 'South Korea', 'Taiwan', 'Singapore', 'Hong Kong', 
    'Thailand', 'Malaysia', 'Indonesia', 'Philippines', 'Vietnam', 
    'Pakistan', 'Bangladesh', 'Sri Lanka', 'Myanmar', 'Nepal',
    'Cambodia', 'Laos', 'Mongolia', 'Kazakhstan', 'Uzbekistan',
    'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan',
    'Iran', 'Iraq', 'Saudi Arabia', 'United Arab Emirates', 'Qatar',
    'Kuwait', 'Bahrain', 'Oman', 'Yemen', 'Jordan', 'Lebanon', 'Syria',
    'Israel', 'Turkey', 'Azerbaijan', 'Georgia', 'Armenia',
  ];
  if (restOfAsia.includes(countryName)) return 'Rest of Asia';

  // Everything else
  return 'Other';
}

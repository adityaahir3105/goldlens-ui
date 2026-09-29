import { GlobePeriod } from '@/lib/globe';

// Net change in official gold reserves, in tonnes, as reported by the World Gold Council
// (compiled from IMF IFS and central-bank releases). Only countries named in the WGC summaries
// cited below are included; a country missing here is "not reported", not zero. WGC revises
// these figures, so treat them as rounded and as of the date reviewed.
export const GLOBE_REVIEWED = '2026-09-29';

export const GLOBE_PERIODS: GlobePeriod[] = [
  {
    id: '2026',
    label: '2026 so far',
    range: 'January to July 2026',
    source: {
      label: 'World Gold Council, central bank statistics (Sep 2026)',
      url: 'https://www.gold.org/goldhub/gold-focus/2026/09/central-bank-gold-statistics-central-banks-make-positive-headlines-gold',
    },
    entries: [
      { id: '616', name: 'Poland', tonnes: 90, note: 'Holdings reached 640t, against a 700t target.' },
      { id: '156', name: 'China', tonnes: 60, note: 'July was its 21st straight month of buying.' },
      { id: '860', name: 'Uzbekistan', tonnes: 40 },
      { id: '398', name: 'Kazakhstan', tonnes: 29 },
      { id: '643', name: 'Russia', tonnes: -50, note: 'Sold to help cover a budget deficit. Holdings: 2,277t.' },
      { id: '792', name: 'Turkey', tonnes: -85, note: 'Most of the selling came in the first quarter.' },
    ],
  },
  {
    id: '2025',
    label: '2025',
    range: 'Full year 2025',
    source: {
      label: 'World Gold Council, Gold Demand Trends full year 2025',
      url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2025/central-banks',
    },
    entries: [
      { id: '616', name: 'Poland', tonnes: 102, note: 'Largest buyer for the second year running. Holdings: 550t.' },
      { id: '398', name: 'Kazakhstan', tonnes: 57, note: 'Its biggest annual purchase in records back to 1993.' },
      { id: '076', name: 'Brazil', tonnes: 43, note: 'First purchases since 2021, all between September and November.' },
      { id: '031', name: 'Azerbaijan', tonnes: 38, note: 'Bought by the State Oil Fund (SOFAZ), not the central bank.' },
      { id: '156', name: 'China', tonnes: 27 },
      { id: '792', name: 'Turkey', tonnes: 27 },
      { id: '203', name: 'Czechia', tonnes: 20, note: 'Holdings: 72t, aiming for 100t by 2028.' },
      { id: '356', name: 'India', tonnes: 4, note: 'Down from 73t in 2024, its smallest purchase in eight years.' },
      { id: '643', name: 'Russia', tonnes: -6 },
      { id: '288', name: 'Ghana', tonnes: -12 },
      { id: 'SGP', name: 'Singapore', tonnes: -26, lonLat: [103.82, 1.35], note: 'Largest seller of the year.' },
    ],
  },
  {
    id: '2024',
    label: '2024',
    range: 'Full year 2024',
    source: {
      label: 'World Gold Council, Gold Demand Trends full year 2024',
      url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2024/central-banks',
    },
    entries: [
      { id: '616', name: 'Poland', tonnes: 90, note: 'Largest buyer of the year.' },
      { id: '792', name: 'Turkey', tonnes: 75, note: 'Includes gold held by the Treasury.' },
      { id: '356', name: 'India', tonnes: 73, note: 'Holdings reached 876t.' },
      { id: '156', name: 'China', tonnes: 44 },
      { id: '368', name: 'Iraq', tonnes: 20 },
      { id: 'SGP', name: 'Singapore', tonnes: -10, lonLat: [103.82, 1.35] },
      { id: '398', name: 'Kazakhstan', tonnes: -10 },
      { id: '608', name: 'Philippines', tonnes: -29, note: 'Largest seller of the year, citing high prices.' },
    ],
  },
];

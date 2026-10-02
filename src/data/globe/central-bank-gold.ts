import { GlobeEntry, GlobePeriod } from '@/lib/globe';
import reserves from './gold-reserves.json';

// Official gold reserves per country, in tonnes, from the World Gold Council's "gold reserves by
// country" table (IMF IFS data). gold-reserves.json holds one snapshot per month listed in
// `months` (built by scripts/globe/build_gold_reserves.py); null means the country had not
// reported for that month. Holdings and net changes below are all derived from it, so a country
// missing from a tab did not report, which is not the same as zero.
export const GLOBE_REVIEWED = '2026-10-02';

interface ReserveCountry {
  id: string;
  name: string;
  lonLat?: number[];
  tonnes: (number | null)[];
  sharePct?: number;
}

const MONTHS: string[] = reserves.months;
const COUNTRIES = reserves.countries as ReserveCountry[];
const LATEST = MONTHS[MONTHS.length - 1];

const SOURCE = {
  label: 'World Gold Council, gold reserves by country (IMF IFS data)',
  url: 'https://www.gold.org/goldhub/data/gold-reserves-by-country',
};

// Changes smaller than this are revaluation and rounding noise, shown as no change.
const NOISE_TONNES = 0.05;

/** Index of the last reported month at or before `upTo`, after `after`; -1 if none. */
function lastReported(c: ReserveCountry, after = -1, upTo = MONTHS.length - 1): number {
  for (let i = upTo; i > after; i--) if (c.tonnes[i] !== null) return i;
  return -1;
}

const base = (c: ReserveCountry) => ({
  id: c.id,
  name: c.name,
  ...(c.lonLat ? { lonLat: c.lonLat as [number, number] } : {}),
});

/** Latest reported holdings per country. */
function holdings(notes: Record<string, string>): GlobeEntry[] {
  return COUNTRIES.flatMap((c) => {
    const i = lastReported(c);
    if (i < 0) return [];
    return [{ ...base(c), tonnes: c.tonnes[i]!, asOf: MONTHS[i], sharePct: c.sharePct, note: notes[c.id] }];
  });
}

/**
 * Net change from `from` to `to`. With `to` omitted, each country runs to the latest month it
 * has reported after `from`.
 */
function change(from: string, to: string | undefined, notes: Record<string, string>): GlobeEntry[] {
  const a = MONTHS.indexOf(from);
  return COUNTRIES.flatMap((c) => {
    const start = c.tonnes[a];
    const b = to ? MONTHS.indexOf(to) : lastReported(c, a);
    const end = b > a ? c.tonnes[b] : null;
    if (start === null || end === null) return [];
    const delta = Math.round((end - start) * 100) / 100;
    const partial = MONTHS[b] !== LATEST && !to ? `Through ${monthName(MONTHS[b])}; later months not reported yet.` : '';
    const note = [notes[c.id], partial].filter(Boolean).join(' ') || undefined;
    return [{ ...base(c), tonnes: Math.abs(delta) < NOISE_TONNES ? 0 : delta, asOf: MONTHS[b], note }];
  });
}

function monthName(yearMonth: string): string {
  return new Date(`${yearMonth}-01T00:00:00Z`).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
}

function year(y: number, notes: Record<string, string> = {}, notesSource?: GlobePeriod['notesSource']): GlobePeriod {
  return {
    id: String(y),
    label: String(y),
    range: `Full year ${y}`,
    source: SOURCE,
    notesSource,
    entries: change(`${y - 1}-12`, `${y}-12`, notes),
  };
}

export const GLOBE_PERIODS: GlobePeriod[] = [
  {
    id: 'holdings',
    kind: 'holdings',
    label: 'Total holdings',
    range: 'Latest reported holdings',
    source: SOURCE,
    entries: holdings({
      '031': 'Central bank only. The State Oil Fund (SOFAZ) also holds gold, which is not counted here.',
    }),
  },
  {
    id: '2026',
    label: '2026 so far',
    range: `January to ${monthName(LATEST)} ${LATEST.slice(0, 4)}`,
    source: SOURCE,
    notesSource: {
      label: 'WGC central bank statistics (Sep 2026)',
      url: 'https://www.gold.org/goldhub/gold-focus/2026/09/central-bank-gold-statistics-central-banks-make-positive-headlines-gold',
    },
    entries: change('2025-12', undefined, {
      '616': 'Holdings: 632t at the end of June, against a 700t target.',
      '156': 'Bought in every month of the year so far.',
      '643': 'Sold to help cover a budget deficit.',
      '792': 'Most of the selling came in the first quarter.',
    }),
  },
  year(
    2025,
    {
      '616': 'Largest buyer for the second year running. Holdings: 550t.',
      '398': 'Its biggest annual purchase in records back to 1993.',
      '076': 'First purchases since 2021, all between September and November.',
      '203': 'Holdings: 72t, aiming for 100t by 2028.',
      '356': 'Down from 73t in 2024, its smallest purchase in eight years.',
      SGP: 'Largest seller of the year.',
    },
    {
      label: 'WGC Gold Demand Trends full year 2025',
      url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2025/central-banks',
    }
  ),
  year(
    2024,
    {
      '616': 'Largest buyer of the year.',
      '792': "Central bank only. The WGC's demand report, which also counts Treasury gold, puts it at 75t.",
      '356': 'Holdings reached 876t.',
      '608': 'Largest seller of the year, citing high prices.',
    },
    {
      label: 'WGC Gold Demand Trends full year 2024',
      url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2024/central-banks',
    }
  ),
  year(2023),
  year(2022),
  year(2021),
];

import { OngoingSituation, UpcomingEvent } from '@/lib/history';

// Scheduled events only: every date here was published by an organiser or government.
// "Why it matters" describes a channel to gold, not a prediction. Past events hide themselves
// on the page; review this list whenever it runs low.
export const UPCOMING_REVIEWED = '2026-09-29';

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: 'brazil-election',
    start: '2026-10-04',
    title: 'Brazil general election',
    category: 'conflict',
    whyItMatters:
      'Brazil’s central bank returned to gold buying in 2025. A runoff, if needed, is on 25 October.',
    source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/2026_Brazilian_general_election' },
  },
  {
    id: 'israel-election',
    start: '2026-10-27',
    title: 'Israel Knesset election',
    category: 'conflict',
    whyItMatters: 'Held during the war with Iran. A change in government could change the course of the conflict.',
    source: { label: 'The Times of Israel', url: 'https://www.timesofisrael.com/judge-sets-date-for-next-scheduled-elections-for-october-2026/' },
  },
  {
    id: 'fomc-oct',
    start: '2026-10-27',
    end: '2026-10-28',
    title: 'Fed rate decision (FOMC)',
    category: 'money',
    whyItMatters:
      'Gold pays no interest, so the path of US rates is one of its biggest drivers. Rate-cut hopes faded this year as oil pushed inflation up.',
    source: { label: 'Federal Reserve', url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm' },
  },
  {
    id: 'us-midterms',
    start: '2026-11-03',
    title: 'US midterm elections',
    category: 'conflict',
    whyItMatters: 'Control of Congress shapes US spending, deficits and trade policy, which feed into the dollar and yields.',
    source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/2026_United_States_elections' },
  },
  {
    id: 'apec',
    start: '2026-11-18',
    end: '2026-11-19',
    title: 'APEC leaders’ meeting, Shenzhen',
    category: 'conflict',
    whyItMatters: 'Another chance for US and Chinese leaders to meet while their trade truce is still temporary.',
    source: { label: 'CGTN', url: 'https://news.cgtn.com/news/2025-12-13/2026-APEC-meeting-to-be-held-Nov-18-19-in-Shenzhen-China-1J43L2Fb2w0/index.html' },
  },
  {
    id: 'fomc-dec',
    start: '2026-12-08',
    end: '2026-12-09',
    title: 'Fed rate decision and projections',
    category: 'money',
    whyItMatters: 'Comes with new rate projections, the market’s best read on how many cuts, or hikes, lie ahead.',
    source: { label: 'Federal Reserve', url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm' },
  },
  {
    id: 'us-funding',
    start: '2026-12-11',
    title: 'US government funding runs out',
    category: 'money',
    whyItMatters: 'The stopgap funding law expires. A shutdown fight can weigh on the dollar and lift demand for havens.',
    source: { label: 'Congress.gov (CRS)', url: 'https://www.congress.gov/crs-product/R49353' },
  },
  {
    id: 'g20-miami',
    start: '2026-12-14',
    end: '2026-12-15',
    title: 'G20 leaders’ summit, Miami',
    category: 'conflict',
    whyItMatters: 'The largest economies meet with an energy shock, trade tensions and the Iran war on the table.',
    source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/2026_G20_Miami_summit' },
  },
  {
    id: 'us-china-truce',
    start: '2027-01-10',
    title: 'US–China trade truce expires',
    category: 'conflict',
    whyItMatters:
      'Extended by two months in September. If it lapses, tariffs and export controls can snap back, and gold rallied during past trade escalations.',
    source: { label: 'CNBC', url: 'https://www.cnbc.com/2026/09/24/us-china-trade-truce-bessent-trump-xi.html' },
  },
];

export const ONGOING_SITUATIONS: OngoingSituation[] = [
  {
    id: 'iran-war',
    since: '2026-02-28',
    title: 'War with Iran and the Strait of Hormuz',
    category: 'conflict',
    status:
      'A ceasefire collapsed on 8 July. As of late September the strait was reported closed and talks were indirect. It is the main reason oil, and with it inflation, is high.',
    source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/2026_Iran_war_ceasefire' },
  },
  {
    id: 'central-banks',
    since: '2022-02-24',
    title: 'Central banks are still buying',
    category: 'market',
    status:
      'Poland, China, Uzbekistan and Kazakhstan led buying in 2026 to July, while Turkey and Russia sold. See the globe on the dashboard.',
    source: { label: 'World Gold Council', url: 'https://www.gold.org/goldhub/gold-focus/2026/09/central-bank-gold-statistics-central-banks-make-positive-headlines-gold' },
  },
];

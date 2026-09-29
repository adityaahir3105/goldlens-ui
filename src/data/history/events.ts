import { HistoryEvent } from '@/lib/history';

// Curated turning points. Keep summaries factual: dates and levels here are widely reported;
// anything about the price path is also visible in the chart data itself.
export const HISTORY_EVENTS: HistoryEvent[] = [
  {
    id: 'california-gold-rush',
    date: '1848-01-24',
    title: 'California Gold Rush',
    category: 'market',
    summary:
      'Gold is found at Sutter’s Mill and a flood of new metal follows. The price barely moves: under the gold standard it was fixed by law, so supply shocks showed up in money and prices elsewhere, not in gold.',
  },
  {
    id: 'eo-6102',
    date: '1933-04-05',
    title: 'US orders private gold handed in',
    category: 'money',
    summary:
      'Executive Order 6102 requires Americans to deliver most of their gold coins, bullion and certificates to the Federal Reserve during the Great Depression.',
  },
  {
    id: 'gold-reserve-act',
    date: '1934-01-30',
    title: 'Gold Reserve Act: $20.67 becomes $35',
    category: 'money',
    summary:
      'The US revalues gold from $20.67 to $35 an ounce, a devaluation of the dollar of about 41%. $35 would hold for the next 37 years.',
  },
  {
    id: 'bretton-woods',
    date: '1944-07-22',
    title: 'Bretton Woods',
    category: 'money',
    summary:
      'Allied nations agree a post-war system: currencies pegged to the dollar, and the dollar convertible into gold at $35 for foreign governments.',
  },
  {
    id: 'london-gold-pool',
    date: '1968-03-17',
    title: 'London Gold Pool collapses',
    category: 'money',
    summary:
      'Central banks give up defending $35 in the private market. A two-tier system begins: official deals at $35, while the market price is free to rise.',
  },
  {
    id: 'nixon-shock',
    date: '1971-08-15',
    title: 'Nixon closes the gold window',
    category: 'money',
    summary:
      'The US stops converting dollars into gold for foreign governments, ending Bretton Woods. From here gold floats, and the chart stops being flat.',
  },
  {
    id: 'us-ownership',
    date: '1974-12-31',
    title: 'Americans may own gold again',
    category: 'money',
    summary: 'Private ownership of gold bullion becomes legal in the US for the first time since 1933.',
  },
  {
    id: 'peak-1980',
    date: '1980-01-21',
    title: 'The 1980 peak: $850',
    category: 'conflict',
    summary:
      'After the Iranian revolution, the US embassy hostage crisis and the Soviet invasion of Afghanistan, with US inflation in double digits, gold fixes at $850. Paul Volcker’s Fed then pushed interest rates towards 20%, and gold spent the next two decades in a bear market.',
  },
  {
    id: 'browns-bottom',
    date: '1999-05-07',
    title: 'UK announces gold sales',
    category: 'market',
    summary:
      'The UK Treasury says it will sell more than half of Britain’s gold reserves by auction. Gold falls to a 20-year low that summer, near the bottom of the long bear market.',
  },
  {
    id: 'washington-agreement',
    date: '1999-09-26',
    title: 'Washington Agreement on Gold',
    category: 'money',
    summary:
      'Fifteen European central banks agree to cap their combined gold sales at 400 tonnes a year for five years, calming fears of unlimited official selling.',
  },
  {
    id: 'sept-11',
    date: '2001-09-11',
    title: 'September 11 attacks',
    category: 'conflict',
    summary:
      'Terror attacks on the US. Gold jumps on the day, and the early 2000s mark the start of a decade-long bull market.',
  },
  {
    id: 'gld-launch',
    date: '2004-11-18',
    title: 'First big US gold ETF launches',
    category: 'market',
    summary:
      'SPDR Gold Shares (GLD) lists on the New York Stock Exchange, letting investors buy gold as easily as a stock. ETFs become a major new source of demand.',
  },
  {
    id: 'lehman',
    date: '2008-09-15',
    title: 'Lehman Brothers collapses',
    category: 'crisis',
    summary:
      'The global financial crisis peaks. Gold is sold at first as investors scramble for cash, then recovers as central banks respond.',
  },
  {
    id: 'qe1',
    date: '2008-11-25',
    title: 'The Fed starts quantitative easing',
    category: 'money',
    summary:
      'The Federal Reserve announces large-scale asset purchases. Near-zero rates and money printing lower the cost of holding a metal that pays no interest.',
  },
  {
    id: 'peak-2011',
    date: '2011-09-05',
    title: 'Record near $1,900 after US downgrade',
    category: 'crisis',
    summary:
      'A month after S&P strips the US of its AAA rating, amid the euro-zone debt crisis, gold reaches a record near $1,900. It would not be beaten until 2020.',
  },
  {
    id: 'crash-2013',
    date: '2013-04-15',
    title: 'The 2013 crash',
    category: 'market',
    summary:
      'Gold falls about 13% over two trading sessions as investors bet on the Fed winding down stimulus. 2013 ends as gold’s worst year since 1981.',
  },
  {
    id: 'first-hike-2015',
    date: '2015-12-16',
    title: 'First Fed rate hike since 2006',
    category: 'money',
    summary: 'The Fed raises rates for the first time in almost a decade, with gold near a six-year low around $1,050.',
  },
  {
    id: 'covid-2020',
    date: '2020-08-06',
    title: 'Pandemic record above $2,060',
    category: 'crisis',
    summary:
      'Emergency rate cuts and stimulus during COVID-19 push real interest rates below zero, and gold sets a new record, finally beating 2011.',
  },
  {
    id: 'ukraine-2022',
    date: '2022-02-24',
    title: 'Russia invades Ukraine',
    category: 'conflict',
    summary:
      'Western governments freeze a large part of Russia’s central-bank reserves. Many central banks respond by buying gold, which no one can freeze: official purchases top 1,000 tonnes in each of 2022, 2023 and 2024.',
  },
  {
    id: 'fed-hikes-2022',
    date: '2022-03-16',
    title: 'The Fed starts its fastest hiking cycle in decades',
    category: 'money',
    summary:
      'Rates rise from near zero to above 5% in about 16 months. Gold slips but holds up far better than bonds, helped by central-bank buying.',
  },
  {
    id: 'svb-2023',
    date: '2023-03-10',
    title: 'Silicon Valley Bank fails',
    category: 'crisis',
    summary: 'A run on SVB sparks a regional banking scare in the US, and gold climbs back towards its record.',
  },
  {
    id: 'breakout-2024',
    date: '2024-03-04',
    title: 'Breakout to new records',
    category: 'market',
    summary:
      'Gold breaks above $2,100 and keeps setting records through 2024, even while US real interest rates stay high, a break from its old relationship with yields.',
  },
  {
    id: 'tariffs-2025',
    date: '2025-04-02',
    title: '“Liberation Day” tariffs',
    category: 'conflict',
    summary:
      'Sweeping US tariffs rattle markets. Gold, which crossed $3,000 in mid-March, touches $3,500 intraday on 22 April.',
  },
  {
    id: 'four-thousand',
    date: '2025-10-08',
    title: 'Gold crosses $4,000',
    category: 'market',
    summary:
      'Gold tops $4,000 an ounce for the first time and reaches a record near $4,380 on 20 October. The next day it falls more than 6%, its steepest one-day drop since 2013.',
  },
  {
    id: 'warsh-2026',
    date: '2026-01-30',
    title: 'Peak near $5,600, then a crash',
    category: 'money',
    summary:
      'After a 25%-plus January, gold touches about $5,600 on 29 January. The next day President Trump names Kevin Warsh as Fed chair, seen as less keen on rate cuts; gold plunges and silver has its worst day since 1980.',
  },
  {
    id: 'iran-war-2026',
    date: '2026-02-28',
    title: 'US and Israel strike Iran',
    category: 'conflict',
    summary:
      'War with Iran begins and shipping through the Strait of Hormuz is disrupted, sending oil sharply higher. Gold jumps at first.',
  },
  {
    id: 'slide-2026',
    date: '2026-06-25',
    title: 'Oil-driven inflation drags gold to about $4,000',
    category: 'money',
    summary:
      'Higher oil prices lift US inflation and push out hopes of rate cuts, with Warsh now chair. Higher real yields and a firmer dollar pull gold back to around $4,000, more than 25% below its January peak.',
  },
];

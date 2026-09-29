import type { Metadata } from 'next';
import { Landmark } from 'lucide-react';
import history from '@/data/history/gold-history.json';
import { HISTORY_EVENTS } from '@/data/history/events';
import { HistoryData } from '@/lib/history';
import { GoldHistory } from '@/components/history/GoldHistory';
import { UpcomingEvents } from '@/components/history/UpcomingEvents';

export const metadata: Metadata = {
  title: 'History | GoldLens',
  description: 'Gold prices since 1833 with the events that moved them, and the scheduled events to watch next.',
};

const data = history as HistoryData;

export default function HistoryPage() {
  return (
    <div className="w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gold">
          <Landmark className="h-4 w-4" />
          History
        </div>
        <h2 className="mt-2 text-3xl font-bold text-zinc-100">Gold since 1833</h2>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-zinc-200">
          For almost 140 years the price barely moved, except when governments reset it. Then the gold standard
          ended, and every war, crisis and policy shift began to show up in the chart.
        </p>
      </section>

      <GoldHistory data={data} events={HISTORY_EVENTS} />

      <UpcomingEvents />

      <div className="mt-12 space-y-1 text-center text-xs text-zinc-600">
        <p>
          Prices:{' '}
          {data.meta.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400">
                {s.label}
              </a>
            </span>
          ))}
          .
        </p>
        <p>Nothing here is a forecast or investment advice.</p>
      </div>
    </div>
  );
}

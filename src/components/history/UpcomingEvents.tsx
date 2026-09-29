'use client';

import { useSyncExternalStore } from 'react';
import { CalendarClock, ExternalLink, Radio } from 'lucide-react';
import { CATEGORY_META, daysBetween, eventDateLabel } from '@/lib/history';
import { ONGOING_SITUATIONS, UPCOMING_EVENTS, UPCOMING_REVIEWED } from '@/data/history/upcoming';

function isoToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function noopSubscribe(): () => void {
  return () => {};
}

function countdown(days: number): string {
  if (days <= 0) return 'Now';
  if (days === 1) return 'Tomorrow';
  if (days < 60) return `In ${days} days`;
  return `In ${Math.round(days / 30.4)} months`;
}

function rangeLabel(start: string, end?: string): string {
  if (!end) return eventDateLabel(start);
  const [, sm, sd] = start.split('-');
  const [, em] = end.split('-');
  if (sm === em) return `${Number(sd)}–${eventDateLabel(end)}`;
  return `${eventDateLabel(start)} – ${eventDateLabel(end)}`;
}

export function UpcomingEvents() {
  // The page is static, so "today" is read in the browser; the server render uses the review date.
  const today = useSyncExternalStore(noopSubscribe, isoToday, () => UPCOMING_REVIEWED);

  const upcoming = UPCOMING_EVENTS.filter((e) => (e.end ?? e.start) >= today);

  return (
    <section className="mt-16">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
          <CalendarClock className="h-4 w-4" />
          What comes next
        </p>
        <h2 className="text-2xl font-bold text-zinc-100">Upcoming events to watch</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Scheduled political and policy events that can move gold. Each note describes how an event can reach gold,
          not a forecast.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <ol className="relative space-y-3 border-l border-zinc-800 pl-6 lg:col-span-2">
          {upcoming.map((e) => {
            const days = daysBetween(today, e.start);
            const color = CATEGORY_META[e.category].color;
            return (
              <li key={e.id} className="relative">
                <span
                  className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-zinc-950"
                  style={{ background: color }}
                />
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-xs text-zinc-400">
                      {rangeLabel(e.start, e.end)}
                      <span className="mx-1.5 text-zinc-600">·</span>
                      <span style={{ color }}>{CATEGORY_META[e.category].label}</span>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                      {countdown(days)}
                    </span>
                  </div>
                  <h3 className="mt-1 font-semibold text-zinc-100">{e.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{e.whyItMatters}</p>
                  <a
                    href={e.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-gold"
                  >
                    {e.source.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
            );
          })}
          {upcoming.length === 0 && (
            <li className="text-sm text-zinc-500">No scheduled events left in this list. It needs a refresh.</li>
          )}
        </ol>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Radio className="h-4 w-4 text-rose-400" />
            Ongoing
          </h3>
          <div className="space-y-3">
            {ONGOING_SITUATIONS.map((s) => (
              <div key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="text-xs text-zinc-500">Since {eventDateLabel(s.since)}</div>
                <h4 className="mt-1 font-semibold text-zinc-100">{s.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{s.status}</p>
                <a
                  href={s.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-gold"
                >
                  {s.source.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-600">Last reviewed {eventDateLabel(UPCOMING_REVIEWED)}.</p>
        </div>
      </div>
    </section>
  );
}

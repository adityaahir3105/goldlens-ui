'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import {
  CATEGORY_META,
  EventCategory,
  HistoryData,
  HistoryEvent,
  eventDateLabel,
  monthLabel,
  pointAYearLater,
  pointIndexForDate,
} from '@/lib/history';
import { formatPct, formatUsd } from '@/lib/rewind';
import { cn } from '@/lib/utils';
import { GoldHistoryChart, Scale } from './GoldHistoryChart';

const RANGES = [
  { label: 'Since 1833', from: 1833 },
  { label: 'Since 1971', from: 1971 },
  { label: 'Since 2000', from: 2000 },
  { label: 'Last 5 years', from: 0 },
] as const;

const STORY_MS = 5000;

function Toggle<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={cn(
            'whitespace-nowrap rounded-md px-2 py-1 text-xs transition-colors sm:px-2.5 sm:text-sm',
            o.value === value ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface GoldHistoryProps {
  data: HistoryData;
  events: HistoryEvent[];
}

export function GoldHistory({ data, events }: GoldHistoryProps) {
  const { points, meta } = data;
  const lastYear = Number(points[points.length - 1].d.slice(0, 4));

  const [rangeFrom, setRangeFrom] = useState<number>(1971);
  const [scale, setScale] = useState<Scale>('log');
  const [real, setReal] = useState(false);
  const [categories, setCategories] = useState<Set<EventCategory>>(new Set(Object.keys(CATEGORY_META) as EventCategory[]));
  const [selectedId, setSelectedId] = useState<string>('nixon-shock');
  const [playing, setPlaying] = useState(false);

  const fromYear = rangeFrom === 0 ? lastYear - 5 + Number(points[points.length - 1].d.slice(5, 7)) / 12 : rangeFrom;
  // Prices in today's dollars start with the CPI in 1913.
  const effectiveFrom = real ? Math.max(fromYear, 1913) : fromYear;

  const shown = useMemo(
    () => events.filter((e) => categories.has(e.category) && Number(e.date.slice(0, 4)) + 1 > effectiveFrom),
    [events, categories, effectiveFrom]
  );

  // When filters hide the chosen event, fall back to the first one on screen.
  const activeId = shown.some((e) => e.id === selectedId) ? selectedId : (shown[0]?.id ?? null);
  const selected = events.find((e) => e.id === activeId) ?? null;
  const selectedIndex = shown.findIndex((e) => e.id === activeId);

  const step = (delta: number) => {
    if (!shown.length) return;
    const i = selectedIndex === -1 ? 0 : (selectedIndex + delta + shown.length) % shown.length;
    setSelectedId(shown[i].id);
  };

  // Story mode walks through the events on screen.
  useEffect(() => {
    if (!playing || !shown.length) return;
    const timer = setTimeout(() => {
      if (selectedIndex >= shown.length - 1) setPlaying(false);
      else setSelectedId(shown[selectedIndex + 1].id);
    }, STORY_MS);
    return () => clearTimeout(timer);
  }, [playing, selectedIndex, shown]);

  const togglePlay = () => {
    if (!playing && selectedIndex >= shown.length - 1 && shown.length) setSelectedId(shown[0].id);
    setPlaying((p) => !p);
  };

  const detail = useMemo(() => {
    if (!selected) return null;
    const i = pointIndexForDate(points, selected.date);
    const at = points[i];
    const later = pointAYearLater(points, i);
    const price = real ? at.r : at.v;
    const laterPrice = later ? (real ? later.r : later.v) : null;
    const annual = Number(at.d.slice(0, 4)) < meta.monthlyFrom;
    return {
      at,
      later,
      price,
      laterPrice,
      annual,
      change: price && laterPrice ? laterPrice / price - 1 : null,
    };
  }, [selected, points, real, meta.monthlyFrom]);

  // Headline numbers.
  const stats = useMemo(() => {
    const last = points[points.length - 1];
    const peak1980 = points.find((p) => p.d === '1980-01');
    const beat = peak1980?.r ? points.find((p) => p.d > '1980-01' && (p.r ?? 0) > (peak1980.r ?? Infinity)) : undefined;
    const pre1971 = points.find((p) => p.d === '1971-07');
    return { last, peak1980, beat, pre1971 };
  }, [points]);

  const toggleCategory = (c: EventCategory) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c) && next.size > 1) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="text-xs text-zinc-500">Latest monthly average ({monthLabel(stats.last.d, false)})</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">{formatUsd(stats.last.v)}</div>
          {stats.pre1971 && (
            <div className="text-xs text-zinc-500">
              About {Math.round(stats.last.v / stats.pre1971.v)}× the ${stats.pre1971.v} of July 1971
            </div>
          )}
        </div>
        {stats.peak1980?.r && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-xs text-zinc-500">January 1980 in today&rsquo;s dollars</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-100">{formatUsd(stats.peak1980.r)}</div>
            <div className="text-xs text-zinc-500">
              {formatUsd(stats.peak1980.v)} then, a monthly average. Inflation-adjusted, it stood as the record until{' '}
              {stats.beat ? monthLabel(stats.beat.d, false) : 'today'}.
            </div>
          </div>
        )}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="text-xs text-zinc-500">Turning points marked</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">{events.length}</div>
          <div className="text-xs text-zinc-500">Click a dot, use the arrows, or press play to walk through them.</div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Toggle
            label="Time range"
            value={rangeFrom}
            onChange={setRangeFrom}
            options={RANGES.map((r) => ({ value: r.from, label: r.label }))}
          />
          <Toggle
            label="Scale"
            value={scale}
            onChange={setScale}
            options={[
              { value: 'log', label: 'Log' },
              { value: 'linear', label: 'Linear' },
            ]}
          />
          <Toggle
            label="Dollars"
            value={real ? 'real' : 'nominal'}
            onChange={(v) => setReal(v === 'real')}
            options={[
              { value: 'nominal', label: 'Then-dollars' },
              { value: 'real', label: 'Today’s dollars' },
            ]}
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_META) as EventCategory[]).map((c) => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              aria-pressed={categories.has(c)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                categories.has(c) ? 'border-zinc-700 text-zinc-200' : 'border-zinc-800 text-zinc-600'
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: categories.has(c) ? CATEGORY_META[c].color : '#3f3f46' }} />
              {CATEGORY_META[c].label}
            </button>
          ))}
        </div>

        <GoldHistoryChart
          points={points}
          monthlyFrom={meta.monthlyFrom}
          events={shown}
          real={real}
          scale={scale}
          fromYear={effectiveFrom}
          selectedId={activeId}
          onSelect={(id) => {
            setPlaying(false);
            setSelectedId(id);
          }}
        />

        {selected && detail && (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 md:grid-cols-[1fr_auto]">
            <div aria-live="polite">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[selected.category].color }} />
                <span className="text-zinc-400">{CATEGORY_META[selected.category].label}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">{eventDateLabel(selected.date)}</span>
              </div>
              <h3 className="mt-1 text-lg font-semibold text-zinc-100">{selected.title}</h3>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-400">{selected.summary}</p>
            </div>
            <div className="flex flex-row gap-6 md:flex-col md:gap-2 md:border-l md:border-zinc-800 md:pl-4">
              <div>
                <div className="text-xs text-zinc-500">
                  {detail.annual ? `${detail.at.d.slice(0, 4)} average` : `${monthLabel(detail.at.d, false)} average`}
                </div>
                <div className="text-lg font-semibold tabular-nums text-zinc-100">
                  {detail.price ? formatUsd(detail.price, detail.price < 100 ? 2 : 0) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">A year later</div>
                <div
                  className={cn(
                    'text-lg font-semibold tabular-nums',
                    detail.change === null ? 'text-zinc-500' : detail.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {detail.change === null ? 'Not yet' : `${detail.change >= 0 ? '+' : ''}${formatPct(detail.change, 1)}`}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            {selectedIndex >= 0 ? `${selectedIndex + 1} of ${shown.length}` : ''}
            {real ? ` · Prices in ${monthLabel(meta.realDollarsOf, false)} dollars (US CPI)` : ''}
          </p>
          <div className="flex gap-2">
            <button onClick={() => step(-1)} className="rounded-md border border-zinc-800 p-1.5 text-zinc-300 hover:text-zinc-100" aria-label="Previous event">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={togglePlay}
              className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? 'Pause' : 'Play the story'}
            </button>
            <button onClick={() => step(1)} className="rounded-md border border-zinc-800 p-1.5 text-zinc-300 hover:text-zinc-100" aria-label="Next event">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

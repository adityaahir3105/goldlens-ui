'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Pause, Play } from 'lucide-react';
import { GLOBE_PERIODS, GLOBE_REVIEWED } from '@/data/globe/central-bank-gold';
import { GLOBE_COLORS, formatTonnes } from '@/lib/globe';
import { eventDateLabel } from '@/lib/history';
import { cn } from '@/lib/utils';
import { GoldGlobe } from './GoldGlobe';

export function GoldGlobeSection() {
  const [periodId, setPeriodId] = useState(GLOBE_PERIODS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(true);

  const period = GLOBE_PERIODS.find((p) => p.id === periodId) ?? GLOBE_PERIODS[0];
  const ranked = useMemo(() => [...period.entries].sort((a, b) => b.tonnes - a.tonnes), [period]);
  const maxAbs = Math.max(1, ...ranked.map((e) => Math.abs(e.tonnes)));
  const bought = ranked.filter((e) => e.tonnes > 0).reduce((s, e) => s + e.tonnes, 0);
  const sold = ranked.filter((e) => e.tonnes < 0).reduce((s, e) => s - e.tonnes, 0);

  const focusId = hoveredId ?? selectedId;
  const focused = ranked.find((e) => e.id === focusId) ?? null;

  const [focusKey, setFocusKey] = useState(0);

  const select = (id: string) => {
    setSelectedId(id);
    setFocusKey((k) => k + 1);
  };

  const selectPeriod = (id: string) => {
    setPeriodId(id);
    setSelectedId(null);
    setHoveredId(null);
  };

  return (
    <section className="mt-20 mb-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">Who is buying gold?</p>
          <h2 className="text-2xl font-bold text-zinc-100">Central banks, country by country</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Net change in official gold reserves. Drag to spin the globe, and hover or tap a country, or pick one
            from the list.
          </p>
        </div>
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-1" role="tablist" aria-label="Period">
          {GLOBE_PERIODS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === period.id}
              onClick={() => selectPeriod(p.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                p.id === period.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/60 p-2 lg:col-span-3">
          {/* Above the globe on phones, overlaid on its corner on larger screens. */}
          <div className="pointer-events-none relative z-10 mb-2 min-h-[76px] rounded-lg border border-zinc-800 bg-zinc-950/85 px-3 py-2 backdrop-blur-sm sm:absolute sm:left-4 sm:top-4 sm:mb-0 sm:max-w-[260px]">
            {focused ? (
              <>
                <div className="text-xs text-zinc-500">{period.range}</div>
                <div className="text-sm font-semibold text-zinc-100">{focused.name}</div>
                <div className="text-2xl font-bold" style={{ color: focused.tonnes >= 0 ? GLOBE_COLORS.buy : GLOBE_COLORS.sell }}>
                  {formatTonnes(focused.tonnes)}
                </div>
                {focused.note && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{focused.note}</p>}
              </>
            ) : (
              <>
                <div className="text-xs text-zinc-500">{period.range}</div>
                <div className="mt-1 text-sm text-zinc-300">
                  <span className="font-semibold" style={{ color: GLOBE_COLORS.buy }}>{formatTonnes(bought)}</span> bought,{' '}
                  <span className="font-semibold" style={{ color: GLOBE_COLORS.sell }}>{formatTonnes(-sold)}</span> sold
                </div>
                <div className="text-xs text-zinc-500">by the countries listed</div>
              </>
            )}
          </div>

          <GoldGlobe
            entries={ranked}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={select}
            spinning={spinning}
            focusKey={focusKey}
          />

          <button
            onClick={() => setSpinning((s) => !s)}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/85 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100"
            aria-pressed={!spinning}
          >
            {spinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {spinning ? 'Pause' : 'Spin'}
          </button>

          <div className="absolute bottom-4 left-4 flex gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GLOBE_COLORS.buy }} /> Bought
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GLOBE_COLORS.sell }} /> Sold
            </span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ol className="space-y-1" aria-label={`Central-bank gold, ${period.range}`}>
            {ranked.map((e, i) => {
              const active = e.id === focusId;
              const width = `${(Math.abs(e.tonnes) / maxAbs) * 100}%`;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => select(e.id)}
                    onMouseEnter={() => setHoveredId(e.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(e.id)}
                    onBlur={() => setHoveredId(null)}
                    aria-pressed={e.id === selectedId}
                    className={cn(
                      'grid w-full grid-cols-[1.25rem_6.5rem_1fr_3.5rem] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      active ? 'bg-zinc-800/80' : 'hover:bg-zinc-900'
                    )}
                  >
                    <span className="text-xs tabular-nums text-zinc-600">{i + 1}</span>
                    <span className="truncate text-zinc-200">{e.name}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-zinc-900">
                      <span
                        className="block h-full rounded-full"
                        style={{ width, background: e.tonnes >= 0 ? GLOBE_COLORS.buy : GLOBE_COLORS.sell }}
                      />
                    </span>
                    <span
                      className="text-right font-medium tabular-nums"
                      style={{ color: e.tonnes >= 0 ? GLOBE_COLORS.buy : GLOBE_COLORS.sell }}
                    >
                      {formatTonnes(e.tonnes)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 space-y-2 border-t border-zinc-800 pt-4 text-xs leading-relaxed text-zinc-500">
            <p>
              Source:{' '}
              <a href={period.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zinc-300 hover:text-gold">
                {period.source.label}
                <ExternalLink className="h-3 w-3" />
              </a>
              . Rounded, and revised by the WGC over time.
            </p>
            <p>
              Only countries named in that summary are shown. A grey country is not in this dataset, which is not the
              same as zero. Reviewed {eventDateLabel(GLOBE_REVIEWED)}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

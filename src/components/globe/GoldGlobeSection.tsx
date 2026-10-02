'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Pause, Play } from 'lucide-react';
import { GLOBE_PERIODS, GLOBE_REVIEWED } from '@/data/globe/central-bank-gold';
import { GLOBE_COLORS, entryFill, formatTonnes, monthLabel } from '@/lib/globe';
import { eventDateLabel } from '@/lib/history';
import { cn } from '@/lib/utils';
import { GoldGlobe } from './GoldGlobe';

const PERIODS = GLOBE_PERIODS;

type SortKey = 'tonnes' | 'name';

export function GoldGlobeSection() {
  const [periodId, setPeriodId] = useState(PERIODS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('tonnes');
  const [query, setQuery] = useState('');

  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[0];
  const holdings = period.kind === 'holdings';
  const ranked = useMemo(() => [...period.entries].sort((a, b) => b.tonnes - a.tonnes), [period]);
  // Net-change tabs list only the countries that moved; unchanged ones still shade the globe.
  const movers = useMemo(() => (holdings ? ranked : ranked.filter((e) => e.tonnes !== 0)), [ranked, holdings]);
  const unchanged = ranked.length - movers.length;
  const rankOf = useMemo(() => new Map(movers.map((e, i) => [e.id, i + 1])), [movers]);
  const newest = useMemo(() => ranked.reduce((m, e) => (e.asOf && e.asOf > m ? e.asOf : m), ''), [ranked]);
  const listed = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q ? movers.filter((e) => e.name.toLowerCase().includes(q)) : movers;
    return sortKey === 'name' ? [...rows].sort((a, b) => a.name.localeCompare(b.name)) : rows;
  }, [movers, query, sortKey]);
  const maxAbs = Math.max(1, ...ranked.map((e) => Math.abs(e.tonnes)));
  const bought = ranked.filter((e) => e.tonnes > 0).reduce((s, e) => s + e.tonnes, 0);
  const sold = ranked.filter((e) => e.tonnes < 0).reduce((s, e) => s - e.tonnes, 0);
  const colorOf = (tonnes: number) => (tonnes >= 0 ? GLOBE_COLORS.buy : GLOBE_COLORS.sell);

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
    setQuery('');
  };

  return (
    <section className="mt-20 mb-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
            {holdings ? 'Who holds gold?' : 'Who is buying gold?'}
          </p>
          <h2 className="text-2xl font-bold text-zinc-100">Central banks, country by country</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {holdings ? 'Total official gold reserves.' : 'Net change in official gold reserves.'} Drag to spin the
            globe, and hover or tap a country, or pick one from the list.
          </p>
        </div>
        <div className="flex flex-wrap rounded-lg border border-zinc-800 bg-zinc-900/60 p-1" role="tablist" aria-label="Period">
          {PERIODS.map((p) => (
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
                <div className="text-xs text-zinc-500">
                  {holdings && focused.asOf ? `Holdings, ${monthLabel(focused.asOf)}` : period.range}
                </div>
                <div className="text-sm font-semibold text-zinc-100">{focused.name}</div>
                <div className="text-2xl font-bold" style={{ color: colorOf(focused.tonnes) }}>
                  {formatTonnes(focused.tonnes, !holdings)}
                </div>
                {holdings && focused.sharePct !== undefined && (
                  <p className="text-xs text-zinc-400">{focused.sharePct}% of its total reserves</p>
                )}
                {focused.note && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{focused.note}</p>}
              </>
            ) : (
              <>
                <div className="text-xs text-zinc-500">{period.range}</div>
                {holdings ? (
                  <div className="mt-1 text-sm text-zinc-300">
                    <span className="font-semibold" style={{ color: GLOBE_COLORS.buy }}>{formatTonnes(bought, false)}</span> held
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-zinc-300">
                    <span className="font-semibold" style={{ color: GLOBE_COLORS.buy }}>{formatTonnes(bought)}</span> bought,{' '}
                    <span className="font-semibold" style={{ color: GLOBE_COLORS.sell }}>{formatTonnes(-sold)}</span> sold
                  </div>
                )}
                <div className="text-xs text-zinc-500">
                  {holdings
                    ? `across ${ranked.length} reporting countries`
                    : `by ${movers.length} countries; ${unchanged} more reported no change`}
                </div>
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
            {holdings ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GLOBE_COLORS.buy }} /> Brighter holds more
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GLOBE_COLORS.buy }} /> Bought
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GLOBE_COLORS.sell }} /> Sold
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-zinc-700" style={{ background: entryFill(0, 1) }} /> No
                  change
                </span>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            {ranked.length > 12 && (
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a country"
                aria-label="Find a country"
                className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
            )}
            <div className="ml-auto flex rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5 text-xs" role="group" aria-label="Sort">
              {(['tonnes', 'name'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  aria-pressed={sortKey === key}
                  className={cn(
                    'rounded px-2 py-1 transition-colors',
                    sortKey === key ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {key === 'tonnes' ? 'By tonnes' : 'A–Z'}
                </button>
              ))}
            </div>
          </div>
          <ol className="max-h-[560px] space-y-1 overflow-y-auto pr-1" aria-label={`Central-bank gold, ${period.range}`}>
            {listed.length === 0 && <li className="px-2 py-1.5 text-sm text-zinc-500">No country matches.</li>}
            {listed.map((e) => {
              const active = e.id === focusId;
              const width = `${(Math.abs(e.tonnes) / maxAbs) * 100}%`;
              return (
                <li key={e.id}>
                  <button
                    title={e.asOf ? `${e.name}, ${holdings ? '' : 'to '}${monthLabel(e.asOf)}` : e.name}
                    onClick={() => select(e.id)}
                    onMouseEnter={() => setHoveredId(e.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(e.id)}
                    onBlur={() => setHoveredId(null)}
                    aria-pressed={e.id === selectedId}
                    className={cn(
                      'grid w-full grid-cols-[1.5rem_7rem_1fr_4rem] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      active ? 'bg-zinc-800/80' : 'hover:bg-zinc-900'
                    )}
                  >
                    <span className="text-xs tabular-nums text-zinc-600">{rankOf.get(e.id)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-zinc-200">{e.name}</span>
                      {e.asOf && e.asOf !== newest && (
                        <span className="block text-[10px] leading-tight text-zinc-500">
                          {holdings ? '' : 'to '}
                          {monthLabel(e.asOf)}
                        </span>
                      )}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-zinc-900">
                      <span
                        className="block h-full rounded-full"
                        style={{ width, background: colorOf(e.tonnes) }}
                      />
                    </span>
                    <span
                      className="text-right font-medium tabular-nums"
                      style={{ color: colorOf(e.tonnes) }}
                    >
                      {formatTonnes(e.tonnes, !holdings)}
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
              .{' '}
              {holdings
                ? 'Each country is shown as of the latest month it reported, marked under its name when older than the rest.'
                : 'Holdings at the start and end of the period compared, so this is the net change. Moves under 0.05t count as no change.'}
            </p>
            {period.notesSource && (
              <p>
                Country notes:{' '}
                <a href={period.notesSource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zinc-300 hover:text-gold">
                  {period.notesSource.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
                .
              </p>
            )}
            <p>
              Central-bank reserves only, so gold held elsewhere by the state (such as Azerbaijan&apos;s oil fund or
              Turkey&apos;s Treasury) is not counted, and the IMF, ECB and BIS are not listed. A grey country did not
              report, which is not the same as zero. Reviewed {eventDateLabel(GLOBE_REVIEWED)}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

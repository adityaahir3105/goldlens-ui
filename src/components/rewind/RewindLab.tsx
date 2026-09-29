'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Dices, Pause, Play } from 'lucide-react';
import {
  RewindData,
  buildRace,
  formatUsd,
  getOutcome,
  getVerdict,
  independentWindows,
  scoreOutcomes,
  withinCoinFlipNoise,
} from '@/lib/rewind';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { RewindChart, REWIND_COLORS, buildRows, longDate } from './RewindChart';
import { DayDetail } from './DayDetail';
import { HistoryScrubber } from './HistoryScrubber';
import { RaceChart } from './RaceChart';
import { Verdict } from './Verdict';

type Mode = 'explore' | 'challenge';

interface Tally {
  rounds: number;
  you: number;
  model: number;
}

interface SegmentedProps<T extends string | number> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

function Segmented<T extends string | number>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            o.value === value ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function LegendKey({ color, dash, label, band }: { color: string; dash?: string; label: string; band?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {band ? (
        <span className="h-2.5 w-4 rounded-sm" style={{ background: color, opacity: 0.35 }} />
      ) : (
        <svg width="18" height="6" aria-hidden="true">
          <line x1="1" y1="3" x2="17" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dash} strokeLinecap="round" />
        </svg>
      )}
      {label}
    </span>
  );
}

export function RewindLab({ data }: { data: RewindData }) {
  const reduceMotion = useReducedMotion();
  const horizonOptions = [5, 10, 20]
    .filter((h) => h <= data.meta.horizon)
    .map((h) => ({ value: h, label: `${h}D` }));

  const [mode, setMode] = useState<Mode>('explore');
  const [horizon, setHorizon] = useState(horizonOptions[horizonOptions.length - 1]?.value ?? data.meta.horizon);
  const [selected, setSelected] = useState(data.forecasts.length - 1);
  const [playing, setPlaying] = useState(false);
  const [guess, setGuess] = useState<1 | -1 | null>(null);
  const [tally, setTally] = useState<Tally>({ rounds: 0, you: 0, model: 0 });

  const outcomes = useMemo(
    () => data.forecasts.map((f) => getOutcome(data, f, horizon)),
    [data, horizon]
  );
  const score = useMemo(() => scoreOutcomes(outcomes), [outcomes]);
  const verdict = getVerdict(score);
  const windows = independentWindows(data, horizon);
  const race = useMemo(() => buildRace(outcomes), [outcomes]);

  const last = outcomes.length - 1;
  const forecast = data.forecasts[selected];
  const outcome = outcomes[selected];
  const showFuture = mode === 'explore' || guess !== null;
  // Playback stops by itself once it reaches the last day.
  const isPlaying = playing && selected < last;

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => setSelected((s) => Math.min(s + 1, last)), 90);
    return () => window.clearInterval(id);
  }, [isPlaying, last]);

  const select = (index: number) => {
    setPlaying(false);
    setSelected(index);
    setGuess(null);
  };

  const randomRound = () => {
    let next = selected;
    while (next === selected && last > 0) next = Math.floor(Math.random() * (last + 1));
    select(next);
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    if (next === 'challenge') randomRound();
  };

  const makeGuess = (g: 1 | -1) => {
    if (guess !== null) return;
    setGuess(g);
    setTally((t) => ({
      rounds: t.rounds + 1,
      you: t.you + (g === outcome.actualDirection ? 1 : 0),
      model: t.model + (outcome.modelDirection === outcome.actualDirection ? 1 : 0),
    }));
  };

  const togglePlay = () => {
    if (isPlaying) {
      setPlaying(false);
      return;
    }
    if (selected >= last) setSelected(0);
    setPlaying(true);
  };

  // Same window the detail chart shows (see buildRows), highlighted on the 5-year chart.
  const windowStart = Math.max(0, forecast.cutoffIndex - (horizon * 3 + 20));
  const windowEnd = forecast.cutoffIndex + horizon;

  const tableRows = useMemo(
    () => buildRows(data, forecast, horizon, showFuture),
    [data, forecast, horizon, showFuture]
  );

  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-7 border-gold/20">
        <Verdict
          verdict={verdict}
          score={score}
          horizon={horizon}
          modelLabel={data.meta.model.label}
          windows={windows}
          directionIsNoise={withinCoinFlipNoise(score.directionHitRate, windows)}
        />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Mode"
          value={mode}
          onChange={changeMode}
          options={[
            { value: 'explore', label: 'Explore' },
            { value: 'challenge', label: 'Beat the model' },
          ]}
        />
        <Segmented label="Forecast horizon" value={horizon} onChange={setHorizon} options={horizonOptions} />
        {mode === 'explore' ? (
          <div className="flex items-center gap-1.5">
            <IconButton label="Previous day" onClick={() => select(Math.max(0, selected - 1))} disabled={selected === 0}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <IconButton label={isPlaying ? 'Pause' : 'Play through time'} onClick={togglePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </IconButton>
            <IconButton label="Next day" onClick={() => select(Math.min(last, selected + 1))} disabled={selected === last}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
        ) : (
          <button
            type="button"
            onClick={randomRound}
            className="flex h-8 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
          >
            <Dices className="h-4 w-4" />
            Random day
          </button>
        )}
      </div>

      <Card className="p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            {data.series[0].date.slice(0, 4)}–{data.series[data.series.length - 1].date.slice(0, 4)} · click anywhere to rewind
          </h3>
          <span className="text-xs text-zinc-500">
            {formatUsd(data.series[0].value)} → {formatUsd(data.series[data.series.length - 1].value)}
          </span>
        </div>
        <HistoryScrubber
          series={data.series}
          forecasts={data.forecasts}
          selected={selected}
          onSelect={select}
          horizon={horizon}
          windowStart={windowStart}
          windowEnd={windowEnd}
          concealFuture={mode === 'challenge' && guess === null}
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-4 md:p-5">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            <LegendKey color={REWIND_COLORS.price} label="Gold price" />
            <LegendKey color={REWIND_COLORS.model} dash="5 3" label="Model median" />
            <LegendKey color={REWIND_COLORS.model} band label="80% range" />
            <LegendKey color={REWIND_COLORS.naive} dash="1 3" label="No-change guess" />
          </div>
          <RewindChart
            data={data}
            forecast={forecast}
            horizon={horizon}
            showFuture={showFuture}
            animateReveal={mode === 'challenge' && !reduceMotion}
          />
          <details className="mt-4 text-xs text-zinc-400">
            <summary className="cursor-pointer select-none text-zinc-500 hover:text-zinc-300">
              Show this chart as a table
            </summary>
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-zinc-800">
              <table className="w-full tabular-nums">
                <thead className="sticky top-0 bg-zinc-900 text-left text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Gold</th>
                    <th className="px-3 py-2 font-medium">Model median</th>
                    <th className="px-3 py-2 font-medium">80% range</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => {
                    const price = r.actual ?? r.past;
                    return (
                      <tr key={r.date} className="border-t border-zinc-800/60">
                        <td className="px-3 py-1.5">{longDate(r.date)}</td>
                        <td className="px-3 py-1.5">{price !== null ? formatUsd(price, 2) : 'hidden'}</td>
                        <td className="px-3 py-1.5">{r.median !== null ? formatUsd(r.median, 2) : ''}</td>
                        <td className="px-3 py-1.5">
                          {r.band ? `${formatUsd(r.band[0])} – ${formatUsd(r.band[1])}` : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </Card>

        <Card className="p-5 md:p-6">
          <DayDetail outcome={outcome} horizon={horizon} showFuture={showFuture} />

          {mode === 'challenge' && (
            <motion.div
              key={`${selected}-${horizon}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 border-t border-zinc-800 pt-5"
            >
              {guess === null ? (
                <>
                  <p className="text-sm text-zinc-300">
                    Will gold be <span className="font-semibold">higher or lower</span> on{' '}
                    {longDate(outcome.targetDate)}?
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => makeGuess(1)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:border-gold/60"
                    >
                      <ArrowUp className="h-4 w-4" /> Higher
                    </button>
                    <button
                      type="button"
                      onClick={() => makeGuess(-1)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:border-gold/60"
                    >
                      <ArrowDown className="h-4 w-4" /> Lower
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <div className="text-xs text-zinc-500">You said</div>
                      <div className="font-semibold text-zinc-100">
                        {guess === 1 ? 'Higher' : 'Lower'} {guess === outcome.actualDirection ? '✓' : '✗'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <div className="text-xs text-zinc-500">Model said</div>
                      <div className="font-semibold text-zinc-100">
                        {outcome.modelDirection === 1 ? 'Higher' : outcome.modelDirection === -1 ? 'Lower' : 'Flat'}{' '}
                        {outcome.modelDirection === outcome.actualDirection ? '✓' : '✗'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={randomRound}
                    className="w-full rounded-lg bg-gold px-3 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-gold/90"
                  >
                    Next round
                  </button>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <span>Your score</span>
                <span className="tabular-nums text-zinc-300">
                  You {tally.you}/{tally.rounds} · Model {tally.model}/{tally.rounds}
                </span>
              </div>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Hidden while guessing: the race would give away how each rewind turned out. */}
      {mode === 'explore' && (
        <Card className="p-5 md:p-6">
          <RaceChart race={race} selected={selected} onSelect={select} modelLabel={data.meta.model.label} />
          <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
            Neighbouring rewinds share most of their future, so the {score.count} rewinds amount to about {windows}{' '}
            independent {horizon}-day tests. Treat small differences as noise.
          </p>
        </Card>
      )}
    </div>
  );
}

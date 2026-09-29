import { RewindScore, Verdict as VerdictResult, formatPct, formatUsd } from '@/lib/rewind';
import { cn } from '@/lib/utils';
import { REWIND_COLORS } from './RewindChart';

interface VerdictProps {
  verdict: VerdictResult;
  score: RewindScore;
  horizon: number;
  modelLabel: string;
  windows: number;
  directionIsNoise: boolean;
}

function coverageReading(coverage: number): string {
  if (Math.abs(coverage - 0.8) <= 0.05) return 'close to the 80% it promises, so it sizes risk reasonably well';
  return coverage < 0.8
    ? 'short of the 80% it promises, so it is a little overconfident'
    : 'more than the 80% it promises, so its range is on the cautious side';
}

function Contender({ label, color, dash, value, winner }: {
  label: string;
  color: string;
  dash?: string;
  value: number;
  winner: boolean;
}) {
  return (
    <div className={cn('rounded-xl border p-4', winner ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-950/40')}>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <svg width="18" height="6" aria-hidden="true">
          <line x1="1" y1="3" x2="17" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dash} strokeLinecap="round" />
        </svg>
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-zinc-100">{formatUsd(value)}</div>
      <div className="text-xs text-zinc-500">average miss</div>
    </div>
  );
}

function Stat({ label, value, reading }: { label: string; value: string; reading: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-zinc-100">{value}</div>
      <div className="text-xs leading-relaxed text-zinc-500">{reading}</div>
    </div>
  );
}

export function Verdict({ verdict, score, horizon, modelLabel, windows, directionIsNoise }: VerdictProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {horizon} trading days ahead · {score.count} rewinds
        </div>
        <h3 className="mt-2 text-4xl font-bold text-zinc-100 sm:text-5xl">{verdict.headline}</h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {modelLabel} against the simplest possible forecast: &ldquo;the price won&rsquo;t change&rdquo;.
          {verdict.kind === 'tie'
            ? ' Across every rewind, their average misses are within 2% of each other.'
            : verdict.kind === 'model'
              ? ' The model’s median landed closer on average.'
              : ' Guessing no change landed closer on average.'}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Contender
            label={modelLabel}
            color={REWIND_COLORS.model}
            dash="5 3"
            value={score.modelMae}
            winner={verdict.kind === 'model'}
          />
          <Contender
            label="No-change guess"
            color={REWIND_COLORS.naive}
            dash="1 3"
            value={score.naiveMae}
            winner={verdict.kind === 'naive'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 content-start gap-5 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-1 lg:pl-6 lg:border-l lg:border-zinc-800">
        <Stat
          label="Direction right"
          value={formatPct(score.directionHitRate)}
          reading={
            directionIsNoise
              ? `A coin flip gets 50%. With about ${windows} non-overlapping ${horizon}-day windows, this is within chance.`
              : `A coin flip gets 50%. Across about ${windows} non-overlapping ${horizon}-day windows, this is outside what chance would explain.`
          }
        />
        <Stat
          label="80% range caught reality"
          value={formatPct(score.coverage)}
          reading={`The actual price landed inside the model's range ${formatPct(score.coverage)} of the time: ${coverageReading(score.coverage)}.`}
        />
        <Stat
          label="Days the model was closer"
          value={formatPct(score.modelCloserRate)}
          reading="Share of rewinds where the model's median beat the no-change guess."
        />
      </div>
    </div>
  );
}

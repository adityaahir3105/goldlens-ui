import { CheckCircle2, XCircle } from 'lucide-react';
import { RewindScore, formatPct, formatUsd } from '@/lib/rewind';
import { cn } from '@/lib/utils';

interface StatProps {
  label: string;
  value: string;
  detail: string;
  good?: boolean;
}

function Stat({ label, value, detail, good }: StatProps) {
  const Icon = good ? CheckCircle2 : XCircle;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-2xl font-semibold text-zinc-100">{value}</span>
        {good !== undefined && (
          <Icon
            className={cn('h-4 w-4', good ? 'text-emerald-400' : 'text-rose-400')}
            aria-label={good ? 'better than baseline' : 'worse than baseline'}
          />
        )}
      </div>
      <div className="mt-1 text-xs leading-relaxed text-zinc-500">{detail}</div>
    </div>
  );
}

interface ScoreBoardProps {
  score: RewindScore;
  horizon: number;
  modelLabel: string;
}

export function ScoreBoard({ score, horizon, modelLabel }: ScoreBoardProps) {
  const beat = score.skill > 0;
  const skillText = `${formatPct(Math.abs(score.skill))} ${beat ? 'better' : 'worse'}`;

  return (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-300">
        Across <span className="font-semibold text-zinc-100">{score.count}</span> rewinds at a{' '}
        {horizon}-day horizon, the {modelLabel} median missed by{' '}
        <span className="font-semibold text-zinc-100">{formatUsd(score.modelMae)}</span> on average. Simply
        assuming &ldquo;no change&rdquo; missed by{' '}
        <span className="font-semibold text-zinc-100">{formatUsd(score.naiveMae)}</span>.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Error vs no-change guess"
          value={skillText}
          detail={`Average miss ${formatUsd(score.modelMae)} vs ${formatUsd(score.naiveMae)}`}
          good={beat}
        />
        <Stat
          label="Days the model was closer"
          value={formatPct(score.modelCloserRate)}
          detail="Share of rewinds where the median beat no-change"
          good={score.modelCloserRate > 0.5}
        />
        <Stat
          label="80% range caught reality"
          value={formatPct(score.coverage)}
          detail="Should be near 80%. Lower means overconfident"
          good={Math.abs(score.coverage - 0.8) <= 0.05}
        />
        <Stat
          label="Direction right"
          value={formatPct(score.directionHitRate)}
          detail="Up or down call. A coin flip gets about 50%"
          good={score.directionHitRate > 0.5}
        />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
        Neighbouring rewinds share most of their future, so these are not {score.count} independent tests.
        Treat small differences as noise.
      </p>
    </div>
  );
}

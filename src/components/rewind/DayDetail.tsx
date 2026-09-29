import { RewindOutcome, formatUsd } from '@/lib/rewind';
import { Badge } from '@/components/ui/Badge';
import { longDate, REWIND_COLORS } from './RewindChart';

interface LineKeyProps {
  color: string;
  dash?: string;
}

function LineKey({ color, dash }: LineKeyProps) {
  return (
    <svg width="18" height="6" aria-hidden="true" className="shrink-0">
      <line x1="1" y1="3" x2="17" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dash} strokeLinecap="round" />
    </svg>
  );
}

interface RowProps {
  keyColor: string;
  dash?: string;
  label: string;
  value: string;
  sub?: string;
}

function Row({ keyColor, dash, label, value, sub }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <LineKey color={keyColor} dash={dash} />
        {label}
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold tabular-nums text-zinc-100">{value}</div>
        {sub && <div className="text-[11px] text-zinc-500">{sub}</div>}
      </div>
    </div>
  );
}

interface DayDetailProps {
  outcome: RewindOutcome;
  horizon: number;
  showFuture: boolean;
}

export function DayDetail({ outcome: o, horizon, showFuture }: DayDetailProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">Rewound to</div>
      <div className="mt-1 text-lg font-semibold text-zinc-100">{longDate(o.cutoffDate)}</div>
      <div className="text-sm text-zinc-400">
        Gold closed at <span className="font-semibold text-gold">{formatUsd(o.cutoffPrice, 2)}</span>
      </div>

      <div className="mt-5 text-xs text-zinc-500">
        Looking {horizon} trading days ahead, to {longDate(o.targetDate)}
      </div>
      <div className="mt-1 divide-y divide-zinc-800">
        <Row
          keyColor={REWIND_COLORS.model}
          dash="5 3"
          label="Model median"
          value={formatUsd(o.median, 2)}
          sub={`80% range ${formatUsd(o.low)} – ${formatUsd(o.high)}`}
        />
        <Row keyColor={REWIND_COLORS.naive} dash="1 3" label="No-change guess" value={formatUsd(o.cutoffPrice, 2)} />
        <Row
          keyColor={REWIND_COLORS.price}
          label="What actually happened"
          value={showFuture ? formatUsd(o.actual, 2) : '?'}
        />
      </div>

      {showFuture && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={o.edge > 0 ? 'success' : 'danger'}>
            {o.edge > 0
              ? `Model closer by ${formatUsd(o.edge)}`
              : `No-change closer by ${formatUsd(-o.edge)}`}
          </Badge>
          <Badge variant={o.inRange ? 'success' : 'warning'}>
            {o.inRange ? 'Inside the 80% range' : 'Outside the 80% range'}
          </Badge>
        </div>
      )}
    </div>
  );
}

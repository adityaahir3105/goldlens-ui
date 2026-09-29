'use client';

import { useCallback, useRef, useState } from 'react';
import { RewindOutcome, formatUsd } from '@/lib/rewind';
import { longDate } from './RewindChart';

const MODEL_CLOSER = '#3B82F6';
const NAIVE_CLOSER = '#EA580C';
const NEUTRAL = '#3f3f46';

interface TimelineScrubberProps {
  outcomes: RewindOutcome[];
  selected: number;
  onSelect: (index: number) => void;
  // Hide who won each day (challenge mode) so the strip can't spoil the answer.
  concealResults: boolean;
}

export function TimelineScrubber({ outcomes, selected, onSelect, concealResults }: TimelineScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);

  const n = outcomes.length;
  const maxEdge = Math.max(1, ...outcomes.map((o) => Math.abs(o.edge)));

  const indexAt = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return null;
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 0.9999);
      return Math.floor(ratio * n);
    },
    [n]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const i = indexAt(e.clientX);
    if (i !== null) onSelect(i);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const i = indexAt(e.clientX);
    setHover(i);
    if (dragging.current && i !== null && i !== selected) onSelect(i);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowUp: 1,
      PageDown: -10,
      PageUp: 10,
    };
    if (e.key in moves) {
      e.preventDefault();
      onSelect(Math.min(Math.max(selected + moves[e.key], 0), n - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSelect(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSelect(n - 1);
    }
  };

  const hovered = hover !== null ? outcomes[hover] : null;
  const current = outcomes[selected];

  return (
    <div className="select-none">
      <div className="relative">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Rewind to date"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={selected}
          aria-valuetext={longDate(current.cutoffDate)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => setHover(null)}
          onKeyDown={handleKeyDown}
          className="relative h-16 cursor-ew-resize touch-none rounded-lg border border-zinc-800 bg-zinc-950/60 outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <svg
            viewBox={`0 0 ${n} 100`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <line x1="0" x2={n} y1="50" y2="50" stroke="#27272a" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {outcomes.map((o, i) => {
              const h = Math.max(2, (Math.abs(o.edge) / maxEdge) * 42);
              const up = o.edge >= 0;
              const fill = concealResults ? NEUTRAL : up ? MODEL_CLOSER : NAIVE_CLOSER;
              return (
                <rect
                  key={o.cutoffDate}
                  x={i + 0.15}
                  width={0.7}
                  y={concealResults ? 46 : up ? 50 - h : 50}
                  height={concealResults ? 8 : h}
                  fill={fill}
                  opacity={hover === i ? 1 : 0.75}
                />
              );
            })}
          </svg>

          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-gold shadow-[0_0_10px_rgba(255,215,0,0.6)]"
            style={{ left: `${((selected + 0.5) / n) * 100}%` }}
          >
            <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-zinc-900 bg-gold" />
          </div>
        </div>

        {hovered && hover !== null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900/95 px-2.5 py-1.5 text-xs shadow-xl"
            style={{ left: `${Math.min(Math.max(((hover + 0.5) / n) * 100, 12), 88)}%` }}
          >
            <div className="text-zinc-400">{longDate(hovered.cutoffDate)}</div>
            {!concealResults && (
              <div className="font-semibold text-zinc-100">
                {hovered.edge >= 0
                  ? `Model closer by ${formatUsd(hovered.edge)}`
                  : `No-change closer by ${formatUsd(-hovered.edge)}`}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>{longDate(outcomes[0].cutoffDate)}</span>
        <span>{longDate(outcomes[n - 1].cutoffDate)}</span>
      </div>
      {!concealResults && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: MODEL_CLOSER }} />
            Bar up: model closer
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: NAIVE_CLOSER }} />
            Bar down: no-change closer
          </span>
        </div>
      )}
    </div>
  );
}

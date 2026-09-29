import type { Metadata } from 'next';
import { FlaskConical, TriangleAlert } from 'lucide-react';
import backtest from '@/data/rewind/gold-backtest.json';
import { RewindData } from '@/lib/rewind';
import { RewindLab } from '@/components/rewind/RewindLab';

export const metadata: Metadata = {
  title: 'Rewind Lab | GoldLens',
  description: 'Rewind to any past day, let a forecasting model see only what was known then, and compare it with what really happened.',
};

const data = backtest as RewindData;

export default function RewindPage() {
  const { meta } = data;

  return (
    <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <section className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gold">
          <FlaskConical className="h-4 w-4" />
          Experiment
        </div>
        <h2 className="mt-2 text-3xl font-bold text-zinc-100">Rewind Lab</h2>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-zinc-200">
          Can a state-of-the-art forecasting AI beat the simplest guess of all, &ldquo;the price won&rsquo;t change&rdquo;?
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
          We rewound to hundreds of past days. Each time the model saw only the gold prices known that day,
          forecast the weeks ahead, and was scored against what really happened. Click anywhere on the chart
          to rewind yourself, or play &ldquo;Beat the model&rdquo;.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1">
            Model: <span className="text-zinc-200">{meta.model.label}</span>
          </span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1">
            Data: <span className="text-zinc-200">{meta.dataSource}</span>
          </span>
        </div>

        {meta.isSample && (
          <div className="mt-5 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p>
              <span className="font-semibold">Sample data.</span> These are synthetic prices and a toy
              model so you can try the interaction. They are not real gold prices or TimesFM results.
              Run <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-amber-100">scripts/rewind/precompute_backtest.py</code>{' '}
              to generate the real backtest.
            </p>
          </div>
        )}
      </section>

      <RewindLab data={data} />

      <p className="mt-8 text-center text-xs text-zinc-600">
        A backtest of past days only. Nothing here is a forecast of future prices or investment advice.
      </p>
    </div>
  );
}

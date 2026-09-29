import type { Metadata } from 'next';
import { Swords, TriangleAlert } from 'lucide-react';
import backtest from '@/data/rewind/gold-backtest.json';
import { RewindData } from '@/lib/rewind';
import { toDuelData } from '@/lib/duel';
import { GoldDuel } from '@/components/duel/GoldDuel';

export const metadata: Metadata = {
  title: 'Gold Duel | GoldLens',
  description: 'Trade gold against a TimesFM-driven AI over a hidden stretch of real prices.',
};

const raw = backtest as RewindData;
// Only one forecast step per round is sent to the browser.
const data = toDuelData(raw);

export default function DuelPage() {
  return (
    <div className="w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gold">
          <Swords className="h-4 w-4" />
          Game
        </div>
        <h2 className="mt-2 text-3xl font-bold text-zinc-100">Gold Duel</h2>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-zinc-200">
          Can you manage gold better than a forecasting AI? Same credits, same prices, ten rounds.
        </p>
        {raw.meta.isSample && (
          <div className="mt-5 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p>
              <span className="font-semibold">Sample data.</span> Synthetic prices and a toy model, not real gold prices or TimesFM
              forecasts.
            </p>
          </div>
        )}
      </section>

      <GoldDuel data={data} />

      <p className="mt-8 text-center text-xs text-zinc-600">
        A game on past prices using {raw.meta.model.label} forecasts from the Rewind Lab backtest. Not investment advice.
      </p>
    </div>
  );
}

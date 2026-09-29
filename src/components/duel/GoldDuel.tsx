'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bot, Check, Copy, RotateCcw, Swords, Trophy, User } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DuelData,
  Portfolio,
  ROUNDS,
  START_CREDITS,
  aiAllocation,
  applyMove,
  chanceUp,
  randomStart,
  rebalance,
  total,
} from '@/lib/duel';
import { formatPct } from '@/lib/rewind';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { REWIND_COLORS, longDate } from '@/components/rewind/RewindChart';
import { daysBetween } from '@/lib/history';
import { DuelChart } from './DuelChart';

type Phase = 'intro' | 'deciding' | 'revealed' | 'done';

interface RoundLog {
  userShare: number;
  aiShare: number;
  pUp: number;
  move: number;
  days: number;
  user: number;
  ai: number;
  hold: number;
}

const SHARES = [0, 0.25, 0.5, 0.75, 1];
const START: Portfolio = { cash: START_CREDITS, gold: 0 };

function credits(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}

function signed(v: number, digits = 1): string {
  return `${v >= 0 ? '+' : '−'}${formatPct(Math.abs(v), digits)}`;
}

function PlayerCard({
  who,
  icon,
  balance,
  share,
  highlight,
  color,
}: {
  who: string;
  icon: React.ReactNode;
  balance: number;
  share: number;
  highlight: boolean;
  color: string;
}) {
  const change = balance / START_CREDITS - 1;
  return (
    <div className={cn('rounded-xl border p-4 transition-colors', highlight ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/40')}>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        {icon}
        {who}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-100 sm:text-3xl">{credits(balance)}</div>
      <div className={cn('text-xs tabular-nums', change >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{signed(change, 2)}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800" title={`${formatPct(share)} in gold`}>
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${share * 100}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-zinc-500">{formatPct(share)} in gold</div>
    </div>
  );
}

interface GoldDuelProps {
  data: DuelData;
}

export function GoldDuel({ data }: GoldDuelProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('intro');
  const [start, setStart] = useState(0);
  const [round, setRound] = useState(0);
  const [share, setShare] = useState(0.5);
  const [user, setUser] = useState<Portfolio>(START);
  const [ai, setAi] = useState<Portfolio>(START);
  const [log, setLog] = useState<RoundLog[]>([]);
  const [copied, setCopied] = useState(false);

  const f = data.forecasts[start + round];
  const firstIndex = data.forecasts[start].cutoffIndex;
  const price = data.series[f.cutoffIndex].value;
  const next = data.series[f.targetIndex].value;
  const last = log[log.length - 1];

  const begin = () => {
    setStart(randomStart(data));
    setRound(0);
    setShare(0.5);
    setUser(START);
    setAi(START);
    setLog([]);
    setCopied(false);
    setPhase('deciding');
  };

  const lockIn = () => {
    const pUp = chanceUp(f, price);
    const aiShare = aiAllocation(pUp);
    const userAfter = applyMove(rebalance(user, share), price, next);
    const aiAfter = applyMove(rebalance(ai, aiShare), price, next);
    const firstPrice = data.series[firstIndex].value;
    setUser(userAfter);
    setAi(aiAfter);
    setLog((l) => [
      ...l,
      {
        userShare: share,
        aiShare,
        pUp,
        move: next / price - 1,
        days: daysBetween(data.series[f.cutoffIndex].date, data.series[f.targetIndex].date),
        user: total(userAfter),
        ai: total(aiAfter),
        hold: START_CREDITS * (next / firstPrice),
      },
    ]);
    setPhase('revealed');
  };

  const advance = () => {
    if (round + 1 >= ROUNDS) {
      setPhase('done');
      return;
    }
    setRound(round + 1);
    setPhase('deciding');
  };

  const roundIndices = useMemo(() => {
    const out: number[] = [];
    for (let r = 0; r <= round && phase !== 'intro'; r++) out.push(data.forecasts[start + r].cutoffIndex);
    return out;
  }, [data, start, round, phase]);

  const userShareNow = total(user) > 0 ? user.gold / total(user) : 0;
  const aiShareNow = total(ai) > 0 ? ai.gold / total(ai) : 0;
  const trade = share * total(user) - user.gold;

  if (phase === 'intro') {
    return (
      <Card className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
          <Swords className="h-6 w-6 text-gold" />
        </div>
        <h3 className="mt-4 text-2xl font-bold text-zinc-100">You vs {data.modelLabel}</h3>
        <ul className="mx-auto mt-4 max-w-xl space-y-2 text-left text-sm leading-relaxed text-zinc-400">
          <li>• You both start with {credits(START_CREDITS)} credits and play {ROUNDS} rounds on a hidden stretch of real gold prices.</li>
          <li>• Each round, choose how much of your credits to hold in gold. The rest sits in cash and doesn&rsquo;t move.</li>
          <li>
            • The AI decides from a real {data.modelLabel} forecast made with prices up to that day only. It holds more gold when
            it rates a rise as more likely.
          </li>
          <li>• Dates stay hidden until the end, so you can&rsquo;t just remember what happened.</li>
        </ul>
        <button
          onClick={begin}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-gold/90"
        >
          <Swords className="h-4 w-4" />
          Start the duel
        </button>
      </Card>
    );
  }

  const visibleEnd = phase === 'deciding' ? f.cutoffIndex : f.targetIndex;
  const firstPrice = data.series[firstIndex].value;

  if (phase === 'done') {
    const you = total(user);
    const them = total(ai);
    const hold = last?.hold ?? START_CREDITS;
    const diff = you / them - 1;
    const outcome = Math.abs(diff) < 0.0005 ? 'tie' : diff > 0 ? 'you' : 'ai';
    const lastIndex = data.forecasts[start + ROUNDS - 1].targetIndex;
    const chart = [
      { round: 0, you: START_CREDITS, ai: START_CREDITS, hold: START_CREDITS },
      ...log.map((l, i) => ({ round: i + 1, you: l.user, ai: l.ai, hold: l.hold })),
    ];
    const summary =
      outcome === 'tie'
        ? `I tied ${data.modelLabel} in Gold Duel on GoldLens.`
        : outcome === 'you'
          ? `I beat ${data.modelLabel} at Gold Duel by ${formatPct(diff, 1)} on GoldLens.`
          : `${data.modelLabel} beat me at Gold Duel by ${formatPct(-diff, 1)} on GoldLens.`;

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <Trophy className="h-4 w-4 text-gold" />
                Final result
              </div>
              <motion.h3
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-4xl font-bold text-zinc-100"
              >
                {outcome === 'tie' ? 'A draw.' : outcome === 'you' ? 'You win!' : `${data.modelLabel} wins.`}
              </motion.h3>
              <p className="mt-2 text-sm text-zinc-400">
                You finished on <span className="font-semibold text-zinc-100">{credits(you)}</span>, the AI on{' '}
                <span className="font-semibold text-zinc-100">{credits(them)}</span>. Simply buying gold on day one and holding it would
                have ended on <span className="font-semibold text-zinc-100">{credits(hold)}</span>.
              </p>
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm">
                <div className="text-xs text-zinc-500">The hidden period was</div>
                <div className="font-medium text-zinc-100">
                  {longDate(data.series[firstIndex].date)} to {longDate(data.series[lastIndex].date)}
                </div>
                <div className="text-xs text-zinc-400">
                  Gold went from ${credits(firstPrice)} to ${credits(data.series[lastIndex].value)} (
                  {signed(data.series[lastIndex].value / firstPrice - 1)}).
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={begin}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-gold/90"
                >
                  <RotateCcw className="h-4 w-4" />
                  Play another period
                </button>
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy result'}
                </button>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 260 }}>
                  <LineChart data={chart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={REWIND_COLORS.grid} vertical={false} />
                    <XAxis
                      dataKey="round"
                      tickFormatter={(r: number) => (r === 0 ? 'Start' : `R${r}`)}
                      tick={{ fill: REWIND_COLORS.axis, fontSize: 11 }}
                      axisLine={{ stroke: REWIND_COLORS.grid }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tickFormatter={(v: number) => credits(v)}
                      tick={{ fill: REWIND_COLORS.axis, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(r) => (r === 0 ? 'Start' : `After round ${r}`)}
                      formatter={(v, name) => [credits(Number(v)), name]}
                    />
                    <Line dataKey="you" name="You" stroke={REWIND_COLORS.price} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={!reduceMotion} animationDuration={700} />
                    <Line dataKey="ai" name={data.modelLabel} stroke={REWIND_COLORS.model} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={!reduceMotion} animationDuration={700} />
                    <Line dataKey="hold" name="Buy and hold" stroke={REWIND_COLORS.naive} strokeDasharray="4 3" strokeWidth={1.5} dot={false} isAnimationActive={!reduceMotion} animationDuration={700} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: REWIND_COLORS.price }} />You</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: REWIND_COLORS.model }} />{data.modelLabel}</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed" style={{ borderColor: REWIND_COLORS.naive }} />Buy and hold</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Round by round</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500">
                  <th className="pb-2 font-medium">Round</th>
                  <th className="pb-2 font-medium">Gold moved</th>
                  <th className="pb-2 font-medium">You held</th>
                  <th className="pb-2 font-medium">AI held</th>
                  <th className="pb-2 font-medium">AI&rsquo;s chance of a rise</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {log.map((l, i) => (
                  <tr key={i} className="border-t border-zinc-800/80">
                    <td className="py-1.5 text-zinc-400">{i + 1}</td>
                    <td className={cn('py-1.5', l.move >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{signed(l.move, 2)}</td>
                    <td className="py-1.5 text-zinc-200">{formatPct(l.userShare)}</td>
                    <td className="py-1.5 text-zinc-200">{formatPct(l.aiShare)}</td>
                    <td className="py-1.5 text-zinc-400">{formatPct(l.pUp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  const revealed = phase === 'revealed' && last;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <PlayerCard
          who="You"
          icon={<User className="h-3.5 w-3.5" />}
          balance={total(user)}
          share={phase === 'deciding' ? share : userShareNow}
          highlight={!!revealed && last.user > last.ai}
          color={REWIND_COLORS.price}
        />
        <PlayerCard
          who={data.modelLabel}
          icon={<Bot className="h-3.5 w-3.5" />}
          balance={total(ai)}
          share={revealed ? last.aiShare : aiShareNow}
          highlight={!!revealed && last.ai > last.user}
          color={REWIND_COLORS.model}
        />
        <div className="col-span-2 flex flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-baseline justify-between text-xs text-zinc-400">
            <span>
              Round <span className="font-semibold text-zinc-100">{round + 1}</span> of {ROUNDS}
            </span>
            <span>Gold since start: {signed(data.series[visibleEnd].value / firstPrice - 1, 2)}</span>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: ROUNDS }, (_, i) => {
              const l = log[i];
              return (
                <div
                  key={i}
                  className={cn(
                    'h-2 flex-1 rounded-full',
                    !l ? (i === round ? 'bg-zinc-500' : 'bg-zinc-800') : l.user > l.ai ? 'bg-gold' : l.user < l.ai ? 'bg-blue-500' : 'bg-zinc-400'
                  )}
                  title={l ? `Round ${i + 1}` : undefined}
                />
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">Each segment turns gold if you were ahead after that round, blue if the AI was.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Gold price, start = 100</h3>
            <span className="text-xs text-zinc-500">Dates hidden</span>
          </div>
          <DuelChart
            data={data}
            startIndex={firstIndex}
            visibleEnd={visibleEnd}
            roundIndices={roundIndices}
            forecast={revealed ? f : null}
          />
          <p className="mt-2 text-xs text-zinc-500">
            x-axis: price points since the first round. Grey is history before the duel.
            {revealed ? ' Blue is the range the AI expected for this round.' : ''}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          {phase === 'deciding' ? (
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">How much of your credits in gold?</h3>
              <p className="mt-1 text-sm text-zinc-400">
                The next price arrives a few days from now. Cash stays at its value; gold moves with the price.
              </p>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-4xl font-bold tabular-nums text-gold">{formatPct(share)}</span>
                <span className="text-sm tabular-nums text-zinc-400">{credits(share * total(user))} credits</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(share * 100)}
                onChange={(e) => setShare(Number(e.target.value) / 100)}
                aria-label="Share of credits in gold"
                className="mt-3 w-full accent-[#FFD700]"
              />
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {SHARES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setShare(s)}
                    aria-pressed={Math.abs(share - s) < 1e-9}
                    className={cn(
                      'rounded-md border px-1 py-1.5 text-xs transition-colors',
                      Math.abs(share - s) < 1e-9 ? 'border-gold/60 bg-gold/10 text-gold' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    {s === 0 ? 'Cash' : s === 1 ? 'All in' : formatPct(s)}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-zinc-400">
                {Math.abs(trade) < 1
                  ? 'No trade: you keep your current mix.'
                  : trade > 0
                    ? `You'll buy ${credits(trade)} credits of gold.`
                    : `You'll sell ${credits(-trade)} credits of gold.`}
              </p>
              <button
                onClick={lockIn}
                className="mt-5 w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-zinc-950 hover:bg-gold/90"
              >
                Lock in and reveal
              </button>
            </div>
          ) : (
            revealed && (
              <motion.div initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-xs text-zinc-500">{last.days} days later</div>
                <h3 className={cn('text-3xl font-bold tabular-nums', last.move >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  Gold {signed(last.move, 2)}
                </h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-2">
                    <span className="text-zinc-400">You held {formatPct(last.userShare)}</span>
                    <span className="font-semibold tabular-nums text-zinc-100">{signed(last.userShare * last.move, 2)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-2">
                    <span className="text-zinc-400">AI held {formatPct(last.aiShare)}</span>
                    <span className="font-semibold tabular-nums text-zinc-100">{signed(last.aiShare * last.move, 2)}</span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs leading-relaxed text-zinc-300">
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-blue-300">
                    <Bot className="h-3.5 w-3.5" />
                    Why the AI chose {formatPct(last.aiShare)}
                  </div>
                  {data.modelLabel} expected {signed(f.median / price - 1, 2)} by this round, with an 80% range of{' '}
                  {signed(f.low / price - 1, 1)} to {signed(f.high / price - 1, 1)}. That puts the chance of a rise at{' '}
                  {formatPct(last.pUp)}, so it held {formatPct(last.aiShare)} in gold.
                </div>
                <button
                  onClick={advance}
                  className="mt-5 w-full rounded-lg bg-gold py-2.5 text-sm font-semibold text-zinc-950 hover:bg-gold/90"
                >
                  {round + 1 >= ROUNDS ? 'See the result' : 'Next round'}
                </button>
              </motion.div>
            )
          )}
        </Card>
      </div>
    </div>
  );
}

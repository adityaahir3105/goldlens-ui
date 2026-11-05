# GoldLens UI

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 dashboard for gold macro risk.
Charts: Recharts. Globe: d3-geo + topojson-client + world-atlas. Animation: framer-motion. Icons: lucide-react.
Backend is a separate repo (goldlens-core), reached via `NEXT_PUBLIC_API_BASE`; wrappers live in `src/lib/api.ts`.

## Map
- `src/app/` – routes: `/` dashboard, `/rewind`, `/history`, `/duel`, `/land` (Gujarat land notices; Leaflet map)
- `src/components/<feature>/` – cards, charts, globe, history, rewind, duel, ui
- `src/lib/<feature>.ts` – logic per feature; shared types in `src/lib/types.ts`
- `src/data/` – static data (see below); `scripts/` – Python generators for that data (`scripts/land/` also has a Node builder: `npm run land:build`)

## Commands (CI runs exactly these)
- `npm run lint`
- `npm run typecheck`
- `npm run build` only when a change touches routing, config or server components

## Large generated files – do not open whole
- `src/data/rewind/gold-backtest.json` (~330 KB, from `scripts/rewind/precompute_backtest.py`)
- `src/data/history/gold-history.json` (from `scripts/history/build_gold_history.py`)
- `package-lock.json`
Read is denied for these in `.claude/settings.json`. Their shapes are typed in code:
backtest = `RewindData` in `src/lib/rewind.ts`, history = `HistoryData` in `src/lib/history.ts`.
To change the data, edit and re-run the generator script rather than the JSON.

## Conventions
- Copy is calm and analytical: no buy/sell advice or price predictions.
- Every data figure carries its source (see README "History and globe data").
- Components that use browser APIs or hooks need `"use client"`. Lint forbids calling setState directly inside effects.

## Compact instructions
When compacting, keep: the current task, files changed, decisions made, failing checks. Drop file dumps.

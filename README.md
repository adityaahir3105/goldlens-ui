# GoldLens UI

A production-quality macro risk analytics dashboard for gold market exposure analysis.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** (Dark theme with gold accent)
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Lucide Icons**

## Features

- **Gold Risk Assessment** - Real-time risk level display (LOW/MEDIUM/HIGH) with color-coded indicators
- **Macro Indicators** - Key economic indicators with signal badges and confidence levels
- **AI Explainability** - Expandable sections explaining risk assessments and indicator meanings
- **Server-Side Rendering** - SSR for fast initial load without flicker
- **Graceful Error Handling** - Friendly messages when data is unavailable
- **Rewind Lab** (`/rewind`) - Backtest of a time-series foundation model (TimesFM) on gold: rewind to any past day, compare the model's forecast with what happened and with a "no change" guess, or play "Beat the model"
- **Central-bank globe** (dashboard) - Interactive 3D globe of net central-bank gold buying and selling by country (World Gold Council figures)
- **History** (`/history`) - Gold prices since 1833 with key events, log/linear and inflation-adjusted views, a story mode, and upcoming scheduled events
- **Gold Duel** (`/duel`) - A 10-round game: you and a TimesFM-driven AI split credits between gold and cash over a hidden stretch of real prices

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with header/footer
│   ├── page.tsx            # Main dashboard (Server Component)
│   └── globals.css         # Global styles and theme
├── components/
│   ├── cards/
│   │   ├── GoldRiskCard.tsx
│   │   ├── IndicatorCard.tsx
│   │   └── AIExplainSection.tsx
│   ├── charts/
│   │   └── IndicatorMiniChart.tsx
│   ├── ui/
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── Spinner.tsx
│   └── DashboardClient.tsx
└── lib/
    ├── api.ts              # API fetch wrappers
    ├── types.ts            # TypeScript interfaces
    └── utils.ts            # Helper functions
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:8081`

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file:

```
NEXT_PUBLIC_API_BASE=http://localhost:8081
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

The dashboard consumes the following REST endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gold-risk/latest` | GET | Latest gold risk snapshot |
| `/api/indicators` | GET | List of all indicators |
| `/api/indicators/{code}/latest` | GET | Latest value for an indicator |
| `/api/signals/{code}/latest` | GET | Latest signal for an indicator |
| `/api/ai/explain/gold-risk` | POST | AI explanation for gold risk |
| `/api/ai/explain/indicator` | POST | AI explanation for an indicator |
| `/api/ai/explain/signal` | POST | AI explanation for a signal |
| `/api/gold-price/latest` | GET | Latest gold spot price |
| `/api/gold/price/history` | GET | Gold price history (30D) |
| `/api/indicators/{code}/history` | GET | Indicator history (30D) |

## Rewind Lab backtest

The Rewind Lab page and Gold Duel read a precomputed backtest from
`src/data/rewind/gold-backtest.json`. Generate or refresh it with TimesFM:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r scripts/rewind/requirements.txt

# Recommended: years of daily history from gold-api.com (free tier: 10 requests/hour,
# one request per year of history), saved to CSV so re-runs don't spend requests
read -rs GOLD_API_COM_KEY && export GOLD_API_COM_KEY
python scripts/rewind/precompute_backtest.py --source gold-api-com --years 5 --save-csv gold-history.csv

# Re-run from the saved CSV (e.g. to try --model timesfm-3.0 or another --horizon)
python scripts/rewind/precompute_backtest.py --source csv --csv gold-history.csv

# Or the backend's own gold history (only a few months, so few rewind days)
python scripts/rewind/precompute_backtest.py --source api --api-base "$NEXT_PUBLIC_API_BASE"
```

Then rebuild the app. Only past days whose outcome is already known are written, so the page
never shows a forward-looking forecast. `--model timesfm-3.0` is available for experiments,
but its weights are licensed for non-commercial, non-production use only.

## History and globe data

- `src/data/history/gold-history.json` holds monthly gold prices (World Bank Pink Sheet from 1960,
  annual Timothy Green figures before that) and the same prices in today's dollars (US CPI-U).
  Refresh it with `python scripts/history/build_gold_history.py` (no API key needed).
- `src/data/history/events.ts` (historical events) and `src/data/history/upcoming.ts` (scheduled
  events, each with a source link) are curated by hand. Past upcoming events hide themselves;
  review the list when it runs low.
- `src/data/globe/central-bank-gold.ts` holds net central-bank purchases by country as reported
  by the World Gold Council, with the source for each period. Countries not named in those
  summaries are left out rather than shown as zero.

## Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   In Vercel project settings → Environment Variables, add:

   | Variable | Value | Required |
   |----------|-------|----------|
   | `NEXT_PUBLIC_API_BASE` | Your backend API URL (e.g., `https://api.goldlens.example.com`) | Yes |

   > ⚠️ **Important**: Do not include a trailing slash in the API URL.

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | Backend API base URL | `https://api.goldlens.example.com` |

### Backend Requirements

The frontend expects the backend API to be accessible at the configured `NEXT_PUBLIC_API_BASE` URL. Ensure:

- Backend is deployed and publicly accessible (or accessible from Vercel's network)
- CORS is configured to allow requests from your Vercel domain
- All API endpoints listed below are available

## Design Principles

- **Risk Awareness** - This is an analytical dashboard, not a trading UI
- **No Trading Advice** - No buy/sell recommendations or price predictions
- **Professional Tone** - Finance-grade, calm copy throughout
- **Graceful Degradation** - Clear messaging when data is unavailable

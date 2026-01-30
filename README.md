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

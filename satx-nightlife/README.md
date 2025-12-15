# SATX Nightlife Power Rankings

A mobile-first PWA for discovering the hottest nightlife spots in San Antonio, Texas.

## Features

- **Tonight Rankings**: Real-time leaderboard of what's hot right now
- **Monthly Power Rankings**: Monthly standings based on aggregated signals
- **Trending Movers**: See which venues are rising or falling
- **Year in Review**: YTD standings and historical data
- **Deals**: Happy hour specials and promotions
- **Expert Picks**: Curated selections from local nightlife experts

## Tech Stack

### Backend (Cloudflare Workers)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Storage**: Cloudflare R2
- **Queues**: Cloudflare Queues

### Frontend (Cloudflare Pages)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand + SWR
- **PWA**: vite-plugin-pwa

## Project Structure

```
satx-nightlife/
├── packages/
│   ├── api/           # Cloudflare Worker API
│   │   ├── src/
│   │   │   ├── connectors/    # Data source connectors
│   │   │   ├── db/            # D1 schema
│   │   │   ├── jobs/          # Cron job handlers
│   │   │   ├── lib/           # Utility libraries
│   │   │   ├── routes/        # API route handlers
│   │   │   ├── services/      # Business logic
│   │   │   └── index.ts       # Main entry point
│   │   └── wrangler.toml      # Worker configuration
│   │
│   └── web/           # React PWA frontend
│       ├── src/
│       │   ├── components/    # UI components
│       │   ├── context/       # React context
│       │   ├── hooks/         # Custom hooks
│       │   └── pages/         # Page components
│       └── vite.config.ts     # Vite configuration
│
├── package.json
└── pnpm-workspace.yaml
```

## Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Cloudflare account with Workers, D1, KV, R2, and Queues enabled

### Environment Variables

Copy `.dev.vars.example` to `.dev.vars` in the `packages/api` directory:

```bash
cp packages/api/.dev.vars.example packages/api/.dev.vars
```

Required API keys:
- **GOOGLE_API_KEY**: Google Places API key
- **YELP_API_KEY**: Yelp Fusion API key
- **EVENTBRITE_API_KEY**: (Optional) Eventbrite API key
- **ADMIN_API_KEY**: Admin route authentication key

### Installation

```bash
# Install dependencies
pnpm install

# Initialize D1 database
cd packages/api
wrangler d1 create satx-nightlife-db
wrangler d1 execute satx-nightlife-db --file=src/db/schema.sql

# Create KV namespace
wrangler kv:namespace create CACHE
wrangler kv:namespace create CONFIG

# Create R2 bucket
wrangler r2 bucket create satx-nightlife-storage

# Create Queue
wrangler queues create satx-nightlife-queue
```

### Development

```bash
# Start API (Worker)
cd packages/api
pnpm dev

# Start frontend (in another terminal)
cd packages/web
pnpm dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the Worker.

### Deployment

```bash
# Deploy API
cd packages/api
pnpm run deploy

# Deploy frontend
cd packages/web
pnpm run build
wrangler pages deploy dist
```

## API Routes

### Leaderboards
- `GET /api/leaderboards/tonight` - Tonight's hot spots
- `GET /api/leaderboards/monthly` - Monthly power rankings
- `GET /api/leaderboards/trending` - Trending movers
- `GET /api/leaderboards/year` - YTD standings

### Venues
- `GET /api/venues/search` - Search venues
- `GET /api/venues/:id` - Venue details

### Deals
- `GET /api/deals` - List deals
- `POST /api/deals` - Submit a deal

### Admin
- `POST /api/admin/config` - Update configuration
- `POST /api/admin/expert-picks` - Manage expert picks
- `GET /api/admin/audit-log` - View audit log

## Scoring System

### Tonight Popularity Score
- Bayesian-adjusted rating (scaled to 0-100)
- Event boost (+10 for venues with events)
- Expert pick boost (+15 for #1, +12 for #2, etc.)

### Monthly Power Score
- 60% Bayesian-adjusted rating
- 20% Engagement (log-scaled reviews + check-ins)
- 10% Consistency (active days / 30)
- 10% Events bonus

### Trending Score
- Rating momentum (7-day vs 3-week average)
- Review velocity (growth rate)

## Expert Picks

The following venues receive curator boost:
1. George's Keep
2. Camp 1604
3. Kung Fu Noodle
4. The Venue

## Data Sources

- **Google Places API**: Venue search, ratings, photos
- **Yelp Fusion API**: Ratings, reviews, business details
- **Eventbrite API**: Event listings

All data collection complies with API Terms of Service. No scraping or unauthorized data access.

## Ethics & Safety

- Rideshare shortcuts integrated for safe transportation
- "Please drink responsibly" messaging
- Neutral language for deals (no pressure to overconsume)
- No personal data collection without consent

## License

MIT

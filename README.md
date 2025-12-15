# SATX Nightlife Power Rankings

A mobile-first Progressive Web App (PWA) for transparent, data-driven nightlife rankings in San Antonio NW and Boerne.

## Features

- **Tonight's Top Picks**: Geolocation-based recommendations with live scoring
- **Monthly Power Rankings**: Transparent rankings updated daily
- **Trending Movers**: See which venues are rising and falling
- **Year Timeline/YTD**: Track venue performance throughout the year
- **Transparent Scoring**: Fully documented scoring methodology with visible weights
- **Expert Picks**: Curated recommendations with transparent boost factors

### Expert-Picked Venues

- **George's Keep** - Award-winning craft cocktail bar (+15% boost)
- **Camp 1604** - Premier NW SA destination (+12% boost)
- **Kung Fu Noodle** - Unique late-night spot (+10% boost)
- **The Venue** - Top Boerne entertainment (+10% boost)

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **Data Fetching**: SWR with stale-while-revalidate caching
- **Database**: PostgreSQL with PostGIS extension
- **APIs**: Google Places API, Yelp Fusion API (ToS compliant)
- **PWA**: Service Worker, Web App Manifest, offline support

## Scoring Methodology

Our power score combines multiple factors with transparent weights:

| Factor | Weight | Description |
|--------|--------|-------------|
| Google Rating | 20% | Official Google Places rating |
| Yelp Rating | 15% | Official Yelp Fusion rating |
| Review Momentum | 5% | Recent review activity trend |
| Deals & Specials | 10% | Active happy hours and promotions |
| Events Tonight | 10% | Live events happening now |
| Social Buzz | 5% | Social media activity (where permitted) |
| Proximity | 10% | Distance from user location |
| Open Now | 5% | Currently open bonus |
| Expert Pick | 10% | Curated expert recommendations |
| Trending | 10% | Week-over-week momentum |

**Formula**: `Power Score = (Weighted Factor Sum) × Expert Boost Multiplier`

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL with PostGIS extension
- Google Places API key
- Yelp Fusion API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/satx-nightlife-power-rankings.git
cd satx-nightlife-power-rankings

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## API Routes

| Endpoint | Description |
|----------|-------------|
| `GET /api/tonight` | Tonight's top picks with live scoring |
| `GET /api/venues` | All venues with optional filters |
| `GET /api/venues/[slug]` | Single venue details with YTD stats |
| `GET /api/rankings` | Monthly power rankings |
| `GET /api/trending` | Trending movers up/down |
| `GET /api/scoring` | Scoring methodology documentation |

## Coverage Area

San Antonio metro area with focus on:
- The Rim
- La Cantera
- Stone Oak
- The Pearl
- Boerne
- Dominion

## Data Sources

All data is collected via official APIs in compliance with Terms of Service:
- **Google Places API** - Ratings, reviews, business info
- **Yelp Fusion API** - Ratings, reviews, categories
- **Internal Database** - Curated deals, events, expert picks

**No web scraping or ToS violations.**

## License

MIT License
